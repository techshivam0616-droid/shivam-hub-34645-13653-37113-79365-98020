import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export function AdminWebsiteSettings() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    siteName: '',
    siteDescription: '',
    logoUrl: '',
    aboutUs: '',
    whatWeOffer: '',
    channelLink: '',
    keyGenerationEnabled: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'website');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFormData(docSnap.data() as typeof formData);
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'website'), formData, { merge: true });
      // Also save to localStorage for quick access
      localStorage.setItem('channelLink', formData.channelLink);
      localStorage.setItem('siteName', formData.siteName);
      localStorage.setItem('logoUrl', formData.logoUrl);
      toast.success('Website settings updated successfully! Refresh page to see changes.');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website Settings</CardTitle>
        <CardDescription>Customize your website information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input
            id="siteName"
            value={formData.siteName}
            onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
            placeholder="Tech Shivam"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteDescription">Site Description</Label>
          <Textarea
            id="siteDescription"
            value={formData.siteDescription}
            onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
            placeholder="Your site description"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="aboutUs">About Us</Label>
          <Textarea
            id="aboutUs"
            value={formData.aboutUs}
            onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
            placeholder="Tell visitors about your website"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatWeOffer">What We Offer</Label>
          <Textarea
            id="whatWeOffer"
            value={formData.whatWeOffer}
            onChange={(e) => setFormData({ ...formData, whatWeOffer: e.target.value })}
            placeholder="List your offerings"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="channelLink">Channel Link</Label>
          <Input
            id="channelLink"
            type="url"
            value={formData.channelLink}
            onChange={(e) => setFormData({ ...formData, channelLink: e.target.value })}
            placeholder="https://youtube.com/@yourchannel"
          />
        </div>

        <div className="flex items-center space-x-2 p-4 border rounded-lg">
          <input
            type="checkbox"
            id="keyGenerationEnabled"
            checked={formData.keyGenerationEnabled}
            onChange={(e) => setFormData({ ...formData, keyGenerationEnabled: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="keyGenerationEnabled" className="cursor-pointer">
            Enable Key Generation for Downloads
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          When disabled, users can download directly without generating a key
        </p>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
