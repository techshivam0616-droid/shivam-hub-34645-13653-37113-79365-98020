import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Plus, Edit, X, Check, Smartphone, Gamepad2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MyApp {
  id: string;
  name: string;
  description: string;
  developerName: string;
  logoUrl: string;
  htmlCode: string;
  type: 'app' | 'game';
  buyContact: string;
  buyContactLink: string;
  createdAt: Date;
}

export function AdminMyApps() {
  const [apps, setApps] = useState<MyApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newApp, setNewApp] = useState({
    name: '',
    description: '',
    developerName: '',
    logoUrl: '',
    htmlCode: '',
    type: 'app' as 'app' | 'game',
    buyContact: '',
    buyContactLink: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'myApps'), (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as MyApp[];
      setApps(appsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    });
    return () => unsubscribe();
  }, []);

  const handleAddApp = async () => {
    if (!newApp.name || !newApp.htmlCode) {
      toast.error('Name and HTML code are required');
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'myApps'), {
        ...newApp,
        createdAt: new Date()
      });
      setNewApp({
        name: '',
        description: '',
        developerName: '',
        logoUrl: '',
        htmlCode: '',
        type: 'app',
        buyContact: '',
        buyContactLink: ''
      });
      toast.success('App added successfully!');
    } catch (error) {
      toast.error('Failed to add app');
    }
    setLoading(false);
  };

  const handleDeleteApp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this app?')) return;
    try {
      await deleteDoc(doc(db, 'myApps', id));
      toast.success('App deleted');
    } catch (error) {
      toast.error('Failed to delete app');
    }
  };

  const handleUpdateApp = async (id: string, data: Partial<MyApp>) => {
    try {
      await updateDoc(doc(db, 'myApps', id), data);
      setEditingId(null);
      toast.success('App updated');
    } catch (error) {
      toast.error('Failed to update app');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New App/Game
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>App/Game Name *</Label>
              <Input
                value={newApp.name}
                onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newApp.type} onValueChange={(v) => setNewApp({ ...newApp, type: v as 'app' | 'game' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">App</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea
              value={newApp.description}
              onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
              placeholder="Enter description"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Developer Name</Label>
              <Input
                value={newApp.developerName}
                onChange={(e) => setNewApp({ ...newApp, developerName: e.target.value })}
                placeholder="Developer name"
              />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                value={newApp.logoUrl}
                onChange={(e) => setNewApp({ ...newApp, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          
          <div>
            <Label>HTML Code (for direct play/open) *</Label>
            <Textarea
              value={newApp.htmlCode}
              onChange={(e) => setNewApp({ ...newApp, htmlCode: e.target.value })}
              placeholder="<iframe src='...'></iframe> or any HTML code"
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Buy Contact (Phone/Email)</Label>
              <Input
                value={newApp.buyContact}
                onChange={(e) => setNewApp({ ...newApp, buyContact: e.target.value })}
                placeholder="Contact info"
              />
            </div>
            <div>
              <Label>Buy Contact Link</Label>
              <Input
                value={newApp.buyContactLink}
                onChange={(e) => setNewApp({ ...newApp, buyContactLink: e.target.value })}
                placeholder="https://wa.me/..."
              />
            </div>
          </div>
          
          <Button onClick={handleAddApp} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add App/Game
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            My Apps & Games ({apps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No apps added yet</p>
          ) : (
            <div className="space-y-4">
              {apps.map((app) => (
                <div key={app.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {app.logoUrl && (
                        <img src={app.logoUrl} alt={app.name} className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          {app.type === 'game' ? (
                            <Gamepad2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Smartphone className="h-4 w-4 text-primary" />
                          )}
                          <h4 className="font-semibold">{app.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{app.description}</p>
                        <p className="text-xs text-muted-foreground">By: {app.developerName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(app.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteApp(app.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingId === app.id && (
                    <div className="border-t pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          defaultValue={app.name}
                          placeholder="Name"
                          id={`edit-name-${app.id}`}
                        />
                        <Input
                          defaultValue={app.developerName}
                          placeholder="Developer"
                          id={`edit-dev-${app.id}`}
                        />
                      </div>
                      <Textarea
                        defaultValue={app.htmlCode}
                        placeholder="HTML Code"
                        id={`edit-html-${app.id}`}
                        rows={3}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          defaultValue={app.buyContact}
                          placeholder="Buy Contact"
                          id={`edit-contact-${app.id}`}
                        />
                        <Input
                          defaultValue={app.buyContactLink}
                          placeholder="Buy Link"
                          id={`edit-link-${app.id}`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const name = (document.getElementById(`edit-name-${app.id}`) as HTMLInputElement)?.value;
                            const developerName = (document.getElementById(`edit-dev-${app.id}`) as HTMLInputElement)?.value;
                            const htmlCode = (document.getElementById(`edit-html-${app.id}`) as HTMLTextAreaElement)?.value;
                            const buyContact = (document.getElementById(`edit-contact-${app.id}`) as HTMLInputElement)?.value;
                            const buyContactLink = (document.getElementById(`edit-link-${app.id}`) as HTMLInputElement)?.value;
                            handleUpdateApp(app.id, { name, developerName, htmlCode, buyContact, buyContactLink });
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}