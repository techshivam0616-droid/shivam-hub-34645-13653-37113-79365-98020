import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, getDocs, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { KingBadge } from '@/components/ui/KingBadge';
import { getAvatarById } from './avatars';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

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
}

export function SocialFeed() {
  const { user } = useAuth();
  const [shayaris, setShayaris] = useState<Shayari[]>([]);
  const [newShayari, setNewShayari] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // Listen to shayaris
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
      
      // Fetch verification status and profiles
      const uniqueEmails = [...new Set(posts.map(p => p.userEmail).filter(Boolean))];
      const verified = new Set<string>();
      const profiles = new Map<string, UserProfile>();
      
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
      
      // Fetch user profiles
      const profilesSnapshot = await getDocs(collection(db, 'user_profiles'));
      profilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        profiles.set(doc.id, {
          id: doc.id,
          displayName: data.displayName || 'User',
          email: data.email || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
          isVerified: verified.has(data.email),
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0
        });
      });
      
      setVerifiedUsers(verified);
      setUserProfiles(profiles);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const postShayari = async () => {
    if (!newShayari.trim() || !user) return;
    
    try {
      // Get user's profile for avatar
      const profileDoc = await getDoc(doc(db, 'user_profiles', user.uid));
      const userAvatar = profileDoc.exists() ? profileDoc.data()?.avatar : '';
      
      await addDoc(collection(db, 'shayaris'), {
        text: newShayari,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userEmail: user.email || '',
        userAvatar,
        timestamp: serverTimestamp(),
        likes: [],
        comments: [],
        saved: []
      });
      
      setNewShayari('');
      toast.success('Shayari posted! ✨');
    } catch (error) {
      toast.error('Failed to post shayari');
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
      toast.success(newSaved.includes(user.uid) ? 'Saved!' : 'Removed from saved');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const viewProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, 'user_profiles', userId));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const isVerified = verifiedUsers.has(data.email);
        
        // Check if following
        if (user) {
          const followDoc = await getDoc(doc(db, 'follows', `${user.uid}_${userId}`));
          setIsFollowing(followDoc.exists());
        }
        
        // Get counts
        const followersSnap = await getDocs(query(collection(db, 'follows'), where('followingId', '==', userId)));
        const followingSnap = await getDocs(query(collection(db, 'follows'), where('followerId', '==', userId)));
        
        setSelectedProfile({
          id: userId,
          displayName: data.displayName || 'User',
          email: data.email || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
          isVerified,
          followersCount: followersSnap.size,
          followingCount: followingSnap.size
        });
      }
    } catch (error) {
      console.error('Error viewing profile:', error);
    }
  };

  const toggleFollow = async () => {
    if (!user || !selectedProfile) return;
    
    try {
      const followId = `${user.uid}_${selectedProfile.id}`;
      const followRef = doc(db, 'follows', followId);
      
      if (isFollowing) {
        await deleteDoc(followRef);
        setIsFollowing(false);
        setSelectedProfile(prev => prev ? { ...prev, followersCount: prev.followersCount - 1 } : null);
        toast.success('Unfollowed');
      } else {
        await addDoc(collection(db, 'follows'), {
          followerId: user.uid,
          followingId: selectedProfile.id,
          timestamp: serverTimestamp()
        });
        setIsFollowing(true);
        setSelectedProfile(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : null);
        toast.success('Following!');
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Please login to view the social feed</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Post */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary">
              {userProfiles.get(user.uid)?.avatar ? (
                <AvatarImage src={userProfiles.get(user.uid)?.avatar} />
              ) : (
                <AvatarFallback className="bg-primary/20">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={newShayari}
                onChange={(e) => setNewShayari(e.target.value)}
                placeholder="Share your shayari with the world... ✨"
                className="min-h-[80px] resize-none border-primary/30 focus:border-primary"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={postShayari}
                  disabled={!newShayari.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      ) : shayaris.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No shayaris yet. Be the first to share! ✨</p>
        </Card>
      ) : (
        <AnimatePresence>
          {shayaris.map((shayari, index) => {
            const isVerified = verifiedUsers.has(shayari.userEmail);
            const isLiked = shayari.likes.includes(user.uid);
            const isSaved = shayari.saved.includes(user.uid);
            const avatarData = shayari.userAvatar ? getAvatarById(shayari.userAvatar) : null;
            
            return (
              <motion.div
                key={shayari.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border border-border/50 hover:border-primary/30 transition-all overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-border/50">
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                        onClick={() => viewProfile(shayari.userId)}
                      >
                        <Avatar className={`h-8 w-8 ring-2 ${isVerified ? 'ring-blue-500' : 'ring-border'}`}>
                          {avatarData ? (
                            <AvatarImage src={avatarData.url} />
                          ) : (
                            <AvatarFallback className={isVerified ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' : ''}>
                              {shayari.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold">{shayari.userName}</span>
                            {isVerified && <KingBadge size="sm" />}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(shayari.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="p-4 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
                      <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">
                        {shayari.text}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between p-3 border-t border-border/50">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => toggleLike(shayari.id)}
                          className="flex items-center gap-1.5 hover:scale-110 transition-transform"
                        >
                          <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                          <span className="text-sm">{shayari.likes.length}</span>
                        </button>
                        <button 
                          onClick={() => setShowComments(showComments === shayari.id ? null : shayari.id)}
                          className="flex items-center gap-1.5 hover:scale-110 transition-transform"
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-sm">{shayari.comments.length}</span>
                        </button>
                      </div>
                      <button 
                        onClick={() => toggleSave(shayari.id)}
                        className="hover:scale-110 transition-transform"
                      >
                        <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-primary text-primary' : ''}`} />
                      </button>
                    </div>

                    {/* Comments Section */}
                    <AnimatePresence>
                      {showComments === shayari.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border/50 overflow-hidden"
                        >
                          <div className="p-3 space-y-3">
                            {/* Existing Comments */}
                            {shayari.comments.length > 0 && (
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {shayari.comments.map((comment, idx) => (
                                  <div key={idx} className="flex gap-2 text-sm">
                                    <span className="font-semibold">{comment.userName}</span>
                                    <span className="text-muted-foreground">{comment.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Add Comment */}
                            <div className="flex gap-2">
                              <Input
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 h-8 text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && addComment(shayari.id)}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => addComment(shayari.id)}
                                disabled={!commentText.trim()}
                              >
                                Post
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

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
                <p className="text-sm text-muted-foreground">{selectedProfile.email}</p>
                {selectedProfile.bio && (
                  <p className="mt-2 text-sm">{selectedProfile.bio}</p>
                )}
              </div>

              <div className="flex justify-center gap-8">
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
                  onClick={toggleFollow}
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
    </div>
  );
}
