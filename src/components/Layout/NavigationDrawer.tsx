import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Package, Film, GraduationCap, Youtube, Send, MessageSquare, Shield, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChannelDialog } from '@/components/Channels/ChannelDialog';

interface NavigationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavigationDrawer({ open, onOpenChange }: NavigationDrawerProps) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [showChannels, setShowChannels] = useState(false);

  const handleNavigation = (path?: string, action?: string) => {
    if (action === 'channels') {
      setShowChannels(true);
    } else if (path) {
      navigate(path);
      onOpenChange(false);
    }
  };

  const menuItems = [
    { icon: Package, label: 'Mods', path: '/mods' },
    { icon: Film, label: 'Movies', path: '/movies' },
    { icon: GraduationCap, label: 'Courses', path: '/courses' },
    { icon: MessageCircle, label: 'Live Chat', path: '/live-chat' },
    { icon: Youtube, label: 'Subscribe to Channels', action: 'channels' },
    { icon: Send, label: 'Request Mod', path: '/request-mod' },
    { icon: MessageSquare, label: 'Contact Us', path: '/contact' },
  ];

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
                onClick={() => handleNavigation(item.path, item.action)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Button>
            ))}
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
