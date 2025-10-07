import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useVerification } from '@/hooks/useVerification';
import blueTick from '@/assets/blue-tick.png';

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const { user, isAdmin, signOut } = useAuth();
  const { isVerified } = useVerification();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Profile</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold flex items-center gap-2">
                {user.displayName || 'User'}
                {isVerified && <img src={blueTick} alt="Verified" className="h-5 w-5" />}
                {isAdmin && <Shield className="h-4 w-4 text-primary" />}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-semibold text-primary flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Access Enabled
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
