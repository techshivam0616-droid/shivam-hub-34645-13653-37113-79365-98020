import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { KingBadge } from '@/components/ui/KingBadge';
import { getAvatarById } from './avatars';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  isVerified: boolean;
  isFollowing: boolean;
}

export function UserProfilesBox() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    
    try {
      const profilesSnapshot = await getDocs(collection(db, 'user_profiles'));
      const verifiedSnapshot = await getDocs(collection(db, 'verified_users'));
      const verifiedEmails = new Set(
        verifiedSnapshot.docs
          .filter(d => d.data()?.verified)
          .map(d => d.id)
      );

      // Get user's following list
      const followingSnapshot = await getDocs(
        query(collection(db, 'follows'), where('followerId', '==', user.uid))
      );
      const followingIds = new Set(followingSnapshot.docs.map(d => d.data().followingId));

      const userProfiles: UserProfile[] = profilesSnapshot.docs
        .filter(d => d.id !== user.uid) // Exclude current user
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            displayName: data.displayName || 'User',
            email: data.email || '',
            avatar: data.avatar || '',
            isVerified: verifiedEmails.has(data.email),
            isFollowing: followingIds.has(d.id)
          };
        })
        .slice(0, 10); // Show top 10

      setProfiles(userProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (profileId: string) => {
    if (!user) return;

    try {
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) return;

      // Find and delete or create follow document
      const followsSnapshot = await getDocs(
        query(
          collection(db, 'follows'),
          where('followerId', '==', user.uid),
          where('followingId', '==', profileId)
        )
      );

      if (profile.isFollowing) {
        // Unfollow
        for (const docSnap of followsSnapshot.docs) {
          await deleteDoc(doc(db, 'follows', docSnap.id));
        }
        toast.success('Unfollowed');
      } else {
        // Follow
        await addDoc(collection(db, 'follows'), {
          followerId: user.uid,
          followingId: profileId,
          timestamp: serverTimestamp()
        });
        toast.success('Following!');
      }

      // Update local state
      setProfiles(profiles.map(p => 
        p.id === profileId 
          ? { ...p, isFollowing: !p.isFollowing }
          : p
      ));
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (!user) return null;

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          <span className="gradient-text">Suggested for you</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">
            No profiles yet. Be the first!
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {profiles.map((profile, index) => {
                const avatarData = profile.avatar ? getAvatarById(profile.avatar) : null;
                
                return (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className={`h-10 w-10 ring-2 ${profile.isVerified ? 'ring-blue-500' : 'ring-border'}`}>
                        {avatarData ? (
                          <AvatarImage src={avatarData.url} />
                        ) : (
                          <AvatarFallback className={profile.isVerified ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' : ''}>
                            {profile.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold truncate max-w-[100px]">
                            {profile.displayName}
                          </span>
                          {profile.isVerified && <KingBadge size="sm" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {profile.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={profile.isFollowing ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleFollow(profile.id)}
                      className="h-7 text-xs"
                    >
                      {profile.isFollowing ? (
                        <>
                          <UserMinus className="h-3 w-3 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
