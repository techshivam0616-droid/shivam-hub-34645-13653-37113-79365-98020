import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/Auth/AuthDialog';
import { ProfileDrawer } from '@/components/Profile/ProfileDrawer';
import { NavigationDrawer } from '@/components/Layout/NavigationDrawer';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { useVerification } from '@/hooks/useVerification';
import { KingBadge } from '@/components/ui/KingBadge';

export function Header() {
  const { user } = useAuth();
  const { settings } = useWebsiteSettings();
  const { isVerified } = useVerification();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNav(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <img 
                src={settings.logoUrl} 
                alt={`${settings.siteName} Logo`} 
                className="h-10 w-10 rounded-full object-cover"
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
                {settings.siteName}
                {user && isVerified && <KingBadge size="lg" />}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {user ? (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowProfile(true)}
              >
                <User className="h-5 w-5" />
              </Button>
            ) : (
              <Button onClick={() => setShowAuthDialog(true)}>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      <ProfileDrawer open={showProfile} onOpenChange={setShowProfile} />
      <NavigationDrawer open={showNav} onOpenChange={setShowNav} />
    </>
  );
}
