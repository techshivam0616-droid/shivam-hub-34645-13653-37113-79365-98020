import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notice {
  id: string;
  title: string;
  message: string;
  imageUrl: string;
  active: boolean;
}

export function NoticePopup() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen notice today
    const lastSeen = localStorage.getItem('noticeLastSeen');
    const today = new Date().toDateString();
    
    if (lastSeen === today) {
      return; // Don't show if already seen today
    }

    const q = query(
      collection(db, 'notices'),
      where('active', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const noticeData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        } as Notice;
        setNotice(noticeData);
        setOpen(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleClose = () => {
    setOpen(false);
    // Mark as seen for today
    localStorage.setItem('noticeLastSeen', new Date().toDateString());
  };

  if (!notice) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-2 border-primary">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center justify-between">
            {notice.title}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {notice.imageUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <img
                src={notice.imageUrl}
                alt={notice.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <p className="text-base text-muted-foreground whitespace-pre-wrap">
            {notice.message}
          </p>
          
          <Button onClick={handleClose} className="w-full">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
