import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useWinterTheme() {
  const [winterThemeEnabled, setWinterThemeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinterTheme = async () => {
      try {
        const docRef = doc(db, 'settings', 'theme');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setWinterThemeEnabled(docSnap.data()?.winterThemeEnabled || false);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching winter theme:', error);
        setLoading(false);
      }
    };

    fetchWinterTheme();

    // Listen for real-time updates
    const unsubscribe = onSnapshot(doc(db, 'settings', 'theme'), (doc) => {
      if (doc.exists()) {
        setWinterThemeEnabled(doc.data()?.winterThemeEnabled || false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { winterThemeEnabled, loading };
}
