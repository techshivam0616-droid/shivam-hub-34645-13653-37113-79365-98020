import { useState, useEffect } from 'react';
import { ref, get, child } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bell, Send, Users, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TokenData {
  token: string;
  email: string;
  displayName: string;
  platform: string;
  createdAt: number;
}

export default function AdminPushNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<Record<string, TokenData>>({});
  const [loadingTokens, setLoadingTokens] = useState(true);

  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const dbRef = ref(realtimeDb);
      const snapshot = await get(child(dbRef, 'tokens'));
      if (snapshot.exists()) {
        setTokens(snapshot.val());
      } else {
        setTokens({});
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Failed to fetch subscriber tokens');
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    const tokenList = Object.values(tokens).map(t => t.token);
    
    if (tokenList.length === 0) {
      toast.error('No subscribers to send notifications to');
      return;
    }

    setLoading(true);

    try {
      // Note: For production, you should use Firebase Admin SDK via a Cloud Function
      // This is a client-side demonstration. For actual FCM HTTP v1 API calls,
      // you need a backend service with proper authentication.
      
      // Save notification to Firestore for record keeping
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await addDoc(collection(db, 'push_notifications'), {
        title,
        body,
        sentAt: serverTimestamp(),
        recipientCount: tokenList.length,
        tokens: tokenList,
      });

      toast.success(`Notification queued for ${tokenList.length} subscribers!`);
      toast.info('Note: For live push, configure Firebase Cloud Functions with FCM Admin SDK');
      
      setTitle('');
      setBody('');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const subscriberCount = Object.keys(tokens).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Send push notifications to all subscribed users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendNotification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                placeholder="Enter notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Enter notification message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Subscribers
              </CardTitle>
              <CardDescription>
                Users who enabled push notifications
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTokens} disabled={loadingTokens}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingTokens ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTokens ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscriberCount === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No subscribers yet. Users need to enable notifications first.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="text-lg font-semibold text-center py-2 bg-primary/10 rounded-lg">
                {subscriberCount} Subscriber{subscriberCount !== 1 ? 's' : ''}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {Object.entries(tokens).map(([uid, data]) => (
                  <div
                    key={uid}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {data.displayName || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.email || 'No email'}
                      </p>
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      {data.platform || 'unknown'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
