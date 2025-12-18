import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { MessageCircle, Trash2, Users, Search, RefreshCw } from 'lucide-react';
import blueTick from '@/assets/blue-tick.png';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: number;
  isPrivate: boolean;
}

interface OnlineUser {
  id: string;
  oderId: string;
  name: string;
  email: string;
  lastSeen: Date;
}

export function AdminLiveChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to messages
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'));
    const unsubMessages = onSnapshot(q, async (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail || '',
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
          isPrivate: data.isPrivate || false
        };
      });
      setMessages(msgs);

      // Check verified users
      const emails = [...new Set(msgs.map(m => m.userEmail).filter(Boolean))];
      const verified = new Set<string>();
      await Promise.all(emails.map(async (email) => {
        try {
          const verDoc = await getDoc(doc(db, 'verified_users', email));
          if (verDoc.exists() && verDoc.data()?.verified) verified.add(email);
        } catch (e) {}
      }));
      setVerifiedUsers(verified);
      setLoading(false);
    });

    // Listen to online users
    const presenceRef = collection(db, 'chat_presence');
    const unsubPresence = onSnapshot(presenceRef, (snapshot) => {
      const users: OnlineUser[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as OnlineUser[];
      setOnlineUsers(users);
    });

    return () => {
      unsubMessages();
      unsubPresence();
    };
  }, []);

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const clearAllMessages = async () => {
    if (!confirm('Are you sure you want to delete ALL messages?')) return;
    try {
      const snapshot = await getDocs(collection(db, 'messages'));
      await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
      toast.success('All messages cleared');
    } catch (error) {
      toast.error('Failed to clear messages');
    }
  };

  const clearPresence = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'chat_presence'));
      await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
      toast.success('Online users cleared');
    } catch (error) {
      toast.error('Failed to clear presence');
    }
  };

  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <MessageCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{onlineUsers.length}</p>
                <p className="text-sm text-muted-foreground">Online Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <MessageCircle className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{messages.filter(m => m.isPrivate).length}</p>
                <p className="text-sm text-muted-foreground">Private Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Live Chat Management</CardTitle>
          <CardDescription>Manage chat messages and users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={clearAllMessages}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Messages
            </Button>
            <Button variant="outline" onClick={clearPresence}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Online Users
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Online Users */}
      <Card>
        <CardHeader>
          <CardTitle>Online Users</CardTitle>
        </CardHeader>
        <CardContent>
          {onlineUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No users online</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {onlineUsers.map((user) => (
                <Badge key={user.id} variant="secondary" className="py-2 px-3">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  {user.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">No messages found</TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.slice(0, 100).map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{msg.userName}</span>
                          {verifiedUsers.has(msg.userEmail) && (
                            <img src={blueTick} alt="Verified" className="h-4 w-4" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{msg.userEmail}</p>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{msg.text}</TableCell>
                      <TableCell>
                        <Badge variant={msg.isPrivate ? 'secondary' : 'outline'}>
                          {msg.isPrivate ? 'Private' : 'Public'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(msg.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMessage(msg.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
