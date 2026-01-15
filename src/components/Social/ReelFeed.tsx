import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { KingBadge } from '@/components/ui/KingBadge';
import { getAvatarById } from './avatars';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Shayari {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  timestamp: number;
  likes: string[];
  comments: { userId: string; userName: string; text: string; timestamp: number }[];
  saved: string[];
}

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  bio: string;
  avatar: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export function ReelFeed() {
  const { user } = useAuth();
  const [shayaris, setShayaris] = useState<Shayari[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    const q = query(collection(db, 'shayaris'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const posts: Shayari[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail || '',
          userAvatar: data.userAvatar,
          timestamp: data.timestamp?.toMillis?.() || Date.now(),
          likes: data.likes || [],
          comments: data.comments || [],
          saved: data.saved || []
        };
      });

      setShayaris(posts);

      const uniqueEmails = [...new Set(posts.map(p => p.userEmail).filter(Boolean))];
      const verified = new Set<string>();

      await Promise.all(
        uniqueEmails.map(async (email) => {
          try {
            const verDoc = await getDoc(doc(db, 'verified_users', email));
            if (verDoc.exists() && verDoc.data()?.verified) {
              verified.add(email);
            }
          } catch (e) {}
        })
      );

      setVerifiedUsers(verified);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < shayaris.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentIndex < shayaris.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const toggleLike = async (shayariId: string) => {
    if (!user) return;

    try {
      const shayariRef = doc(db, 'shayaris', shayariId);
      const shayari = shayaris.find(s => s.id === shayariId);
      if (!shayari) return;

      const newLikes = shayari.likes.includes(user.uid)
        ? shayari.likes.filter(id => id !== user.uid)
        : [...shayari.likes, user.uid];

      await updateDoc(shayariRef, { likes: newLikes });
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const toggleSave = async (shayariId: string) => {
    if (!user) return;

    try {
      const shayariRef = doc(db, 'shayaris', shayariId);
      const shayari = shayaris.find(s => s.id === shayariId);
      if (!shayari) return;

      const newSaved = shayari.saved.includes(user.uid)
        ? shayari.saved.filter(id => id !== user.uid)
        : [...shayari.saved, user.uid];

      await updateDoc(shayariRef, { saved: newSaved });
      toast.success(newSaved.includes(user.uid) ? 'Saved!' : 'Removed');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const addComment = async (shayariId: string) => {
    if (!commentText.trim() || !user) return;

    try {
      const shayariRef = doc(db, 'shayaris', shayariId);
      const shayari = shayaris.find(s => s.id === shayariId);
      if (!shayari) return;

      const newComment = {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        text: commentText,
        timestamp: Date.now()
      };

      await updateDoc(shayariRef, {
        comments: [...shayari.comments, newComment]
      });

      setCommentText('');
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const viewProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, 'user_profiles', userId));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const isVerified = verifiedUsers.has(data.email);

        if (user) {
          const followDoc = await getDoc(doc(db, 'follows', `${user.uid}_${userId}`));
          setIsFollowing(followDoc.exists());
        }

        const followersSnap = await getDocs(query(collection(db, 'follows'), where('followingId', '==', userId)));
        const followingSnap = await getDocs(query(collection(db, 'follows'), where('followerId', '==', userId)));
        const postsSnap = await getDocs(query(collection(db, 'shayaris'), where('userId', '==', userId)));

        setSelectedProfile({
          id: userId,
          displayName: data.displayName || 'User',
          email: data.email || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
          isVerified,
          followersCount: followersSnap.size,
          followingCount: followingSnap.size,
          postsCount: postsSnap.size
        });
      }
    } catch (error) {
      console.error('Error viewing profile:', error);
    }
  };

  const handleShare = (shayari: Shayari) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check this Shayari',
        text: shayari.text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shayari.text);
      toast.success('Copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (shayaris.length === 0) {
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center text-muted-foreground">
        No shayaris yet
      </div>
    );
  }

  const currentShayari = shayaris[currentIndex];
  const isVerified = verifiedUsers.has(currentShayari?.userEmail);
  const isLiked = currentShayari?.likes.includes(user?.uid || '');
  const isSaved = currentShayari?.saved.includes(user?.uid || '');
  const avatarData = currentShayari?.userAvatar ? getAvatarById(currentShayari.userAvatar) : null;

  return (
    <>
      <div
        ref={containerRef}
        className="h-[calc(100vh-200px)] relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentShayari.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="h-full flex flex-col justify-center px-6 py-8"
          >
            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xl md:text-2xl font-medium text-center leading-relaxed whitespace-pre-wrap px-4">
                {currentShayari.text}
              </p>
            </div>

            {/* Bottom User Info */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => viewProfile(currentShayari.userId)}
            >
              <Avatar className={`h-10 w-10 ring-2 ${isVerified ? 'ring-blue-500' : 'ring-border'}`}>
                {avatarData ? (
                  <AvatarImage src={avatarData.url} />
                ) : (
                  <AvatarFallback className={isVerified ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' : ''}>
                    {currentShayari.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{currentShayari.userName}</span>
                  {isVerified && <KingBadge size="md" />}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(currentShayari.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right Side Actions */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6">
          <button
            onClick={() => toggleLike(currentShayari.id)}
            className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
          >
            <div className={`p-3 rounded-full ${isLiked ? 'bg-red-500/20' : 'bg-muted/80'}`}>
              <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </div>
            <span className="text-xs font-semibold">{currentShayari.likes.length}</span>
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
          >
            <div className="p-3 rounded-full bg-muted/80">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold">{currentShayari.comments.length}</span>
          </button>

          <button
            onClick={() => toggleSave(currentShayari.id)}
            className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
          >
            <div className={`p-3 rounded-full ${isSaved ? 'bg-primary/20' : 'bg-muted/80'}`}>
              <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-primary text-primary' : ''}`} />
            </div>
          </button>

          <button
            onClick={() => handleShare(currentShayari)}
            className="flex flex-col items-center gap-1 transition-transform hover:scale-110"
          >
            <div className="p-3 rounded-full bg-muted/80">
              <Share2 className="h-6 w-6" />
            </div>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="absolute right-2 top-4 flex flex-col gap-1">
          {shayaris.slice(0, 10).map((_, idx) => (
            <div
              key={idx}
              className={`w-1 h-4 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Comments Sheet */}
      <Sheet open={showComments} onOpenChange={setShowComments}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Comments ({currentShayari?.comments.length || 0})</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(60vh-120px)] mt-4">
            {currentShayari?.comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No comments yet</p>
            ) : (
              <div className="space-y-4 pr-4">
                {currentShayari?.comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-semibold">{comment.userName}</span>
                      <p className="text-sm text-muted-foreground">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-2 mt-4">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addComment(currentShayari.id)}
            />
            <Button onClick={() => addComment(currentShayari.id)} disabled={!commentText.trim()}>
              Post
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Profile Sheet */}
      <Sheet open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Profile</SheetTitle>
          </SheetHeader>
          {selectedProfile && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className={`h-24 w-24 ring-4 ${selectedProfile.isVerified ? 'ring-blue-500' : 'ring-primary'}`}>
                  {selectedProfile.avatar ? (
                    <AvatarImage src={getAvatarById(selectedProfile.avatar)?.url} />
                  ) : (
                    <AvatarFallback className="text-2xl bg-primary/20">
                      {selectedProfile.displayName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="mt-4 flex items-center gap-2">
                  <h3 className="text-xl font-bold">{selectedProfile.displayName}</h3>
                  {selectedProfile.isVerified && <KingBadge size="lg" />}
                </div>
                {selectedProfile.bio && (
                  <p className="mt-2 text-sm text-muted-foreground">{selectedProfile.bio}</p>
                )}
              </div>

              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedProfile.postsCount}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedProfile.followersCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedProfile.followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>

              {selectedProfile.id !== user?.uid && (
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  className="w-full"
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
