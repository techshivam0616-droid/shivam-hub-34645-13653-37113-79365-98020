import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Construction, Shield } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthDialog } from '@/components/Auth/AuthDialog';

export function MaintenancePopup() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Listen to maintenance status in real-time
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'maintenance'),
      (doc) => {
        if (doc.exists()) {
          const enabled = doc.data()?.enabled || false;
          setMaintenanceMode(enabled);
          
          // If maintenance is on and user is not admin and not on admin page
          if (enabled && !isAdmin && location.pathname !== '/admin') {
            setOpen(true);
            // Redirect to home page if not already there
            if (location.pathname !== '/') {
              navigate('/');
            }
          } else {
            setOpen(false);
          }
        }
      },
      (error) => {
        console.error('Error listening to maintenance status:', error);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, location.pathname, navigate]);

  const handleAdminAccess = () => {
    if (user) {
      setOpen(false);
      navigate('/admin');
    } else {
      setShowAuth(true);
    }
  };

  // Auto-navigate to admin after successful login
  useEffect(() => {
    if (user && showAuth) {
      setShowAuth(false);
      setOpen(false);
      navigate('/admin');
    }
  }, [user, showAuth, navigate]);

  if (!maintenanceMode || isAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing the dialog unless user is admin or navigating to admin
      if (!newOpen && !isAdmin) {
        return;
      }
      setOpen(newOpen);
    }}>
      <DialogContent className="sm:max-w-md glass-effect border-2 border-primary/50 neon-border" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto mb-4"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center neon-border">
              <Construction className="h-10 w-10 text-white animate-pulse" />
            </div>
          </motion.div>
          
          <DialogTitle className="text-2xl text-center gradient-text">
            Site Under Maintenance
          </DialogTitle>
          
          <DialogDescription className="text-center text-base space-y-4 pt-4">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              We're currently performing scheduled maintenance to improve your experience.
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground"
            >
              Please check back soon. We apologize for any inconvenience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-6 border-t border-border/50"
            >
              <Button
                onClick={handleAdminAccess}
                variant="outline"
                className="w-full gap-2 border-2 border-primary/50 hover:border-primary hover:shadow-neon"
              >
                <Shield className="h-4 w-4" />
                Admin Panel Access
              </Button>
            </motion.div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>

      <AuthDialog 
        open={showAuth} 
        onOpenChange={setShowAuth}
      />
    </Dialog>
  );
}
