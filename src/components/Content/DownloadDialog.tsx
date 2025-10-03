import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/Auth/AuthDialog';
import { KeyGenerationDialog } from './KeyGenerationDialog';
import { addDoc, collection, increment, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  type: string;
}

export function DownloadDialog({ open, onOpenChange, item, type }: DownloadDialogProps) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showKeyGen, setShowKeyGen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const checkKeyValidity = () => {
    const expiry = localStorage.getItem('downloadKeyExpiry');
    console.log('Checking key validity, expiry:', expiry);
    if (expiry) {
      const expiryTime = parseInt(expiry);
      const isValid = Date.now() < expiryTime;
      console.log('Key valid:', isValid);
      if (!isValid) {
        localStorage.removeItem('downloadKeyExpiry');
      }
      return isValid;
    }
    return false;
  };

  const performDownload = async () => {
    console.log('performDownload called, downloadUrl:', item?.downloadUrl);
    
    if (!item?.downloadUrl) {
      toast.error('Download URL not available');
      onOpenChange(false);
      return;
    }

    setDownloading(true);
    try {
      // Track download
      await addDoc(collection(db, 'downloads'), {
        userId: user?.uid,
        userEmail: user?.email,
        itemId: item.id,
        itemTitle: item.title,
        type: type,
        downloadedAt: new Date().toISOString()
      });

      // Update download count
      const itemRef = doc(db, type, item.id);
      await updateDoc(itemRef, {
        downloadCount: increment(1)
      });

      // Open download link
      console.log('Opening download URL:', item.downloadUrl);
      window.open(item.downloadUrl, '_blank');
      toast.success('Download started! ✅');
      onOpenChange(false);
    } catch (error) {
      toast.error('Download failed ❌');
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadClick = () => {
    console.log('Download button clicked');
    console.log('User:', user);
    console.log('Item:', item);
    
    // Check if user is logged in
    if (!user) {
      console.log('User not logged in, showing auth dialog');
      onOpenChange(false);
      setTimeout(() => setShowAuth(true), 100);
      return;
    }

    // Check if key is valid
    const isKeyValid = checkKeyValidity();
    
    if (!isKeyValid) {
      console.log('Key not valid, showing key generation dialog');
      onOpenChange(false);
      setTimeout(() => setShowKeyGen(true), 100);
      return;
    }

    // If user is logged in and key is valid, download directly
    console.log('User logged in and key valid, starting download');
    performDownload();
  };

  return (
    <>
      {/* Main Download Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md border-2 border-primary">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary">{item?.title || 'Download'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{item?.description || ''}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {item?.size && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/50">
                <span className="text-sm text-muted-foreground">Size:</span>
                <span className="text-sm font-semibold text-primary">{item.size}</span>
              </div>
            )}
            {item?.version && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/50">
                <span className="text-sm text-muted-foreground">Version:</span>
                <span className="text-sm font-semibold text-secondary">{item.version}</span>
              </div>
            )}
            {item?.downloadCount !== undefined && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/50">
                <span className="text-sm text-muted-foreground">Downloads:</span>
                <span className="text-sm font-semibold text-accent">{item.downloadCount}</span>
              </div>
            )}
          </div>

          <Button 
            onClick={handleDownloadClick} 
            disabled={downloading} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6"
          >
            <Download className="h-5 w-5 mr-2" />
            {downloading ? 'Downloading...' : 'Download Now'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuth} 
        onOpenChange={(isOpen) => {
          console.log('Auth dialog changed:', isOpen);
          setShowAuth(isOpen);
          if (!isOpen && user) {
            // After login, re-open download dialog
            setTimeout(() => {
              console.log('Reopening download dialog after login');
              onOpenChange(true);
            }, 300);
          }
        }} 
      />
      
      {/* Key Generation Dialog */}
      <KeyGenerationDialog
        open={showKeyGen}
        onOpenChange={setShowKeyGen}
        onKeyGenerated={() => {
          console.log('Key generated callback');
          setShowKeyGen(false);
          toast.success('🔑 Key activated! Starting download...');
          // After key generation, trigger download
          setTimeout(() => {
            console.log('Performing download after key generation');
            performDownload();
          }, 800);
        }}
        destinationUrl={item?.downloadUrl || 'https://example.com'}
      />
    </>
  );
}
