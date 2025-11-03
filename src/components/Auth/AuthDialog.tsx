import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FcGoogle } from 'react-icons/fc';
import { Separator } from '@/components/ui/separator';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restrictToEmail?: string;
  onSuccess?: () => void;
}

export function AuthDialog({ open, onOpenChange, restrictToEmail, onSuccess }: AuthDialogProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, signOut } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        // If maintenance restricts login to a specific email, enforce it
        if (restrictToEmail && email.toLowerCase() !== restrictToEmail.toLowerCase()) {
          await signOut();
          toast.error('Maintenance mode: only the admin can log in.');
          return;
        }
        toast.success('Welcome back!');
      } else {
        if (restrictToEmail) {
          toast.error('Sign up is disabled during maintenance.');
          return;
        }
        await signUp(email, password, displayName);
        toast.success('Account created successfully!');
      }
      onOpenChange(false);
      onSuccess?.();
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (restrictToEmail) {
      toast.error('Google sign-in is disabled during maintenance.');
      return;
    }

    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Successfully signed in with Google!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Login' : 'Sign Up'}</DialogTitle>
        </DialogHeader>
        
        {!restrictToEmail && (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 relative"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              Continue with Google
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs"
              >
                Recommended
              </Badge>
            </Button>
            
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                OR
              </span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </Button>
          {!restrictToEmail && (
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
