import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, getDocs, doc, updateDoc, setDoc, getDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Ban, CheckCircle, Shield, Users, Activity, Trash2, Clock, Search, Calendar } from 'lucide-react';
import blueTick from '@/assets/blue-tick.png';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  banned: boolean;
  banExpiry?: string;
  verified: boolean;
  lastActivity?: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [liveUsers, setLiveUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [banDuration, setBanDuration] = useState('permanent');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUsers();
    // Also set up real-time refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all data sources in parallel for better performance
      const [downloadsSnapshot, messagesSnapshot, shayarisSnapshot, profilesSnapshot, chatPresenceSnapshot] = await Promise.all([
        getDocs(collection(db, 'downloads')),
        getDocs(collection(db, 'messages')),
        getDocs(collection(db, 'shayaris')),
        getDocs(collection(db, 'user_profiles')),
        getDocs(collection(db, 'chat_presence'))
      ]);
      
      // Build profile lookup for display names
      const profileMap = new Map();
      profilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          profileMap.set(data.userId, data);
        }
      });
      
      const userMap = new Map();
      
      downloadsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId && !userMap.has(data.userId)) {
          const profile = profileMap.get(data.userId);
          userMap.set(data.userId, {
            id: data.userId,
            email: data.userEmail,
            displayName: profile?.displayName || data.userName || data.userEmail?.split('@')[0] || 'User',
            lastActivity: data.downloadedAt
          });
        }
      });

      // Also check messages for users
      messagesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          const profile = profileMap.get(data.userId);
          if (!userMap.has(data.userId)) {
            userMap.set(data.userId, {
              id: data.userId,
              email: data.userEmail,
              displayName: profile?.displayName || data.userName || 'User',
              lastActivity: data.timestamp
            });
          } else {
            // Update last activity if newer
            const existing = userMap.get(data.userId);
            if (data.timestamp && (!existing.lastActivity || data.timestamp > existing.lastActivity)) {
              existing.lastActivity = data.timestamp;
            }
          }
        }
      });

      // Also check shayaris
      shayarisSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          const profile = profileMap.get(data.userId);
          if (!userMap.has(data.userId)) {
            userMap.set(data.userId, {
              id: data.userId,
              email: data.userEmail,
              displayName: profile?.displayName || data.userName || 'User',
              lastActivity: data.createdAt
            });
          }
        }
      });
      
      // Count live users from chat_presence (active in last 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      let liveCount = 0;
      chatPresenceSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.lastSeen) {
          const lastSeenTime = new Date(data.lastSeen).getTime();
          if (lastSeenTime > fiveMinutesAgo) {
            liveCount++;
          }
        }
      });

      const usersWithStats = await Promise.all(
        Array.from(userMap.values()).map(async (user) => {
          const userStatsDoc = await getDoc(doc(db, 'user_stats', user.id));
          const verifiedDoc = await getDoc(doc(db, 'verified_users', user.email));
          
          const userStatsData = userStatsDoc.exists() ? userStatsDoc.data() : {};
          
          // Check if ban has expired
          let banned = userStatsData?.banned || false;
          if (banned && userStatsData?.banExpiry) {
            const expiryDate = new Date(userStatsData.banExpiry);
            if (expiryDate < new Date()) {
              banned = false;
              // Auto-unban
              await setDoc(doc(db, 'user_stats', user.id), { banned: false }, { merge: true });
            }
          }
          
          return {
            ...user,
            banned,
            banExpiry: userStatsData?.banExpiry,
            verified: verifiedDoc.exists() ? verifiedDoc.data()?.verified || false : false,
            lastActivity: userStatsData?.lastActivity || null
          };
        })
      );

      setUsers(usersWithStats);
      setTotalUsers(usersWithStats.length);
      setLiveUsers(liveCount);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const banUser = async (userId: string, duration: string) => {
    try {
      let banExpiry: string | null = null;
      
      if (duration !== 'permanent') {
        const now = new Date();
        switch (duration) {
          case '1h': now.setHours(now.getHours() + 1); break;
          case '24h': now.setHours(now.getHours() + 24); break;
          case '7d': now.setDate(now.getDate() + 7); break;
          case '30d': now.setDate(now.getDate() + 30); break;
        }
        banExpiry = now.toISOString();
      }
      
      await setDoc(doc(db, 'user_stats', userId), {
        banned: true,
        banExpiry,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast.success(`🚫 User banned ${duration === 'permanent' ? 'permanently' : `for ${duration}`}`);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await setDoc(doc(db, 'user_stats', userId), {
        banned: false,
        banExpiry: null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast.success('✅ User unbanned successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to unban user');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete user's messages
      const messagesSnapshot = await getDocs(query(collection(db, 'messages'), where('userId', '==', userId)));
      for (const docSnap of messagesSnapshot.docs) {
        await deleteDoc(doc(db, 'messages', docSnap.id));
      }
      
      // Delete user's shayaris
      const shayarisSnapshot = await getDocs(query(collection(db, 'shayaris'), where('userId', '==', userId)));
      for (const docSnap of shayarisSnapshot.docs) {
        await deleteDoc(doc(db, 'shayaris', docSnap.id));
      }
      
      // Delete user profile
      await deleteDoc(doc(db, 'user_profiles', userId));
      
      // Delete user stats
      await deleteDoc(doc(db, 'user_stats', userId));
      
      toast.success('🗑️ User and all their data deleted');
      setDeleteConfirmUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-primary">{totalUsers}</p>
              </div>
              <div className="bg-primary/20 p-3 rounded-full">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Live Users (5 min)</p>
                <p className="text-3xl font-bold text-green-600">{liveUsers}</p>
              </div>
              <div className="bg-green-600/20 p-3 rounded-full">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users - Ban, Unban, Delete</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                    user.banned 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{user.displayName}</p>
                        {user.verified && (
                          <img src={blueTick} alt="Verified" className="h-4 w-4 object-contain" />
                        )}
                        {user.banned && (
                          <div className="flex items-center gap-1 text-destructive">
                            <Shield className="h-4 w-4" />
                            {user.banExpiry && (
                              <span className="text-xs">
                                Until {new Date(user.banExpiry).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user.banned ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => unbanUser(user.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Unban
                      </Button>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ban {user.displayName}?</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Ban Duration</Label>
                              <Select value={banDuration} onValueChange={setBanDuration}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1h">1 Hour</SelectItem>
                                  <SelectItem value="24h">24 Hours</SelectItem>
                                  <SelectItem value="7d">7 Days</SelectItem>
                                  <SelectItem value="30d">30 Days</SelectItem>
                                  <SelectItem value="permanent">Permanent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              variant="destructive"
                              onClick={() => banUser(user.id, banDuration)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Confirm Ban
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete {user.displayName}?</DialogTitle>
                        </DialogHeader>
                        <p className="text-muted-foreground">
                          This will permanently delete this user and all their data (messages, shayaris, profile).
                          This action cannot be undone.
                        </p>
                        <DialogFooter>
                          <Button 
                            variant="destructive"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Permanently
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
