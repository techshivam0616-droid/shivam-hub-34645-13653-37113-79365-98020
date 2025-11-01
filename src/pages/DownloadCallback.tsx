import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const KEY_EXPIRY_TIME = 2 * 60 * 60 * 1000; // 2 hours

export default function DownloadCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1) Activate the download key immediately
    const expiryTime = Date.now() + KEY_EXPIRY_TIME;
    localStorage.setItem('downloadKeyExpiry', expiryTime.toString());

    console.log('Download key activated from callback');
    toast.success('🔑 Download key activated! Valid for 2 hours.');

    // 2) Safely resolve where to send the user back
    const urlParams = new URLSearchParams(window.location.search);
    const rawReturn = urlParams.get('return') || '/';

    const normalizeReturnUrl = (val: string): string => {
      let decoded = val;
      try {
        decoded = decodeURIComponent(val);
      } catch {}
      // Try base64 just in case
      if (/^[A-Za-z0-9+/=]+$/.test(decoded)) {
        try {
          decoded = decodeURIComponent(atob(decoded));
        } catch {}
      }

      // Build a URL relative to current origin if needed
      let target: URL;
      try {
        target = new URL(decoded, window.location.origin);
      } catch {
        target = new URL('/', window.location.origin);
      }

      // Fix common wrong path: /mod -> /mods
      if (target.pathname === '/mod') target.pathname = '/mods';

      // Allow-listed client routes; fallback to home if unknown
      const allowed = new Set([
        '/', '/mods', '/movies', '/courses', '/admin', '/request-mod', '/contact', '/live-chat'
      ]);
      if (!allowed.has(target.pathname)) {
        // If it's same-origin unknown path, go home
        if (target.origin === window.location.origin) {
          target.pathname = '/';
          target.search = '';
        }
      }
      return target.toString();
    };

    const targetUrl = normalizeReturnUrl(rawReturn);

    // 3) Redirect after a short UX delay
    const t = setTimeout(() => {
      try {
        // Use window.location.href for more reliable redirect
        window.location.href = targetUrl;
      } catch (error) {
        console.error('Error redirecting:', error);
        // Fallback to navigate
        navigate('/');
      }
    }, 800);

    return () => clearTimeout(t);
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
