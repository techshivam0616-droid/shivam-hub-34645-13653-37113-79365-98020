import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const KEY_EXPIRY_TIME = 2 * 60 * 60 * 1000; // 2 hours

export default function DownloadCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Activate the download key
    const expiryTime = Date.now() + KEY_EXPIRY_TIME;
    localStorage.setItem('downloadKeyExpiry', expiryTime.toString());
    
    console.log('Download key activated from callback');
    toast.success('🔑 Download key activated! Valid for 2 hours.');
    
    // Get return URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const returnUrl = urlParams.get('return') || '/';
    
    // Redirect back after 2 seconds
    setTimeout(() => {
      try {
        // Try to navigate to the decoded URL
        const decodedUrl = decodeURIComponent(returnUrl);
        window.location.href = decodedUrl;
      } catch (error) {
        console.error('Error redirecting:', error);
        navigate('/');
      }
    }, 2000);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center space-y-6 p-8 rounded-2xl border-2 border-primary/30 bg-card/50 backdrop-blur-sm max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <div className="absolute inset-0 h-16 w-16 border-4 border-primary/20 rounded-full" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">
            ✅ Verified!
          </h1>
          <p className="text-muted-foreground">
            Your download key has been activated
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting you back...
          </p>
        </div>

        <div className="pt-4">
          <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-[progress_2s_ease-in-out]" 
                 style={{ animation: 'progress 2s ease-in-out forwards' }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
