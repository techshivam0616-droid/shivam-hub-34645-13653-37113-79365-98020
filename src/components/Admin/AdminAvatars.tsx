import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Trash2, Users, Image, Eye, Heart, MessageCircle, UserCheck, EyeOff, Phone } from 'lucide-react';
import { FaWhatsapp, FaTelegram, FaInstagram } from 'react-icons/fa';
import { KingBadge } from '@/components/ui/KingBadge';

interface CustomAvatar {
  id: string;
  name: string;
  url: string;
  category: 'male' | 'female' | 'other';
  isActive: boolean;
}

interface UserProfileData {
  id: string;
  displayName: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  whatsappNumber: string;
  telegramUsername: string;
  instagramId: string;
  hideWhatsapp: boolean;
  hideTelegram: boolean;
  hideInstagram: boolean;
  createdAt: any;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
}

export function AdminAvatars() {
  const [avatars, setAvatars] = useState<CustomAvatar[]>([]);
  const [users, setUsers] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAvatar, setNewAvatar] = useState<{ name: string; url: string; category: 'male' | 'female' | 'other' }>({ name: '', url: '', category: 'male' });
  const [verifiedEmails, setVerifiedEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch custom avatars
      const avatarsSnap = await getDocs(collection(db, 'custom_avatars'));
      const avatarsList = avatarsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomAvatar[];
      setAvatars(avatarsList);

      // Fetch verified users
      const verifiedSnap = await getDocs(collection(db, 'verified_users'));
      const verified = new Set<string>();
      verifiedSnap.docs.forEach(doc => {
        if (doc.data()?.verified) {
          verified.add(doc.id);
        }
      });
      setVerifiedEmails(verified);

      // Fetch all user profiles with stats
      const profilesSnap = await getDocs(collection(db, 'user_profiles'));
      const usersData: UserProfileData[] = [];

      for (const profileDoc of profilesSnap.docs) {
        const data = profileDoc.data();
        const userId = profileDoc.id;

        // Get posts count
        const postsSnap = await getDocs(query(collection(db, 'shayaris'), where('userId', '==', userId)));
        
        // Get followers count
        const followersSnap = await getDocs(query(collection(db, 'follows'), where('followingId', '==', userId)));
        
        // Get following count
        const followingSnap = await getDocs(query(collection(db, 'follows'), where('followerId', '==', userId)));

        usersData.push({
          id: userId,
          displayName: data.displayName || 'User',
          username: data.username || '',
          email: data.email || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
          whatsappNumber: data.whatsappNumber || '',
          telegramUsername: data.telegramUsername || '',
          instagramId: data.instagramId || '',
          hideWhatsapp: data.hideWhatsapp || false,
          hideTelegram: data.hideTelegram || false,
          hideInstagram: data.hideInstagram || false,
          createdAt: data.createdAt,
          postsCount: postsSnap.size,
          followersCount: followersSnap.size,
          followingCount: followingSnap.size,
          isVerified: verified.has(data.email)
        });
      }

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addAvatar = async () => {
    if (!newAvatar.name || !newAvatar.url) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await addDoc(collection(db, 'custom_avatars'), {
        name: newAvatar.name,
        url: newAvatar.url,
        category: newAvatar.category,
        isActive: true,
        createdAt: new Date()
      });

      toast.success('Avatar added successfully');
      setNewAvatar({ name: '', url: '', category: 'male' });
      fetchData();
    } catch (error) {
      console.error('Error adding avatar:', error);
      toast.error('Failed to add avatar');
    }
  };

  const deleteAvatar = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'custom_avatars', id));
      toast.success('Avatar deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Failed to delete avatar');
    }
  };

  const toggleAvatarStatus = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'custom_avatars', id), { isActive: !isActive });
      toast.success(isActive ? 'Avatar disabled' : 'Avatar enabled');
      fetchData();
    } catch (error) {
      console.error('Error toggling avatar:', error);
      toast.error('Failed to update avatar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="avatars">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="avatars" className="gap-2">
            <Image className="h-4 w-4" />
            Avatars
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avatars" className="space-y-6">
          {/* Add New Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Avatar
              </CardTitle>
              <CardDescription>Add custom avatar images for users to select</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Avatar Name</Label>
                  <Input
                    placeholder="Cool Beard"
                    value={newAvatar.name}
                    onChange={(e) => setNewAvatar({ ...newAvatar, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    placeholder="https://example.com/avatar.png"
                    value={newAvatar.url}
                    onChange={(e) => setNewAvatar({ ...newAvatar, url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newAvatar.category}
                    onValueChange={(v) => setNewAvatar({ ...newAvatar, category: v as 'male' | 'female' | 'other' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newAvatar.url && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Preview:</span>
                  <Avatar className="h-16 w-16 ring-2 ring-primary">
                    <AvatarImage src={newAvatar.url} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                </div>
              )}

              <Button onClick={addAvatar} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Avatar
              </Button>
            </CardContent>
          </Card>

          {/* Existing Avatars */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Avatars ({avatars.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {avatars.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No custom avatars yet</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {avatars.map((avatar) => (
                    <div
                      key={avatar.id}
                      className={`relative p-4 border rounded-lg text-center ${!avatar.isActive ? 'opacity-50' : ''}`}
                    >
                      <Avatar className="h-16 w-16 mx-auto ring-2 ring-border">
                        <AvatarImage src={avatar.url} />
                        <AvatarFallback>{avatar.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium mt-2 truncate">{avatar.name}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {avatar.category}
                      </Badge>
                      <div className="flex gap-1 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => toggleAvatarStatus(avatar.id, avatar.isActive)}
                        >
                          {avatar.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAvatar(avatar.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users ({users.length})
              </CardTitle>
              <CardDescription>View all user profiles with contact info (hidden fields shown with icon)</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead className="text-center">Stats</TableHead>
                      <TableHead className="text-center">Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-border">
                              {user.avatar ? (
                                <AvatarImage src={user.avatar} />
                              ) : (
                                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{user.displayName}</span>
                                {user.isVerified && <KingBadge size="md" />}
                              </div>
                              {user.username && (
                                <p className="text-xs text-primary">@{user.username}</p>
                              )}
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                              {user.bio && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.bio}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.whatsappNumber && (
                              <div className="flex items-center gap-2 text-xs">
                                <FaWhatsapp className="h-4 w-4 text-green-500" />
                                <span>{user.whatsappNumber}</span>
                                {user.hideWhatsapp && <span className="text-orange-500" title="Hidden"><EyeOff className="h-3 w-3" /></span>}
                              </div>
                            )}
                            {user.telegramUsername && (
                              <div className="flex items-center gap-2 text-xs">
                                <FaTelegram className="h-4 w-4 text-blue-500" />
                                <span>{user.telegramUsername}</span>
                                {user.hideTelegram && <span className="text-orange-500" title="Hidden"><EyeOff className="h-3 w-3" /></span>}
                              </div>
                            )}
                            {user.instagramId && (
                              <div className="flex items-center gap-2 text-xs">
                                <FaInstagram className="h-4 w-4 text-pink-500" />
                                <span>{user.instagramId}</span>
                                {user.hideInstagram && <span className="text-orange-500" title="Hidden"><EyeOff className="h-3 w-3" /></span>}
                              </div>
                            )}
                            {!user.whatsappNumber && !user.telegramUsername && !user.instagramId && (
                              <span className="text-xs text-muted-foreground">No contact info</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 justify-center">
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <MessageCircle className="h-3 w-3" />
                              {user.postsCount}
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Users className="h-3 w-3" />
                              {user.followersCount}
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-xs">
                              <UserCheck className="h-3 w-3" />
                              {user.followingCount}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.isVerified ? (
                            <Badge className="bg-blue-500">Verified</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
