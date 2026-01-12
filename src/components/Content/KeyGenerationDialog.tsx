import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface KeyGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyGenerated: () => void;
  destinationUrl: string;
}

const SHORTENER_API = 'https://vplink.in/api';
const API_KEY = '84d659adb9b96babaca0a088e1871b56cf074b54';
const KEY_EXPIRY_TIME = 2 * 60 * 60 * 1000;

export function KeyGenerationDialog({ open, onOpenChange, onKeyGenerated, destinationUrl }: KeyGenerationDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [waitingForCode, setWaitingForCode] = useState(false);

  useEffect(() => {
    if (!open) {
      setVerificationCode('');
      setInputCode('');
      setWaitingForCode(false);
      setLoading(false);
    } else {
      // Check if code is in sessionStorage (from verification page)
      const storedCode = sessionStorage.getItem('verificationCode');
      if (storedCode && storedCode.length === 10) {
        setInputCode(storedCode);
        sessionStorage.removeItem('verificationCode');
        // Auto-verify after a short delay
        setTimeout(() => {
          verifyCodeWithValue(storedCode);
        }, 500);
      }
    }
  }, [open]);

  // Check if the input is an admin bypass key
  const checkAdminBypassKey = async (code: string): Promise<boolean> => {
    try {
      const keysRef = collection(db, 'adminGeneratedKeys');
      const q = query(keysRef, where('code', '==', code), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return false;
      }

      const keyDoc = snapshot.docs[0];
      const keyData = keyDoc.data();
      
      // Check if key has remaining uses
      if (keyData.usedCount >= keyData.maxUses) {
        toast.error('This bypass key has expired (max uses reached)');
        return false;
      }

      // Increment the used count
      await updateDoc(doc(db, 'adminGeneratedKeys', keyDoc.id), {
        usedCount: increment(1)
      });

      // Set download key expiry
      const expiryTime = Date.now() + KEY_EXPIRY_TIME;
      localStorage.setItem('downloadKeyExpiry', expiryTime.toString());
      
      const remainingUses = keyData.maxUses - keyData.usedCount - 1;
      toast.success(`✅ Bypass key used! Download key activated for 2 hours. (${remainingUses} uses remaining)`);
      
      return true;
    } catch (error) {
      console.error('Error checking bypass key:', error);
      return false;
    }
  };

  const verifyCodeWithValue = async (codeValue: string) => {
    if (!user || !codeValue.trim()) {
      return;
    }

    setLoading(true);
    try {
      // First check if it's an admin bypass key (format: XXXX-XXXX-XXXX)
      if (codeValue.includes('-')) {
        const isBypassKey = await checkAdminBypassKey(codeValue);
        if (isBypassKey) {
          setTimeout(() => {
            onKeyGenerated();
            onOpenChange(false);
          }, 1000);
          return;
        }
      }

      // Otherwise, check regular verification code
      const codeDoc = await getDoc(doc(db, 'verification_codes', user.uid));
      
      if (!codeDoc.exists()) {
        toast.error('No verification code found. Please generate a new one.');
        setInputCode('');
        setLoading(false);
        return;
      }

      const storedData = codeDoc.data();
      
      if (storedData.used) {
        toast.error('This code has already been used. Please generate a new one.');
        setInputCode('');
        setLoading(false);
        return;
      }

      if (codeValue.trim() === storedData.code) {
        await setDoc(doc(db, 'verification_codes', user.uid), {
          ...storedData,
          used: true,
          usedAt: new Date().toISOString()
        });

        const expiryTime = Date.now() + KEY_EXPIRY_TIME;
        localStorage.setItem('downloadKeyExpiry', expiryTime.toString());
        
        toast.success('✅ Verification successful! Download key activated for 2 hours.');
        
        setTimeout(() => {
          onKeyGenerated();
          onOpenChange(false);
          
          // Redirect to the download input after successful verification
          const returnPath = sessionStorage.getItem('downloadReturnPath');
          if (returnPath && returnPath !== window.location.pathname) {
            window.location.hash = returnPath;
          }
          
          // Trigger download dialog to open after a short delay
          setTimeout(() => {
            const downloadButton = document.querySelector('[data-download-trigger]') as HTMLButtonElement;
            if (downloadButton) {
              downloadButton.click();
            }
          }, 500);
        }, 1000);
      } else {
        toast.error('❌ Invalid code. Only the generated code will work.');
        setInputCode('');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  }

  const generateVerificationCode = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  const generateShortLink = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    setLoading(true);
    try {
      // Store current path for return navigation
      sessionStorage.setItem('downloadReturnPath', window.location.pathname);

      // Generate unique 10-digit verification code
      const code = generateVerificationCode();
      setVerificationCode(code);

      // Store code in Firestore
      await setDoc(doc(db, 'verification_codes', user.uid), {
        code: code,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        used: false
      });

      // Create verification success URL with user ID (hash route to avoid server 404)
      const verificationUrl = `${window.location.origin}/#/verification-success?userId=${user.uid}`;
      const alias = `vfy_${Date.now()}`;

      // Generate short link
      const apiUrl = `${SHORTENER_API}?api=${API_KEY}&url=${encodeURIComponent(verificationUrl)}&alias=${alias}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 'success' && data.shortenedUrl) {
        window.open(data.shortenedUrl, '_blank');
        setWaitingForCode(true);
        toast.success('🔗 Please complete the verification and get your code!');
      } else {
        toast.error('Failed to generate link. Please try again.');
        console.error('API Error:', data);
      }
    } catch (error) {
      toast.error('Error generating link. Please try again.');
      console.error('Network Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    await verifyCodeWithValue(inputCode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-2 border-primary">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center gap-2">
            🔑 Download Key Generation
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Get instant access to download
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          <div className="space-y-4 w-full">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="text-foreground font-medium mb-2">
                  एक बार Key Generate करने के बाद:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ 2 घंटे तक Free Download कर सकते हैं</li>
                  <li>✓ कोई Additional Verification नहीं</li>
                  <li>✓ Unlimited Downloads (2 hours में)</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                ⚠️ ध्यान दें: Verification पूरा करने के बाद आपको Code यहाँ automatically fill हो जाएगा
              </p>
            </div>

            {/* Code Input Field - Always Visible */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Enter Verification Code or Bypass Key
              </label>
              <Input
                type="text"
                placeholder="10-digit code or admin bypass key..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.slice(0, 14))}
                maxLength={14}
                className="text-center text-lg tracking-widest font-mono"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Admin bypass keys look like: XXXX-XXXX-XXXX
              </p>
            </div>

            {(inputCode.length === 10 || inputCode.includes('-')) && inputCode.length >= 10 && (
              <Button 
                onClick={verifyCode}
                size="lg"
                disabled={loading}
                className="w-full font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    ✅ Verify Code
                  </>
                )}
              </Button>
            )}
            
            <Button 
              onClick={generateShortLink}
              size="lg"
              disabled={loading}
              className="w-full font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  🔑 Generate Key
                </>
              )}
            </Button>

            <Button 
              onClick={() => {
                onOpenChange(false);
                window.location.href = '/#/buy-bluetick';
              }}
              variant="outline"
              size="lg"
              className="w-full font-semibold"
              disabled={loading}
            >
              💎 Don't need to generate key - Buy Blue Tick
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
