import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationPrompt() {
  const { permission, isLoading, requestPermission } = usePushNotifications();
  const { user } = useAuth();

  // Don't show if not logged in or notifications not supported
  if (!user || permission === 'unsupported') {
    return null;
  }

  // Don't show if already granted
  if (permission === 'granted') {
    return null;
  }

  // Don't show if denied (user made their choice)
  if (permission === 'denied') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">Enable Notifications</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Get notified about updates, offers & new content!
            </p>
            <Button
              onClick={requestPermission}
              disabled={isLoading}
              size="sm"
              className="mt-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
