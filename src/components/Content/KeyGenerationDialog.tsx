import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface KeyGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyGenerated: () => void;
  destinationUrl: string;
}

const SHORTENER_API = 'https://vplink.in/api';
const API_KEY = '9645eda8b7b96d2ff2aa9f0b2a97b75a70bee752';
const KEY_EXPIRY_TIME = 2 * 60 * 60 * 1000;

export function KeyGenerationDialog({ open, onOpenChange, onKeyGenerated, destinationUrl }: KeyGenerationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [shortLink, setShortLink] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setShortLink('');
      setCompleted(false);
      setLoading(false);
    }
  }, [open]);

  const generateShortLink = async () => {
    setLoading(true);
    try {
      // Save current URL for return
      sessionStorage.setItem('downloadReturnUrl', window.location.pathname);
      
      // Create a callback URL that will trigger download when user returns
      const callbackUrl = `${window.location.origin}/download-callback`;
      const alias = `dl_${Date.now()}`;
      
      // Generate short link with proper encoding
      const apiUrl = `${SHORTENER_API}?api=${API_KEY}&url=${encodeURIComponent(callbackUrl)}&alias=${alias}`;
      
      console.log('Generating short link with callback:', callbackUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('Shortener response:', data);
      
        if (data.status === 'success' && data.shortenedUrl) {
        // Open verification link and wait for callback page to activate the key
        window.open(data.shortenedUrl, '_blank');
        toast.success('🔗 Verification link opened. Please complete the steps.');
        onOpenChange(false);
      } else {
        toast.error('Failed to generate link. Please try again.');
        console.error('API Error:', data);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Error generating link. Please try again.');
      console.error('Network Error:', error);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const expiryTime = Date.now() + KEY_EXPIRY_TIME;
    localStorage.setItem('downloadKeyExpiry', expiryTime.toString());
    setCompleted(true);
    toast.success('Download key activated! Valid for 2 hours.');
    setTimeout(() => {
      onKeyGenerated();
    }, 1000);
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
        
        {!loading ? (
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
                  ⚠️ ध्यान दें: Verification Link पूरा Complete करना जरूरी है, वरना Key Activate नहीं होगी
                </p>
              </div>
            </div>
            
            <Button 
              onClick={generateShortLink}
              size="lg"
              className="w-full font-semibold"
            >
              🔑 Generate Key
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-center text-muted-foreground">
              Verification Link पर Redirect हो रहा है...
            </p>
            <p className="text-sm text-muted-foreground">
              कृपया Verification Complete करें
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
