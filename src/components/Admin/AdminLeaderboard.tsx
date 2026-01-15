import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, getDocs, query, doc, setDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Medal, Award, Calendar, Download, MessageCircle, PenSquare, Search, Eye, X, Heart, Users, Bookmark, RotateCcw, Crown, History } from 'lucide-react';
import { KingBadge } from '@/components/ui/KingBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserStats {
  id: string;
  email: string;
  displayName: string;
  verified: boolean;
  downloadCount: number;
  messageCount: number;
  shayariCount: number;
  likeCount: number;
  followersCount: number;
  followingCount: number;
  savedCount: number;
  downloads: { title: string; date: string }[];
  messages: { text: string; date: string }[];
  shayaris: { text: string; date: string; likes: number }[];
  avatar?: string;
  badges?: string[];
}

interface WeeklyWinner {
  id: string;
  weekKey: string;
  userId: string;
  displayName: string;
  avatar?: string;
  rank: number;
  downloadCount: number;
  awardedAt: string;
}

export function AdminLeaderboard() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekEnd, setWeekEnd] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'downloads' | 'messages' | 'shayaris'>('downloads');
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [resetting, setResetting] = useState(false);
  const [pastWinners, setPastWinners] = useState<WeeklyWinner[]>([]);
  const [userBadges, setUserBadges] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    checkAndResetWeekly();
    fetchAllStats();
    fetchPastWinners();
    fetchUserBadges();
  }, []);

  const getWeekKey = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    return weekStart.toISOString().split('T')[0];
  };

  const getWeekEnd = () => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + (6 - now.getDay()));
    return weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const checkAndResetWeekly = async () => {
    try {
      const currentWeek = getWeekKey();
      const weekEndDate = getWeekEnd();
      setWeekEnd(weekEndDate);
      
      const leaderboardRef = doc(db, 'leaderboard_meta', 'current_week');
      const leaderboardDoc = await getDocs(query(collection(db, 'leaderboard_meta')));
      
      const metaDoc = leaderboardDoc.docs.find(d => d.id === 'current_week');
      if (!metaDoc || metaDoc.data()?.weekKey !== currentWeek) {
        await setDoc(leaderboardRef, {
          weekKey: currentWeek,
          startedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error checking weekly reset:', error);
    }
  };

  const fetchPastWinners = async () => {
    try {
      const winnersSnapshot = await getDocs(collection(db, 'weekly_winners'));
      const winners = winnersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeeklyWinner[];
      
      // Sort by date descending
      winners.sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
      setPastWinners(winners);
    } catch (error) {
      console.error('Error fetching past winners:', error);
    }
  };

  const fetchUserBadges = async () => {
    try {
      const badgesSnapshot = await getDocs(collection(db, 'user_badges'));
      const badges = new Map<string, string[]>();
      
      badgesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          const existing = badges.get(data.userId) || [];
          existing.push(data.badge);
          badges.set(data.userId, existing);
        }
      });
      
      setUserBadges(badges);
    } catch (error) {
      console.error('Error fetching user badges:', error);
    }
  };

  const awardBadgeToUser = async (userId: string, badge: string, displayName: string) => {
    try {
      await addDoc(collection(db, 'user_badges'), {
        userId,
        badge,
        displayName,
        awardedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  const resetWeeklyLeaderboard = async () => {
    setResetting(true);
    try {
      // Get top 3 users by downloads
      const top3 = [...users]
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 3);

      if (top3.length === 0) {
        toast.error('No users to award');
        setResetting(false);
        return;
      }

      const currentWeek = getWeekKey();
      const badges = ['🥇 Weekly Champion', '🥈 Weekly Runner-up', '🥉 Weekly Third'];

      // Award badges, blue tick, and save to weekly_winners
      for (let i = 0; i < top3.length; i++) {
        const user = top3[i];
        
        // Save to weekly_winners collection
        await addDoc(collection(db, 'weekly_winners'), {
          weekKey: currentWeek,
          userId: user.id,
          displayName: user.displayName,
          avatar: user.avatar || null,
          rank: i + 1,
          downloadCount: user.downloadCount,
          awardedAt: new Date().toISOString()
        });

        // Award badge to user
        await awardBadgeToUser(user.id, badges[i], user.displayName);
        
        // Grant temporary blue tick for 1 week
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        
        await setDoc(doc(db, 'verified_users', user.email), {
          email: user.email,
          verified: true,
          verifiedAt: new Date().toISOString(),
          expiresAt: expiryDate.toISOString(),
          reason: `Weekly ${i === 0 ? 'Champion' : i === 1 ? 'Runner-up' : 'Third Place'} Award`
        });
      }

      // Update leaderboard meta with new week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekKey = nextWeek.toISOString().split('T')[0];
      
      await setDoc(doc(db, 'leaderboard_meta', 'current_week'), {
        weekKey: nextWeekKey,
        startedAt: new Date().toISOString(),
        lastResetAt: new Date().toISOString()
      });

      toast.success(`Awarded badges to top 3 users: ${top3.map(u => u.displayName).join(', ')}`);
      
      // Refresh data
      fetchPastWinners();
      fetchUserBadges();
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      toast.error('Failed to reset leaderboard');
    } finally {
      setResetting(false);
    }
  };

  const getBadgeIcon = (badge: string) => {
    if (badge.includes('Champion')) return <Crown className="h-3 w-3 text-yellow-500" />;
    if (badge.includes('Runner-up')) return <Medal className="h-3 w-3 text-gray-400" />;
    if (badge.includes('Third')) return <Award className="h-3 w-3 text-orange-600" />;
    return <Trophy className="h-3 w-3 text-primary" />;
  };

  const fetchAllStats = async () => {
    try {
      // Fetch all collections in parallel
      const [downloadsSnapshot, messagesSnapshot, shayarisSnapshot, verifiedUsersSnapshot, profilesSnapshot, contentLikesSnapshot] = await Promise.all([
        getDocs(collection(db, 'downloads')),
        getDocs(collection(db, 'messages')),
        getDocs(collection(db, 'shayaris')),
        getDocs(collection(db, 'verified_users')),
        getDocs(collection(db, 'user_profiles')),
        getDocs(collection(db, 'content_likes'))
      ]);

      const downloads = downloadsSnapshot.docs.map(doc => doc.data());
      const messages = messagesSnapshot.docs.map(doc => doc.data());
      const shayaris = shayarisSnapshot.docs.map(doc => doc.data());
      
      const verifiedEmails = new Set(
        verifiedUsersSnapshot.docs
          .filter(doc => doc.data()?.verified === true)
          .map(doc => doc.id)
      );

      // Create profile lookup by userId AND by document id
      const profileByUserId = new Map();
      const profileByDocId = new Map();
      profilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        profileByDocId.set(doc.id, data);
        if (data.userId) {
          profileByUserId.set(data.userId, data);
        }
        // Also map by email if available
        if (data.email) {
          profileByUserId.set(data.email, data);
        }
      });

      // Create likes lookup per user
      const userLikes = new Map<string, number>();
      contentLikesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          userLikes.set(data.userId, (userLikes.get(data.userId) || 0) + 1);
        }
      });

      // Helper function to get best display name
      const getDisplayName = (userId: string, email: string, userName: string): string => {
        // Try profile by userId
        const profileByUser = profileByUserId.get(userId);
        if (profileByUser?.displayName) return profileByUser.displayName;
        
        // Try profile by docId (userId)
        const profileByDoc = profileByDocId.get(userId);
        if (profileByDoc?.displayName) return profileByDoc.displayName;
        
        // Try profile by email
        const profileByEmail = profileByUserId.get(email);
        if (profileByEmail?.displayName) return profileByEmail.displayName;
        
        // Use userName if provided
        if (userName && userName !== 'User') return userName;
        
        // Last resort: extract from email
        if (email) return email.split('@')[0];
        
        return 'User';
      };

      // Helper function to get avatar
      const getAvatar = (userId: string, email: string): string | undefined => {
        const profileByUser = profileByUserId.get(userId);
        if (profileByUser?.avatar) return profileByUser.avatar;
        
        const profileByDoc = profileByDocId.get(userId);
        if (profileByDoc?.avatar) return profileByDoc.avatar;
        
        const profileByEmail = profileByUserId.get(email);
        if (profileByEmail?.avatar) return profileByEmail.avatar;
        
        return undefined;
      };

      // Aggregate user stats
      const userMap = new Map<string, UserStats>();

      downloads.forEach((d: any) => {
        if (!d.userId) return;
        if (!userMap.has(d.userId)) {
          const displayName = getDisplayName(d.userId, d.userEmail || '', d.userName || '');
          const avatar = getAvatar(d.userId, d.userEmail || '');
          const profile = profileByUserId.get(d.userId) || profileByDocId.get(d.userId);
          
          userMap.set(d.userId, {
            id: d.userId,
            email: d.userEmail || '',
            displayName: displayName,
            verified: verifiedEmails.has(d.userEmail),
            downloadCount: 0,
            messageCount: 0,
            shayariCount: 0,
            likeCount: userLikes.get(d.userId) || 0,
            followersCount: profile?.followers?.length || 0,
            followingCount: profile?.following?.length || 0,
            savedCount: 0,
            downloads: [],
            messages: [],
            shayaris: [],
            avatar: avatar
          });
        }
        const user = userMap.get(d.userId)!;
        user.downloadCount++;
        user.downloads.push({
          title: d.contentTitle || 'Unknown',
          date: d.downloadedAt || ''
        });
      });

      messages.forEach((m: any) => {
        if (!m.userId) return;
        if (!userMap.has(m.userId)) {
          const displayName = getDisplayName(m.userId, m.userEmail || '', m.userName || '');
          const avatar = getAvatar(m.userId, m.userEmail || '');
          const profile = profileByUserId.get(m.userId) || profileByDocId.get(m.userId);
          
          userMap.set(m.userId, {
            id: m.userId,
            email: m.userEmail || '',
            displayName: displayName,
            verified: verifiedEmails.has(m.userEmail),
            downloadCount: 0,
            messageCount: 0,
            shayariCount: 0,
            likeCount: userLikes.get(m.userId) || 0,
            followersCount: profile?.followers?.length || 0,
            followingCount: profile?.following?.length || 0,
            savedCount: 0,
            downloads: [],
            messages: [],
            shayaris: [],
            avatar: avatar
          });
        }
        const user = userMap.get(m.userId)!;
        user.messageCount++;
        user.messages.push({
          text: m.text || m.message || '',
          date: m.timestamp || m.createdAt || ''
        });
      });

      shayaris.forEach((s: any) => {
        if (!s.userId) return;
        if (!userMap.has(s.userId)) {
          const displayName = getDisplayName(s.userId, s.userEmail || '', s.userName || '');
          const avatar = getAvatar(s.userId, s.userEmail || '');
          const profile = profileByUserId.get(s.userId) || profileByDocId.get(s.userId);
          
          userMap.set(s.userId, {
            id: s.userId,
            email: s.userEmail || '',
            displayName: displayName,
            verified: verifiedEmails.has(s.userEmail),
            downloadCount: 0,
            messageCount: 0,
            shayariCount: 0,
            likeCount: userLikes.get(s.userId) || 0,
            followersCount: profile?.followers?.length || 0,
            followingCount: profile?.following?.length || 0,
            savedCount: 0,
            downloads: [],
            messages: [],
            shayaris: [],
            avatar: avatar
          });
        }
        const user = userMap.get(s.userId)!;
        user.shayariCount++;
        user.savedCount += s.savedBy?.length || 0;
        user.shayaris.push({
          text: s.text || '',
          date: s.timestamp || s.createdAt || '',
          likes: s.likes?.length || 0
        });
      });

      setUsers(Array.from(userMap.values()));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-orange-600" />;
    return <span className="text-muted-foreground font-bold">#{index + 1}</span>;
  };

  const sortedUsers = [...users]
    .filter(u => 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'downloads') return b.downloadCount - a.downloadCount;
      if (sortBy === 'messages') return b.messageCount - a.messageCount;
      return b.shayariCount - a.shayariCount;
    })
    .slice(0, 20);

  const totalDownloads = users.reduce((sum, u) => sum + u.downloadCount, 0);
  const totalMessages = users.reduce((sum, u) => sum + u.messageCount, 0);
  const totalShayaris = users.reduce((sum, u) => sum + u.shayariCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                  <p className="text-3xl font-bold text-blue-500">{totalDownloads}</p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <Download className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                  <p className="text-3xl font-bold text-green-500">{totalMessages}</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-full">
                  <MessageCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Shayaris</p>
                  <p className="text-3xl font-bold text-purple-500">{totalShayaris}</p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-full">
                  <PenSquare className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Reset Control */}
      <Card className="border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-yellow-500" />
                Weekly Reset & Badges
              </CardTitle>
              <CardDescription>
                Award badges to top 3 users and reset the weekly leaderboard
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-black" disabled={resetting}>
                  {resetting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent mr-2" />
                  ) : (
                    <Crown className="h-4 w-4 mr-2" />
                  )}
                  Award Badges & Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Weekly Leaderboard?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will award badges to the current top 3 users:
                    <ul className="mt-2 space-y-1">
                      {users.sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 3).map((u, i) => (
                        <li key={u.id} className="flex items-center gap-2">
                          {i === 0 && '🥇'}
                          {i === 1 && '🥈'}
                          {i === 2 && '🥉'}
                          <span className="font-medium">{u.displayName}</span>
                          <span className="text-muted-foreground">({u.downloadCount} downloads)</span>
                        </li>
                      ))}
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetWeeklyLeaderboard} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    Confirm & Award
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
      </Card>

      {/* Past Winners */}
      {pastWinners.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Past Weekly Winners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {pastWinners.slice(0, 15).map((winner) => (
                  <div key={winner.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                      {winner.avatar ? (
                        <img src={winner.avatar} alt={winner.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {winner.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {winner.rank === 1 && <Crown className="h-4 w-4 text-yellow-500" />}
                        {winner.rank === 2 && <Medal className="h-4 w-4 text-gray-400" />}
                        {winner.rank === 3 && <Award className="h-4 w-4 text-orange-600" />}
                        <span className="font-medium text-sm">{winner.displayName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Week of {winner.weekKey} • {winner.downloadCount} downloads
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{winner.rank}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Detailed Leaderboard
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                Resets every Sunday (Ends: {weekEnd})
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downloads">Downloads</SelectItem>
                  <SelectItem value="messages">Messages</SelectItem>
                  <SelectItem value="shayaris">Shayaris</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="space-y-3">
              {sortedUsers.map((user, index) => {
                const isTop3 = index < 3;
                const badges = userBadges.get(user.id) || [];
                const bgClass = isTop3 
                  ? index === 0 
                    ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/50' 
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/50'
                    : 'bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/50'
                  : 'border-border hover:border-primary/50';

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 border-2 rounded-lg transition-all ${bgClass} ${isTop3 ? 'shadow-lg' : ''}`}
                  >
                    <div className="w-12 flex justify-center">
                      {getIcon(index)}
                    </div>
                    
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate text-foreground">{user.displayName}</p>
                        {user.verified && <KingBadge size="md" />}
                        {isTop3 && (
                          <Badge variant={index === 0 ? 'default' : 'secondary'} className="animate-pulse shrink-0">
                            TOP {index + 1}
                          </Badge>
                        )}
                        {/* User badges */}
                        {badges.slice(0, 3).map((badge, i) => (
                          <Badge key={i} variant="outline" className="text-xs flex items-center gap-1 shrink-0">
                            {getBadgeIcon(badge)}
                            <span className="hidden md:inline">{badge.replace(/🥇|🥈|🥉/g, '').trim()}</span>
                          </Badge>
                        ))}
                        {badges.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{badges.length - 3}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-blue-500">
                        <Download className="h-4 w-4" />
                        <span className="font-bold">{user.downloadCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-500">
                        <MessageCircle className="h-4 w-4" />
                        <span className="font-bold">{user.messageCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-500">
                        <PenSquare className="h-4 w-4" />
                        <span className="font-bold">{user.shayariCount}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Panel */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} alt={selectedUser.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                          {selectedUser.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="flex items-center gap-2">
                        {selectedUser.displayName}
                        {selectedUser.verified && <KingBadge size="lg" />}
                      </span>
                      <p className="text-sm text-muted-foreground font-normal">{selectedUser.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Download className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold">{selectedUser.downloadCount}</p>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <MessageCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-2xl font-bold">{selectedUser.messageCount}</p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <PenSquare className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-2xl font-bold">{selectedUser.shayariCount}</p>
                    <p className="text-xs text-muted-foreground">Shayaris</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                    <p className="text-2xl font-bold">{selectedUser.likeCount}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>

                {/* Social Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold">{selectedUser.followersCount}</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-secondary" />
                    <p className="text-xl font-bold">{selectedUser.followingCount}</p>
                    <p className="text-xs text-muted-foreground">Following</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Bookmark className="h-5 w-5 mx-auto mb-1 text-accent" />
                    <p className="text-xl font-bold">{selectedUser.savedCount}</p>
                    <p className="text-xs text-muted-foreground">Saves Received</p>
                  </div>
                </div>

                {/* Detailed Activity Tabs */}
                <Tabs defaultValue="downloads">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="downloads">Downloads</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                    <TabsTrigger value="shayaris">Shayaris</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="downloads" className="mt-4">
                    <ScrollArea className="h-60">
                      {selectedUser.downloads.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No downloads</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedUser.downloads.map((d, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                              <span className="text-sm font-medium">{d.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {d.date ? new Date(d.date).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="messages" className="mt-4">
                    <ScrollArea className="h-60">
                      {selectedUser.messages.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No messages</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedUser.messages.slice(0, 50).map((m, i) => (
                            <div key={i} className="p-2 bg-muted/30 rounded">
                              <p className="text-sm line-clamp-2">{m.text}</p>
                              <span className="text-xs text-muted-foreground">
                                {m.date ? new Date(m.date).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="shayaris" className="mt-4">
                    <ScrollArea className="h-60">
                      {selectedUser.shayaris.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No shayaris</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedUser.shayaris.map((s, i) => (
                            <div key={i} className="p-2 bg-muted/30 rounded">
                              <p className="text-sm line-clamp-2">{s.text}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Heart className="h-3 w-3" /> {s.likes}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {s.date ? new Date(s.date).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
