import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
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
    }
  }, [open]);

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
    if (!user || !inputCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    if (inputCode.trim().length !== 10) {
      toast.error('Code must be 10 digits');
      return;
    }

    setLoading(true);
    try {
      // Get stored code from Firestore
      const codeDoc = await getDoc(doc(db, 'verification_codes', user.uid));
      
      if (!codeDoc.exists()) {
        toast.error('No verification code found. Please generate a new one.');
        setWaitingForCode(false);
        setInputCode('');
        setLoading(false);
        return;
      }

      const storedData = codeDoc.data();
      
      if (storedData.used) {
        toast.error('This code has already been used. Please generate a new one.');
        setWaitingForCode(false);
        setInputCode('');
        setLoading(false);
        return;
      }

      // Verify code matches
      if (inputCode.trim() === storedData.code) {
        // Mark code as used
        await setDoc(doc(db, 'verification_codes', user.uid), {
          ...storedData,
          used: true,
          usedAt: new Date().toISOString()
        });

        // Activate download key
        const expiryTime = Date.now() + KEY_EXPIRY_TIME;
        localStorage.setItem('downloadKeyExpiry', expiryTime.toString());
        
        toast.success('✅ Verification successful! Download key activated for 2 hours.');
        
        setTimeout(() => {
          onKeyGenerated();
          onOpenChange(false);
        }, 1000);
      } else {
        toast.error('❌ Invalid code. Please check and try again.');
        setInputCode('');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
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
        
        {!waitingForCode ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="space-y-3 w-full">
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
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mt-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  ⚠️ ध्यान दें: Verification पूरा करने के बाद आपको एक 10 अंकों का Code मिलेगा, वो Code यहाँ Enter करना होगा
                </p>
              </div>
            </div>
            
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="space-y-4 w-full">
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4 text-center">
                <KeyRound className="h-12 w-12 text-primary mx-auto mb-3" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  Verification पूरा करें
                </p>
                <p className="text-sm text-muted-foreground">
                  Verification complete होने के बाद आपको 10 अंकों का Code मिलेगा। वो Code नीचे Enter करें।
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Enter 10-Digit Verification Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter code here..."
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  className="text-center text-lg tracking-widest font-mono"
                />
              </div>

              <Button 
                onClick={verifyCode}
                size="lg"
                disabled={loading || inputCode.length !== 10}
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

              <Button 
                onClick={() => {
                  setWaitingForCode(false);
                  setInputCode('');
                  generateShortLink();
                }}
                variant="outline"
                size="sm"
                className="w-full"
                disabled={loading}
              >
                Generate New Code
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
