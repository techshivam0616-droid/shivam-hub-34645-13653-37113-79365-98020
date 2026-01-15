import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Medal, Award, Download, Crown } from 'lucide-react';
import { KingBadge } from '@/components/ui/KingBadge';
import { motion } from 'framer-motion';

interface LeaderboardUser {
  id: string;
  displayName: string;
  downloadCount: number;
  verified: boolean;
  avatar?: string;
  badges?: string[];
}

export function UserLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const [downloadsSnapshot, verifiedUsersSnapshot, profilesSnapshot, badgesSnapshot] = await Promise.all([
        getDocs(collection(db, 'downloads')),
        getDocs(collection(db, 'verified_users')),
        getDocs(collection(db, 'user_profiles')),
        getDocs(collection(db, 'user_badges'))
      ]);

      // Build verified users map by email AND check expiry
      const now = new Date();
      const verifiedEmails = new Set<string>();
      verifiedUsersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data?.verified === true) {
          // Check if expiry exists and hasn't passed
          if (data.expiresAt) {
            const expiryDate = new Date(data.expiresAt);
            if (expiryDate > now) {
              verifiedEmails.add(doc.id);
            }
          } else {
            // No expiry means permanent verification
            verifiedEmails.add(doc.id);
          }
        }
      });

      // Build profile map by both document id AND userId field
      const profileMap = new Map();
      const profileByDocId = new Map();
      profilesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        profileByDocId.set(doc.id, data);
        if (data.userId) {
          profileMap.set(data.userId, data);
        }
      });

      // Build badges map
      const badgesMap = new Map<string, string[]>();
      badgesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          const existing = badgesMap.get(data.userId) || [];
          existing.push(data.badge);
          badgesMap.set(data.userId, existing);
        }
      });

      const userMap = new Map<string, LeaderboardUser>();

      downloadsSnapshot.docs.forEach((doc) => {
        const d = doc.data();
        if (!d.userId) return;
        
        if (!userMap.has(d.userId)) {
          // Try to find profile by userId first, then by document id
          const profile = profileMap.get(d.userId) || profileByDocId.get(d.userId);
          const displayName = profile?.displayName || d.userName || d.userEmail?.split('@')[0] || 'User';
          
          userMap.set(d.userId, {
            id: d.userId,
            displayName: displayName,
            downloadCount: 0,
            verified: verifiedEmails.has(d.userEmail),
            avatar: profile?.avatar,
            badges: badgesMap.get(d.userId) || []
          });
        }
        userMap.get(d.userId)!.downloadCount++;
      });

      const sorted = Array.from(userMap.values())
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 10);

      setUsers(sorted);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-orange-600" />;
    return <span className="text-muted-foreground font-bold text-sm">#{index + 1}</span>;
  };

  const getBadgeIcon = (badge: string) => {
    if (badge.includes('Champion')) return <Crown className="h-3 w-3 text-yellow-500" />;
    if (badge.includes('Runner-up')) return <Medal className="h-3 w-3 text-gray-400" />;
    if (badge.includes('Third')) return <Award className="h-3 w-3 text-orange-600" />;
    return <Trophy className="h-3 w-3 text-primary" />;
  };

  if (loading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="border-2 border-primary/20 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Top Users
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all hover:bg-muted/50 ${
                  index < 3 ? 'bg-gradient-to-r from-primary/5 to-transparent' : ''
                }`}
              >
                <div className="w-8 flex justify-center">
                  {getIcon(index)}
                </div>
                
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm truncate">{user.displayName}</span>
                    {user.verified && <KingBadge size="sm" />}
                    {/* Show badges */}
                    {user.badges && user.badges.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 flex items-center gap-1 px-1.5">
                        {getBadgeIcon(user.badges[0])}
                        <span className="hidden sm:inline">{user.badges.length}x</span>
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">{user.downloadCount}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}