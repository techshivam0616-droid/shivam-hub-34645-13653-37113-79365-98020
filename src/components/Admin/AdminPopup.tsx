import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const textColors = [
  { value: 'default', label: 'Default (Foreground)', color: 'hsl(var(--foreground))' },
  { value: 'primary', label: 'Primary', color: 'hsl(var(--primary))' },
  { value: 'red', label: 'Red', color: '#ef4444' },
  { value: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'green', label: 'Green', color: '#10b981' }
];

const fontFamilies = [
  { value: 'default', label: 'Default (System)' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Monospace' },
  { value: 'sans', label: 'Sans-Serif' },
  { value: 'cursive', label: 'Cursive' }
];

export function AdminPopup() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    enabled: false,
    text: '',
    linkUrl: '',
    linkName: '',
    textColor: 'default',
    fontFamily: 'default'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'popup');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFormData(docSnap.data() as any);
      }
    } catch (error) {
      console.error('Error loading popup settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'popup'), formData);
      toast({
        title: 'Success',
        description: 'Popup settings saved successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save popup settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Website Popup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="popup-enabled">Enable Popup</Label>
          <Switch
            id="popup-enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="popup-text">Popup Text</Label>
          <Textarea
            id="popup-text"
            placeholder="Enter popup message..."
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="text-color">Text Color</Label>
            <Select
              value={formData.textColor}
              onValueChange={(value) => setFormData({ ...formData, textColor: value })}
            >
              <SelectTrigger id="text-color">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {textColors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color.color }}
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-family">Font Style</Label>
            <Select
              value={formData.fontFamily}
              onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}
            >
              <SelectTrigger id="font-family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="link-url">Link URL</Label>
          <Input
            id="link-url"
            type="url"
            placeholder="https://example.com"
            value={formData.linkUrl}
            onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link-name">Link Name</Label>
          <Input
            id="link-name"
            placeholder="Click here"
            value={formData.linkName}
            onChange={(e) => setFormData({ ...formData, linkName: e.target.value })}
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Popup Settings
        </Button>
      </CardContent>
    </Card>
  );
}
