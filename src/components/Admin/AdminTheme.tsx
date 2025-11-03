import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Snowflake } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export function AdminTheme() {
  const [winterThemeEnabled, setWinterThemeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'theme');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setWinterThemeEnabled(docSnap.data()?.winterThemeEnabled || false);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching theme settings:', error);
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggleWinterTheme = async (checked: boolean) => {
    try {
      setWinterThemeEnabled(checked);
      const docRef = doc(db, 'settings', 'theme');
      await setDoc(docRef, { winterThemeEnabled: checked }, { merge: true });
      toast.success(checked ? '❄️ Winter theme enabled!' : '🌸 Winter theme disabled!');
    } catch (error) {
      console.error('Error updating winter theme:', error);
      toast.error('Failed to update theme settings');
      setWinterThemeEnabled(!checked);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Snowflake className="h-5 w-5" />
          Theme Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="winter-theme" className="flex flex-col space-y-1">
            <span className="text-base font-semibold">Winter Theme</span>
            <span className="text-sm text-muted-foreground">
              Enable falling snow effect across the website
            </span>
          </Label>
          <Switch
            id="winter-theme"
            checked={winterThemeEnabled}
            onCheckedChange={handleToggleWinterTheme}
          />
        </div>

        {winterThemeEnabled && (
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              ❄️ Winter theme is now active! Users will see falling snow across the website.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
