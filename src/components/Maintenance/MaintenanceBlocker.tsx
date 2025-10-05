import { ReactNode, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface MaintenanceBlockerProps {
  children: ReactNode;
}

export function MaintenanceBlocker({ children }: MaintenanceBlockerProps) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'maintenance'),
      (doc) => {
        if (doc.exists()) {
          const enabled = doc.data()?.enabled || false;
          setMaintenanceMode(enabled);
          
          // Redirect non-admin users to home when maintenance is on
          if (enabled && !isAdmin && location.pathname !== '/admin' && location.pathname !== '/') {
            navigate('/');
          }
        }
      }
    );

    return () => unsubscribe();
  }, [isAdmin, location.pathname, navigate]);

  // Block content for non-admin users when maintenance is on
  if (maintenanceMode && !isAdmin && location.pathname !== '/admin') {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40" />
    );
  }

  return <>{children}</>;
}
