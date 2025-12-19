import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { PenSquare, Trash2, Search, Heart, MessageCircle, User } from 'lucide-react';
import blueTick from '@/assets/blue-tick.png';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Shayari {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: number;
  likesCount: number;
  commentsCount: number;
}

export function AdminShayaris() {
  const [shayaris, setShayaris] = useState<Shayari[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchShayaris();
  }, []);

  const fetchShayaris = async () => {
    try {
      const shayarisSnapshot = await getDocs(query(collection(db, 'shayaris'), orderBy('timestamp', 'desc')));
      const verifiedSnapshot = await getDocs(collection(db, 'verified_users'));
      
      const verified = new Set(
        verifiedSnapshot.docs
          .filter(d => d.data()?.verified)
          .map(d => d.id)
      );
      setVerifiedUsers(verified);

      const posts: Shayari[] = shayarisSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text || '',
          userId: data.userId || '',
          userName: data.userName || 'User',
          userEmail: data.userEmail || '',
          timestamp: data.timestamp?.toMillis?.() || Date.now(),
          likesCount: data.likes?.length || 0,
          commentsCount: data.comments?.length || 0
        };
      });

      setShayaris(posts);
    } catch (error) {
      console.error('Error fetching shayaris:', error);
      toast.error('Failed to load shayaris');
    } finally {
      setLoading(false);
    }
  };

  const deleteShayari = async (shayariId: string) => {
    try {
      await deleteDoc(doc(db, 'shayaris', shayariId));
      setShayaris(shayaris.filter(s => s.id !== shayariId));
      toast.success('Shayari deleted');
    } catch (error) {
      toast.error('Failed to delete shayari');
    }
  };

  const deleteAllShayaris = async () => {
    try {
      for (const shayari of shayaris) {
        await deleteDoc(doc(db, 'shayaris', shayari.id));
      }
      setShayaris([]);
      toast.success('All shayaris deleted');
    } catch (error) {
      toast.error('Failed to delete shayaris');
    }
  };

  const filteredShayaris = shayaris.filter(s => 
    s.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Shayaris</p>
                <p className="text-3xl font-bold text-purple-500">{shayaris.length}</p>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-full">
                <PenSquare className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Likes</p>
                <p className="text-3xl font-bold text-red-500">
                  {shayaris.reduce((sum, s) => sum + s.likesCount, 0)}
                </p>
              </div>
              <div className="bg-red-500/20 p-3 rounded-full">
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                <p className="text-3xl font-bold text-blue-500">
                  {shayaris.reduce((sum, s) => sum + s.commentsCount, 0)}
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full">
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shayaris List */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PenSquare className="h-5 w-5 text-primary" />
                Shayari Management
              </CardTitle>
              <CardDescription>View and manage all shayaris/posts</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete all shayaris?</DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground">
                    This will permanently delete all {shayaris.length} shayaris. This action cannot be undone.
                  </p>
                  <DialogFooter>
                    <Button variant="destructive" onClick={deleteAllShayaris}>
                      Delete All
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            </div>
          ) : filteredShayaris.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shayaris found
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredShayaris.map((shayari, index) => {
                  const isVerified = verifiedUsers.has(shayari.userEmail);
                  
                  return (
                    <motion.div
                      key={shayari.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 border rounded-lg hover:border-primary/30 transition-all"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">{shayari.userName}</span>
                            {isVerified && (
                              <img src={blueTick} alt="Verified" className="h-3.5 w-3.5" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(shayari.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap line-clamp-3">{shayari.text}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" /> {shayari.likesCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> {shayari.commentsCount}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteShayari(shayari.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
