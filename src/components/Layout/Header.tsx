import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Menu, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/Auth/AuthDialog';
import { ProfileDrawer } from '@/components/Profile/ProfileDrawer';
import { NavigationDrawer } from '@/components/Layout/NavigationDrawer';

export function Header() {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNav, setShowNav] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowNav(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <img 
                src="https://i.postimg.cc/ncZmfw1f/IMG-20250915-215153-604.jpg" 
                alt="Tech Shivam Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-1">
                Tech Shivam
                <span className="text-red-600">✅</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
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
