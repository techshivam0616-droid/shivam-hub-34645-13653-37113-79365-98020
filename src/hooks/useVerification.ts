import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useVerification() {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkVerification = async () => {
      if (!user?.email) {
        setIsVerified(false);
        setLoading(false);
        return;
      }

      try {
        const verificationDoc = await getDoc(doc(db, 'verified_users', user.email));
        setIsVerified(verificationDoc.exists() && verificationDoc.data()?.verified === true);
      } catch (error) {
        console.error('Error checking verification:', error);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [user?.email]);

  return { isVerified, loading };
}
