import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { DollarSign, Loader2 } from 'lucide-react';

export function AdminBlueTickSettings() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    weeklyPrice: '',
    monthlyPrice: '',
    yearlyPrice: '',
    upiId: '',
    qrCodeUrl: '',
    specialOffersEnabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'bluetick');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await setDoc(doc(db, 'settings', 'bluetick'), {
        ...settings,
        updatedAt: new Date().toISOString()
      });

      toast.success('King Badge settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>King Badge Purchase Settings</CardTitle>
        <CardDescription>Configure pricing and payment details for King Badge verification</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weeklyPrice">Weekly Price (₹)</Label>
              <Input
                id="weeklyPrice"
                type="number"
                value={settings.weeklyPrice}
                onChange={(e) => setSettings({ ...settings, weeklyPrice: e.target.value })}
                placeholder="29"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Monthly Price (₹)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                value={settings.monthlyPrice}
                onChange={(e) => setSettings({ ...settings, monthlyPrice: e.target.value })}
                placeholder="99"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearlyPrice">Yearly Price (₹)</Label>
              <Input
                id="yearlyPrice"
                type="number"
                value={settings.yearlyPrice}
                onChange={(e) => setSettings({ ...settings, yearlyPrice: e.target.value })}
                placeholder="999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID *</Label>
            <Input
              id="upiId"
              value={settings.upiId}
              onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
              placeholder="yourname@upi"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qrCodeUrl">QR Code Image URL *</Label>
            <Textarea
              id="qrCodeUrl"
              value={settings.qrCodeUrl}
              onChange={(e) => setSettings({ ...settings, qrCodeUrl: e.target.value })}
              placeholder="https://example.com/qr-code.png"
              required
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between border rounded-md p-3">
            <Label htmlFor="specialOffersEnabled" className="font-medium">Enable Special Offers</Label>
            <input
              id="specialOffersEnabled"
              type="checkbox"
              className="h-5 w-5"
              checked={settings.specialOffersEnabled}
              onChange={(e) => setSettings({ ...settings, specialOffersEnabled: e.target.checked })}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <DollarSign className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
