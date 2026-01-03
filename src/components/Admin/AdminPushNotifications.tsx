import { useState, useEffect } from 'react';
import { ref, get, child } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
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
  const { settings } = useWebsiteSettings();
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
    } catch (error: any) {
      console.error('Error fetching tokens:', error);
      // Check if it's a permission denied error
      if (error?.code === 'PERMISSION_DENIED') {
        toast.error('Database permission denied. Please check Firebase Realtime Database rules.');
      } else {
        toast.error('Failed to fetch subscriber tokens: ' + (error?.message || 'Unknown error'));
      }
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
      // Call the Edge Function to send FCM notifications with website logo
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          body,
          tokens: tokenList,
          icon: settings.logoUrl,
          siteName: settings.siteName,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(`Notification sent to ${data.sent}/${data.total} devices!`);
        if (data.failed > 0) {
          toast.warning(`${data.failed} notifications failed to send`);
        }
        setTitle('');
        setBody('');
      } else {
        throw new Error(data.error || 'Failed to send notifications');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
