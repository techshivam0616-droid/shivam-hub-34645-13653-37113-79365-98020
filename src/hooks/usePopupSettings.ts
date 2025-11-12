import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PopupSettings {
  enabled: boolean;
  text: string;
  linkUrl: string;
  linkName: string;
  textColor: string;
  fontFamily: string;
}

const defaultSettings: PopupSettings = {
  enabled: false,
  text: '',
  linkUrl: '',
  linkName: '',
  textColor: 'default',
  fontFamily: 'default'
};

export function usePopupSettings() {
  const [settings, setSettings] = useState<PopupSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'popup'),
      (doc) => {
        if (doc.exists()) {
          setSettings({ ...defaultSettings, ...doc.data() } as PopupSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading popup settings:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}
