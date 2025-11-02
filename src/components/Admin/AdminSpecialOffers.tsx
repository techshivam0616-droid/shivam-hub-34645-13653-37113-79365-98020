import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

interface Offer {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
  createdAt?: string;
}

export function AdminSpecialOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Offer>({ title: '', description: '', imageUrl: '', active: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'special_offers'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: Offer[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Offer) }));
      setOffers(list);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffers(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', imageUrl: '', active: true });
    setEditingId(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'special_offers', editingId), { ...form });
        toast.success('Offer updated');
      } else {
        await addDoc(collection(db, 'special_offers'), { ...form, createdAt: new Date().toISOString() });
        toast.success('Offer added');
      }
      await loadOffers();
      resetForm();
    } catch (e) {
      console.error(e);
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (offer: Offer) => {
    setEditingId(offer.id!);
    setForm({ title: offer.title, description: offer.description, imageUrl: offer.imageUrl, active: offer.active });
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this offer?')) return;
    try {
      await deleteDoc(doc(db, 'special_offers', id));
      toast.success('Offer deleted');
      await loadOffers();
    } catch (e) {
      console.error(e);
      toast.error('Delete failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Special Offers (Blue Tick)</CardTitle>
        <CardDescription>Add, edit or disable offers visible to verified users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e)=>setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" value={form.imageUrl} onChange={(e)=>setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e)=>setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" className="h-4 w-4" checked={form.active} onChange={(e)=>setForm({ ...form, active: e.target.checked })} />
            <Label htmlFor="active">Active</Label>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Saving...</>) : (<><Save className="h-4 w-4 mr-2"/>{editingId? 'Update Offer':'Add Offer'}</>)}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm} className="ml-2">
              <Plus className="h-4 w-4 mr-2"/>New Offer
            </Button>
          )}
        </form>

        <div className="grid md:grid-cols-2 gap-4">
          {loading ? (
            <div className="flex justify-center py-6 col-span-2"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
          ) : offers.length === 0 ? (
            <p className="text-muted-foreground">No offers yet</p>
          ) : (
            offers.map(of => (
              <div key={of.id} className="border rounded-lg p-4 space-y-2">
                {of.imageUrl && (
                  <img src={of.imageUrl} alt={of.title} className="w-full h-40 object-cover rounded" loading="lazy" />
                )}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{of.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${of.active ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>{of.active ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-sm text-muted-foreground">{of.description}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={()=>onEdit(of)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={()=>onDelete(of.id!)}>
                    <Trash2 className="h-4 w-4 mr-1"/>Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
