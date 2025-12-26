import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Package, Film, GraduationCap, Youtube, Send, MessageSquare, Shield, MessageCircle, Gamepad2, Layers, FolderArchive, Crown, Users, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChannelDialog } from '@/components/Channels/ChannelDialog';
import { useVerification } from '@/hooks/useVerification';

interface NavigationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavigationDrawer({ open, onOpenChange }: NavigationDrawerProps) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { isVerified } = useVerification();
  const [showChannels, setShowChannels] = useState(false);

  const handleNavigation = (path?: string, action?: string, external?: boolean) => {
    if (action === 'channels') {
      setShowChannels(true);
    } else if (external && path) {
      window.open(path, '_blank');
      onOpenChange(false);
    } else if (path) {
      navigate(path);
      onOpenChange(false);
    }
  };

  const menuItems = [
    { icon: Smartphone, label: 'My Apps', path: '/#my-apps' },
    { icon: Package, label: 'Mods', path: '/mods' },
    { icon: Gamepad2, label: 'Games', path: '/games' },
    { icon: Layers, label: 'Assets', path: '/assets' },
    { icon: FolderArchive, label: 'Bundles', path: '/bundles' },
    { icon: Film, label: 'Movies', path: 'https://tech-movies.vercel.app/', external: true },
    { icon: GraduationCap, label: 'Courses', path: '/courses' },
    { icon: Users, label: 'Social', path: '/social' },
    { icon: MessageCircle, label: 'Live Chat', path: '/live-chat' },
    { icon: Youtube, label: 'Subscribe to Channels', action: 'channels' },
    { icon: Send, label: 'Request Mod', path: '/request-mod' },
    { icon: MessageSquare, label: 'Contact Us', path: '/contact' },
  ];

  const showBuyBlueTickOption = user && !isVerified;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation(item.path, item.action, item.external)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Button>
            ))}
            
            {showBuyBlueTickOption && (
              <>
                <div className="my-4 border-t" />
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 border border-yellow-500/30"
                  onClick={() => handleNavigation('/buy-bluetick')}
                >
                  <Crown className="h-5 w-5 mr-3 text-yellow-500" />
                  <span className="text-yellow-600 font-semibold">Get Blue Tick ✓</span>
                </Button>
              </>
            )}

            {isAdmin && (
              <>
                <div className="my-4 border-t" />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-primary"
                  onClick={() => handleNavigation('/admin')}
                >
                  <Shield className="h-5 w-5 mr-3" />
                  Admin Panel
                </Button>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <ChannelDialog open={showChannels} onOpenChange={setShowChannels} />
    </>
  );
}
