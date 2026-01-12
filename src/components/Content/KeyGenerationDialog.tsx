import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, KeyRound, Clock } from 'lucide-react';
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

interface BypassSuccessInfo {
  expiryTime: number;
  remainingUses: number;
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
  const [bypassSuccess, setBypassSuccess] = useState<BypassSuccessInfo | null>(null);

  useEffect(() => {
    if (!open) {
      setVerificationCode('');
      setInputCode('');
      setWaitingForCode(false);
      setLoading(false);
      setBypassSuccess(null);
    } else {
      const storedCode = sessionStorage.getItem('verificationCode');
      if (storedCode && storedCode.length === 10) {
        setInputCode(storedCode);
        sessionStorage.removeItem('verificationCode');
        setTimeout(() => {
          verifyCodeWithValue(storedCode);
        }, 500);
      }
    }
  }, [open]);

  const formatTimeRemaining = (expiryTime: number) => {
    const diff = expiryTime - Date.now();
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const checkAdminBypassKey = async (code: string): Promise<BypassSuccessInfo | null> => {
    try {
      const keysRef = collection(db, 'adminGeneratedKeys');
      const q = query(keysRef, where('code', '==', code), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const keyDoc = snapshot.docs[0];
      const keyData = keyDoc.data();
      
      if (keyData.usedCount >= keyData.maxUses) {
        toast.error('This bypass key has expired (max uses reached)');
        return null;
      }

      if (keyData.expiryDate) {
        const expiry = keyData.expiryDate.toDate ? keyData.expiryDate.toDate() : new Date(keyData.expiryDate);
        if (expiry.getTime() < Date.now()) {
          toast.error('This bypass key has expired (time limit reached)');
          return null;
        }
      }

      await updateDoc(doc(db, 'adminGeneratedKeys', keyDoc.id), {
        usedCount: increment(1)
      });

      const expiryTime = Date.now() + KEY_EXPIRY_TIME;
      localStorage.setItem('downloadKeyExpiry', expiryTime.toString());
      
      const remainingUses = keyData.maxUses - keyData.usedCount - 1;
      
      return { expiryTime, remainingUses };
    } catch (error) {
      console.error('Error checking bypass key:', error);
      return null;
    }
  };

  const verifyCodeWithValue = async (codeValue: string) => {
    if (!user || !codeValue.trim()) {
      return;
    }

    setLoading(true);
    try {
      if (codeValue.includes('-')) {
        const bypassInfo = await checkAdminBypassKey(codeValue);
        if (bypassInfo) {
          setBypassSuccess(bypassInfo);
          toast.success(`✅ Bypass key activated!`);
          return;
        }
      }

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
          
          const returnPath = sessionStorage.getItem('downloadReturnPath');
          if (returnPath && returnPath !== window.location.pathname) {
            window.location.hash = returnPath;
          }
          
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
      sessionStorage.setItem('downloadReturnPath', window.location.pathname);

      const code = generateVerificationCode();
      setVerificationCode(code);

      await setDoc(doc(db, 'verification_codes', user.uid), {
        code: code,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        used: false
      });

      const verificationUrl = `${window.location.origin}/#/verification-success?userId=${user.uid}`;
      const alias = `vfy_${Date.now()}`;

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

  const handleContinue = () => {
    onKeyGenerated();
    onOpenChange(false);
  };

  if (bypassSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm p-4 border-2 border-green-500">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Key Activated!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <Clock className="h-5 w-5" />
                <span className="text-xl font-bold">{formatTimeRemaining(bypassSuccess.expiryTime)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Download access time remaining</p>
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">
                Bypass key uses remaining: <span className="font-bold text-foreground">{bypassSuccess.remainingUses}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Unlimited downloads for 2 hours!
              </p>
            </div>
            
            <Button onClick={handleContinue} className="w-full">
              ✅ Continue to Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-sm p-4 border-2 border-primary">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg text-primary flex items-center gap-2">
            🔑 Key Generation
          </DialogTitle>
          <DialogDescription className="text-sm">
            Get instant download access
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-2">
          <div className="bg-primary/5 border border-primary/20 rounded p-3">
            <p className="text-xs text-muted-foreground">
              ✓ 2 घंटे Free Downloads • ✓ No Extra Verification
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Enter Code or Bypass Key</label>
            <Input
              type="text"
              placeholder="Code or XXXX-XXXX-XXXX"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.slice(0, 14))}
              maxLength={14}
              className="text-center text-sm tracking-wider font-mono h-9"
              disabled={loading}
            />
          </div>

          {(inputCode.length === 10 || inputCode.includes('-')) && inputCode.length >= 10 && (
            <Button 
              onClick={verifyCode}
              size="sm"
              disabled={loading}
              className="w-full h-9"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "✅ Verify"}
            </Button>
          )}
          
          <Button 
            onClick={generateShortLink}
            size="sm"
            disabled={loading}
            className="w-full h-9"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "🔑 Generate Key"}
          </Button>

          <Button 
            onClick={() => {
              onOpenChange(false);
              window.location.href = '/#/buy-bluetick';
            }}
            variant="outline"
            size="sm"
            className="w-full h-9 text-xs"
            disabled={loading}
          >
            💎 Buy Blue Tick - Skip Key Gen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
