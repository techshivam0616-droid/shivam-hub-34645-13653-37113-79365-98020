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
    if (open) {
      // Auto-generate and redirect immediately when dialog opens
      generateShortLink();
    } else {
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
        // Activate key immediately
        const expiryTime = Date.now() + KEY_EXPIRY_TIME;
        localStorage.setItem('downloadKeyExpiry', expiryTime.toString());
        
        // Redirect to shortener immediately
        window.open(data.shortenedUrl, '_blank');
        toast.success('🔗 Redirecting to verification link...');
        
        // Close dialog and trigger download after a short delay
        setTimeout(() => {
          onKeyGenerated();
        }, 500);
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
          <DialogTitle className="text-2xl text-primary">🔑 Generating Download Key</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Please wait while we prepare your download...
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-center text-muted-foreground">
            Redirecting to verification link...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
