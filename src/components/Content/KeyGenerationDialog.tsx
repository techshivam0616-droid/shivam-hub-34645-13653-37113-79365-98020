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
        setShortLink(data.shortenedUrl);
        setStep(2);
        toast.success('Link generated successfully!');
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
          <DialogTitle className="text-2xl text-primary">🔑 Generate Download Key</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Follow these simple steps to unlock your download
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-lg border border-primary/30">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">1️⃣</span> Generate Short Link
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click below to create your unique verification link
                </p>
                <Button 
                  onClick={generateShortLink} 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    '🔗 Generate Link'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && !completed && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-500/10 to-primary/10 p-6 rounded-lg border border-green-500/30">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-2xl">2️⃣</span> Visit Verification Link
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Click the link below to verify and continue:
                </p>
                <a
                  href={shortLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center p-4 bg-primary/20 hover:bg-primary/30 rounded-lg transition-all text-primary font-semibold break-all border border-primary/40 hover:border-primary/60"
                >
                  🔗 {shortLink}
                </a>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-accent/10 p-6 rounded-lg border border-green-500/30">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-2xl">3️⃣</span> Done!
                </h3>
                <p className="text-sm text-muted-foreground">
                  After visiting the link above, your download will start automatically. If it doesn't start, come back and click the button below.
                </p>
              </div>
              
              <Button 
                onClick={handleComplete}
                variant="outline"
                className="w-full"
              >
                Manual Activate (if auto-download didn't work)
              </Button>
            </div>
          )}

          {completed && (
            <div className="text-center py-8 bg-gradient-to-br from-green-500/20 to-primary/20 rounded-lg border border-green-500/40">
              <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold mb-2 gradient-text">🎉 Key Activated!</h3>
              <p className="text-base text-muted-foreground">
                Your download will start automatically. Key valid for 2 hours.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
