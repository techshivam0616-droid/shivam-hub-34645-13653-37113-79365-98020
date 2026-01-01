import { useState, useEffect } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

const DISMISS_KEY = 'notification_prompt_dismissed';
const LATER_KEY = 'notification_prompt_later';
const LATER_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function NotificationPrompt() {
  const { permission, isLoading, requestPermission } = usePushNotifications();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user dismissed permanently or chose "later"
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const laterTime = localStorage.getItem(LATER_KEY);
    
    if (dismissed === 'true') {
      setIsVisible(false);
      return;
    }
    
    if (laterTime) {
      const laterTimestamp = parseInt(laterTime, 10);
      if (Date.now() < laterTimestamp) {
        setIsVisible(false);
        return;
      }
      // Clear expired later preference
      localStorage.removeItem(LATER_KEY);
    }
    
    // Show if user is logged in and permission is default
    if (user && permission === 'default') {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user, permission]);

  const handleLater = () => {
    localStorage.setItem(LATER_KEY, String(Date.now() + LATER_DURATION));
    setIsVisible(false);
  };

  const handleClose = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setIsVisible(false);
  };

  const handleEnable = async () => {
    await requestPermission();
    setIsVisible(false);
  };

  // Don't show if not visible, not supported, or already granted/denied
  if (!isVisible || permission === 'unsupported' || permission === 'granted' || permission === 'denied') {
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
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Enable Notifications</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2 -mt-1"
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Get notified about updates, offers & new content on your device!
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleEnable}
                disabled={isLoading}
                size="sm"
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleLater}
                disabled={isLoading}
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
