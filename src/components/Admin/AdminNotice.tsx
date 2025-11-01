import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Bell } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  message: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
}

export function AdminNotice() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    imageUrl: '',
    active: true
  });

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticesData: Notice[] = [];
      snapshot.forEach((doc) => {
        noticesData.push({ id: doc.id, ...doc.data() } as Notice);
      });
      setNotices(noticesData);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'notices', editingId), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Notice updated successfully');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'notices'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Notice created successfully');
      }
      setFormData({ title: '', message: '', imageUrl: '', active: true });
    } catch (error) {
      console.error('Error saving notice:', error);
      toast.error('Failed to save notice');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setFormData({
      title: notice.title,
      message: notice.message,
      imageUrl: notice.imageUrl || '',
      active: notice.active
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      await deleteDoc(doc(db, 'notices', id));
      toast.success('Notice deleted successfully');
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('Failed to delete notice');
    }
  };

  const toggleActive = async (notice: Notice) => {
    try {
      await updateDoc(doc(db, 'notices', notice.id), {
        active: !notice.active
      });
      toast.success(`Notice ${!notice.active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling notice:', error);
      toast.error('Failed to update notice');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', message: '', imageUrl: '', active: true });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {editingId ? 'Edit Notice' : 'Create New Notice'}
          </CardTitle>
          <CardDescription>
            Add festival wishes, announcements, or important notices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Happy Diwali 🪔"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Your announcement message..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (Optional)</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="active">Active (Show to users)</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Notice' : 'Create Notice'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Notices</CardTitle>
          <CardDescription>Manage your notices and announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No notices yet</p>
            ) : (
              notices.map((notice) => (
                <Card key={notice.id} className={!notice.active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {notice.imageUrl && (
                        <img
                          src={notice.imageUrl}
                          alt={notice.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{notice.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{notice.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={notice.active ? 'default' : 'outline'}
                          onClick={() => toggleActive(notice)}
                        >
                          {notice.active ? 'Active' : 'Inactive'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(notice)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(notice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
