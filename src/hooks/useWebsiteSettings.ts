import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface WebsiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  aboutUs: string;
  whatWeOffer: string;
  channelLink: string;
  keyGenerationEnabled: boolean;
}

const defaultSettings: WebsiteSettings = {
  siteName: 'Tech Shivam',
  siteDescription: 'Discover amazing mods, movies, and courses all in one place',
  logoUrl: 'https://i.postimg.cc/ncZmfw1f/IMG-20250915-215153-604.jpg',
  aboutUs: 'Welcome to our platform where you can discover amazing mods, movies, and courses. We are dedicated to providing quality content for our community.',
  whatWeOffer: 'Game Mods & Enhancements|Movies Collection|Educational Courses|Regular Updates',
  channelLink: 'https://youtube.com/@techshivam',
  keyGenerationEnabled: true
};

export function useWebsiteSettings() {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'website'),
      (doc) => {
        if (doc.exists()) {
          setSettings({ ...defaultSettings, ...doc.data() } as WebsiteSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading website settings:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { settings, loading };
}
