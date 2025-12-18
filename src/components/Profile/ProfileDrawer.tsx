import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useVerification } from '@/hooks/useVerification';
import blueTick from '@/assets/blue-tick.png';
import { useState } from 'react';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const { user, isAdmin, signOut } = useAuth();
  const { isVerified } = useVerification();

  const [editingName, setEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName || '');
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleUpdateName = async () => {
    if (!auth.currentUser) return;
    const name = displayNameInput.trim();
    if (name.length < 2 || name.length > 50) {
      toast.error('Name must be between 2 and 50 characters');
      return;
    }
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      toast.success('Name updated');
      setEditingName(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !user?.email) return;
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Password changed successfully');
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to change password');
    } finally {
      setSaving(false);
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
                {isVerified && <img src={blueTick} alt="Verified" className="h-4 w-4 object-contain" />}
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

          <div className="space-y-4">
            {/* Edit Name */}
            {!editingName ? (
              <Button variant="outline" className="w-full justify-between" onClick={() => setEditingName(true)}>
                Edit Name
              </Button>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <div className="flex gap-2">
                  <Input id="displayName" value={displayNameInput} onChange={(e) => setDisplayNameInput(e.target.value)} />
                  <Button onClick={handleUpdateName} disabled={saving}>Save</Button>
                  <Button variant="secondary" onClick={() => setEditingName(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Change Password */}
            {!changingPassword ? (
              <Button variant="outline" className="w-full justify-between" onClick={() => setChangingPassword(true)}>
                Change Password
              </Button>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} disabled={saving}>Update</Button>
                  <Button variant="secondary" onClick={() => setChangingPassword(false)}>Cancel</Button>
                </div>
              </div>
            )}

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
