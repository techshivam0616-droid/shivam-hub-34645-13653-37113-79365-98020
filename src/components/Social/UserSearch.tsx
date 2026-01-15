import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, UserPlus, UserMinus, Ban, X } from 'lucide-react';
import { FaWhatsapp, FaTelegram, FaInstagram } from 'react-icons/fa';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { KingBadge } from '@/components/ui/KingBadge';
import { getAvatarById } from './avatars';

interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  bio: string;
  avatar: string;
  email: string;
  whatsappNumber: string;
  telegramUsername: string;
  instagramId: string;
  hideWhatsapp: boolean;
  hideTelegram: boolean;
  hideInstagram: boolean;
  isVerified: boolean;
  isFollowing: boolean;
  isBlocked: boolean;
}

export function UserSearch() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [verifiedEmails, setVerifiedEmails] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    if (!user) return;

    try {
      // Fetch verified users
      const verifiedSnap = await getDocs(collection(db, 'verified_users'));
      const verified = new Set<string>();
      verifiedSnap.docs.forEach(d => {
        if (d.data()?.verified) verified.add(d.id);
      });
      setVerifiedEmails(verified);

      // Fetch following list
      const followsSnap = await getDocs(
        query(collection(db, 'follows'), where('followerId', '==', user.uid))
      );
      const following = new Set<string>();
      followsSnap.docs.forEach(d => following.add(d.data().followingId));
      setFollowingIds(following);

      // Fetch blocked users
      const blockedSnap = await getDocs(
        query(collection(db, 'blocked_users'), where('blockerId', '==', user.uid))
      );
      const blocked = new Set<string>();
      blockedSnap.docs.forEach(d => blocked.add(d.data().blockedId));
      setBlockedIds(blocked);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim() || !user) return;

    setLoading(true);
    try {
      const profilesSnap = await getDocs(collection(db, 'user_profiles'));
      const results: UserProfile[] = [];

      for (const profileDoc of profilesSnap.docs) {
        const data = profileDoc.data();
        const userId = profileDoc.id;

        // Skip current user
        if (userId === user.uid) continue;

        // Check if matches search
        const displayName = (data.displayName || '').toLowerCase();
        const username = (data.username || '').toLowerCase();
        const email = (data.email || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        if (displayName.includes(searchLower) || username.includes(searchLower) || email.includes(searchLower)) {
          results.push({
            id: userId,
            displayName: data.displayName || 'User',
            username: data.username || '',
            bio: data.bio || '',
            avatar: data.avatar || '',
            email: data.email || '',
            whatsappNumber: data.hideWhatsapp ? '' : (data.whatsappNumber || ''),
            telegramUsername: data.hideTelegram ? '' : (data.telegramUsername || ''),
            instagramId: data.hideInstagram ? '' : (data.instagramId || ''),
            hideWhatsapp: data.hideWhatsapp || false,
            hideTelegram: data.hideTelegram || false,
            hideInstagram: data.hideInstagram || false,
            isVerified: verifiedEmails.has(data.email),
            isFollowing: followingIds.has(userId),
            isBlocked: blockedIds.has(userId)
          });
        }
      }

      setUsers(results);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (targetUser: UserProfile) => {
    if (!user) return;

    try {
      const followDocId = `${user.uid}_${targetUser.id}`;

      if (targetUser.isFollowing) {
        await deleteDoc(doc(db, 'follows', followDocId));
        setFollowingIds(prev => {
          const updated = new Set(prev);
          updated.delete(targetUser.id);
          return updated;
        });
        toast.success(`Unfollowed ${targetUser.displayName}`);
      } else {
        await setDoc(doc(db, 'follows', followDocId), {
          followerId: user.uid,
          followingId: targetUser.id,
          createdAt: new Date()
        });
        setFollowingIds(prev => new Set([...prev, targetUser.id]));
        toast.success(`Following ${targetUser.displayName}`);
      }

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === targetUser.id ? { ...u, isFollowing: !u.isFollowing } : u
      ));

      if (selectedProfile?.id === targetUser.id) {
        setSelectedProfile({ ...selectedProfile, isFollowing: !selectedProfile.isFollowing });
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  const toggleBlock = async (targetUser: UserProfile) => {
    if (!user) return;

    try {
      const blockDocId = `${user.uid}_${targetUser.id}`;

      if (targetUser.isBlocked) {
        await deleteDoc(doc(db, 'blocked_users', blockDocId));
        setBlockedIds(prev => {
          const updated = new Set(prev);
          updated.delete(targetUser.id);
          return updated;
        });
        toast.success(`Unblocked ${targetUser.displayName}`);
      } else {
        await setDoc(doc(db, 'blocked_users', blockDocId), {
          blockerId: user.uid,
          blockedId: targetUser.id,
          createdAt: new Date()
        });
        setBlockedIds(prev => new Set([...prev, targetUser.id]));
        
        // Also unfollow if following
        if (targetUser.isFollowing) {
          const followDocId = `${user.uid}_${targetUser.id}`;
          await deleteDoc(doc(db, 'follows', followDocId));
          setFollowingIds(prev => {
            const updated = new Set(prev);
            updated.delete(targetUser.id);
            return updated;
          });
        }
        
        toast.success(`Blocked ${targetUser.displayName}`);
      }

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === targetUser.id ? { ...u, isBlocked: !u.isBlocked, isFollowing: u.isBlocked ? u.isFollowing : false } : u
      ));

      if (selectedProfile?.id === targetUser.id) {
        setSelectedProfile({ 
          ...selectedProfile, 
          isBlocked: !selectedProfile.isBlocked,
          isFollowing: selectedProfile.isBlocked ? selectedProfile.isFollowing : false
        });
      }
    } catch (error) {
      toast.error('Failed to update block status');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  };

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Please login to search users</p>
      </Card>
    );
  }

  const selectedAvatarData = selectedProfile?.avatar ? getAvatarById(selectedProfile.avatar) : null;

  return (
    <>
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={searchUsers} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Results */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No users found' : 'Search for users to connect'}
              </p>
            ) : (
              <div className="space-y-3">
                {users.map((userProfile, index) => {
                  const avatarData = userProfile.avatar ? getAvatarById(userProfile.avatar) : null;

                  return (
                    <motion.div
                      key={userProfile.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <button
                        onClick={() => setSelectedProfile(userProfile)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <Avatar className={`h-12 w-12 ring-2 ${userProfile.isVerified ? 'ring-blue-500' : 'ring-border'}`}>
                          {avatarData ? (
                            <AvatarImage src={avatarData.url} />
                          ) : (
                            <AvatarFallback>{userProfile.displayName.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{userProfile.displayName}</span>
                            {userProfile.isVerified && <KingBadge size="md" />}
                          </div>
                          {userProfile.username && (
                            <p className="text-xs text-primary">@{userProfile.username}</p>
                          )}
                          {userProfile.isBlocked && (
                            <Badge variant="destructive" className="text-xs mt-1">Blocked</Badge>
                          )}
                        </div>
                      </button>

                      <div className="flex gap-2">
                        {!userProfile.isBlocked && (
                          <Button
                            size="sm"
                            variant={userProfile.isFollowing ? 'outline' : 'default'}
                            onClick={() => toggleFollow(userProfile)}
                          >
                            {userProfile.isFollowing ? (
                              <><UserMinus className="h-4 w-4 mr-1" /> Unfollow</>
                            ) : (
                              <><UserPlus className="h-4 w-4 mr-1" /> Follow</>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={userProfile.isBlocked ? 'destructive' : 'outline'}
                          onClick={() => toggleBlock(userProfile)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* User Profile Sheet */}
      <Sheet open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </SheetTitle>
          </SheetHeader>
          
          {selectedProfile && (
            <div className="mt-6 space-y-6">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 ring-4 ring-primary">
                  {selectedAvatarData ? (
                    <AvatarImage src={selectedAvatarData.url} />
                  ) : (
                    <AvatarFallback className="text-2xl bg-primary/20">
                      {selectedProfile.displayName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-xl font-bold">{selectedProfile.displayName}</h3>
                    {selectedProfile.isVerified && <KingBadge size="lg" />}
                  </div>
                  {selectedProfile.username && (
                    <p className="text-primary">@{selectedProfile.username}</p>
                  )}
                  {selectedProfile.bio && (
                    <p className="text-muted-foreground mt-2">{selectedProfile.bio}</p>
                  )}
                  {selectedProfile.isBlocked && (
                    <Badge variant="destructive" className="mt-2">Blocked</Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                {!selectedProfile.isBlocked && (
                  <Button
                    variant={selectedProfile.isFollowing ? 'outline' : 'default'}
                    onClick={() => toggleFollow(selectedProfile)}
                  >
                    {selectedProfile.isFollowing ? (
                      <><UserMinus className="h-4 w-4 mr-2" /> Unfollow</>
                    ) : (
                      <><UserPlus className="h-4 w-4 mr-2" /> Follow</>
                    )}
                  </Button>
                )}
                <Button
                  variant={selectedProfile.isBlocked ? 'destructive' : 'outline'}
                  onClick={() => toggleBlock(selectedProfile)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  {selectedProfile.isBlocked ? 'Unblock' : 'Block'}
                </Button>
              </div>

              {/* Contact Info */}
              {!selectedProfile.isBlocked && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">Contact</h4>
                  
                  {selectedProfile.whatsappNumber && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <FaWhatsapp className="h-5 w-5 text-green-500" />
                      <span>{selectedProfile.whatsappNumber}</span>
                    </div>
                  )}
                  
                  {selectedProfile.telegramUsername && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <FaTelegram className="h-5 w-5 text-blue-500" />
                      <span>{selectedProfile.telegramUsername}</span>
                    </div>
                  )}
                  
                  {selectedProfile.instagramId && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <FaInstagram className="h-5 w-5 text-pink-500" />
                      <span>{selectedProfile.instagramId}</span>
                    </div>
                  )}

                  {!selectedProfile.whatsappNumber && !selectedProfile.telegramUsername && !selectedProfile.instagramId && (
                    <p className="text-muted-foreground text-center py-4">No contact info available</p>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
