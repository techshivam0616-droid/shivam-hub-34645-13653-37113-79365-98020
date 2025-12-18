import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Heart, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

export function FeedbackPopup() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Show feedback popup every 2-3 minutes (random between 2-3 min)
    const interval = Math.floor(Math.random() * (180000 - 120000 + 1)) + 120000;
    
    const timer = setInterval(() => {
      // Only show if user is logged in and hasn't submitted recently
      const lastFeedback = localStorage.getItem('lastFeedbackTime');
      const now = Date.now();
      
      if (user && (!lastFeedback || now - parseInt(lastFeedback) > 300000)) {
        setOpen(true);
      }
    }, interval);

    // Initial delay of 2 minutes before first popup
    const initialTimer = setTimeout(() => {
      if (user) {
        const lastFeedback = localStorage.getItem('lastFeedbackTime');
        if (!lastFeedback || Date.now() - parseInt(lastFeedback) > 300000) {
          setOpen(true);
        }
      }
    }, 120000);

    return () => {
      clearInterval(timer);
      clearTimeout(initialTimer);
    };
  }, [user]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        userName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
        rating,
        feedback: feedback.trim(),
        createdAt: serverTimestamp(),
        page: window.location.pathname
      });

      localStorage.setItem('lastFeedbackTime', Date.now().toString());
      toast.success('Thank you for your feedback! ❤️');
      setOpen(false);
      setRating(0);
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('lastFeedbackTime', Date.now().toString());
    setOpen(false);
  };

  const emojis = ['😢', '😕', '😐', '😊', '😍'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto mb-4"
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          
          <DialogTitle className="text-xl text-center">
            <span className="gradient-text flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              How's your experience?
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </span>
          </DialogTitle>
          
          <DialogDescription className="text-center">
            Your feedback helps us improve TS HUB
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Emoji Rating */}
          <div className="flex justify-center gap-3">
            {emojis.map((emoji, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(index + 1)}
                className={`text-3xl p-2 rounded-full transition-all ${
                  rating === index + 1
                    ? 'bg-primary/20 ring-2 ring-primary scale-110'
                    : 'hover:bg-muted'
                }`}
              >
                {emoji}
              </motion.button>
            ))}
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= rating
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-muted-foreground'
                  }`}
                />
              </motion.button>
            ))}
          </div>

          {/* Feedback Text */}
          <Textarea
            placeholder="Tell us more about your experience... (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="resize-none"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Heart className="h-4 w-4 mr-2" />
              {submitting ? 'Sending...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
