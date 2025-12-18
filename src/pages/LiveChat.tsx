import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, getDoc, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, MessageCircle, Users, Sparkles, Heart, Star, Flame, X } from 'lucide-react';
import { toast } from 'sonner';
import blueTick from '@/assets/blue-tick.png';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: number;
  isPrivate?: boolean;
  recipientId?: string;
  recipientName?: string;
}

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

export default function LiveChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);
  const [privateNewMessage, setPrivateNewMessage] = useState('');

  useEffect(() => {
    if (!user) {
      toast.error('Please login to access live chat');
      navigate('/');
      return;
    }

    // Update user presence
    const updatePresence = async () => {
      try {
        // Check if user document exists
        const presenceRef = collection(db, 'chat_presence');
        const q = query(presenceRef, where('oderId', '==', user.uid));
        const existing = await getDocs(q);
        
        if (existing.empty) {
          await addDoc(presenceRef, {
            oderId: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            lastSeen: serverTimestamp()
          });
        }
      } catch (error) {
        console.log('Presence update error:', error);
      }
    };
    updatePresence();

    // Listen to messages from Firestore
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messageList: Message[] = snapshot.docs
        .map((doc) => {
          const data: any = doc.data();
          return {
            id: doc.id,
            text: data.text,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail || '',
            timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp || Date.now(),
            isPrivate: data.isPrivate || false,
            recipientId: data.recipientId,
            recipientName: data.recipientName
          };
        })
        .filter(m => !m.isPrivate); // Only show public messages
      
      setMessages(messageList);

      // Check verification status for all unique users
      const uniqueEmails = [...new Set(messageList.map(m => m.userEmail).filter(Boolean))];
      const verified = new Set<string>();
      
      await Promise.all(
        uniqueEmails.map(async (email) => {
          try {
            const verificationDoc = await getDoc(doc(db, 'verified_users', email));
            if (verificationDoc.exists() && verificationDoc.data()?.verified === true) {
              verified.add(email);
            }
          } catch (error) {
            console.error('Error checking verification:', error);
          }
        })
      );
      
      setVerifiedUsers(verified);
    }, (error) => {
      console.error('Error listening to messages:', error);
      toast.error('Failed to load messages.');
    });

    // Listen to online users
    const presenceQuery = query(collection(db, 'chat_presence'));
    const unsubPresence = onSnapshot(presenceQuery, async (snapshot) => {
      const users: OnlineUser[] = [];
      const verified = new Set<string>();
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // Check if verified
        try {
          const verDoc = await getDoc(doc(db, 'verified_users', data.email));
          if (verDoc.exists() && verDoc.data()?.verified === true) {
            verified.add(data.email);
          }
        } catch (e) {}
        
        users.push({
          id: data.oderId,
          name: data.name,
          email: data.email,
          isVerified: verified.has(data.email)
        });
      }
      setOnlineUsers(users.filter(u => u.id !== user.uid));
    });

    return () => {
      unsubscribe();
      unsubPresence();
    };
  }, [user, navigate]);

  // Listen to private messages when a user is selected
  useEffect(() => {
    if (!selectedUser || !user) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(d => {
          const data: any = d.data();
          return {
            id: d.id,
            text: data.text,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail || '',
            timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp || Date.now(),
            isPrivate: data.isPrivate || false,
            recipientId: data.recipientId,
            recipientName: data.recipientName
          };
        })
        .filter(m => m.isPrivate && (
          (m.userId === user.uid && m.recipientId === selectedUser.id) ||
          (m.userId === selectedUser.id && m.recipientId === user.uid)
        ));
      setPrivateMessages(msgs);
    });

    return () => unsub();
  }, [selectedUser, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userEmail: user.email || '',
        timestamp: serverTimestamp(),
        isPrivate: false
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message.');
    }
  };

  const sendPrivateMessage = async () => {
    if (!privateNewMessage.trim() || !user || !selectedUser) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: privateNewMessage,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userEmail: user.email || '',
        timestamp: serverTimestamp(),
        isPrivate: true,
        recipientId: selectedUser.id,
        recipientName: selectedUser.name
      });

      setPrivateNewMessage('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending private message:', error);
      toast.error('Failed to send message.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reactions = ['❤️', '🔥', '⭐', '👍', '😂'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col p-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-4 pb-4 border-b border-primary/20"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2 gradient-text">
              <MessageCircle className="h-6 w-6 text-primary" />
              Live Chat
              <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            </h1>
            <p className="text-sm text-muted-foreground">{messages.length} messages • {onlineUsers.length + 1} online</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUsers(true)}
            className="gap-2 border-primary/30 hover:bg-primary/10"
          >
            <Users className="h-4 w-4" />
            Users
          </Button>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-2 mb-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <MessageCircle className="h-16 w-16 mx-auto text-primary/30 mb-4" />
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </motion.div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.userId === user?.uid;
                  const isVerified = verifiedUsers.has(message.userEmail);
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className={`h-10 w-10 ring-2 ${isVerified ? 'ring-blue-500' : 'ring-border'}`}>
                        <AvatarFallback className={isVerified ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' : ''}>
                          {message.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold ${isVerified ? 'text-blue-500' : ''}`}>
                            {message.userName}
                          </span>
                          {isVerified && (
                            <img src={blueTick} alt="Verified" className="h-4 w-4 object-contain" />
                          )}
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isVerified
                              ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-2 border-blue-400/50 shadow-lg shadow-blue-500/20'
                              : isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.text}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 p-4 bg-card/50 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-lg"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border-primary/20 focus:border-primary bg-background/50"
          />
          <Button 
            onClick={sendMessage} 
            size="icon" 
            className="bg-primary hover:bg-primary/90 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Online Users Sheet */}
      <Sheet open={showUsers} onOpenChange={setShowUsers}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Online Users ({onlineUsers.length + 1})
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            <div className="space-y-2">
              {/* Current user */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {(user?.displayName || user?.email)?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      {user?.displayName || user?.email?.split('@')[0]}
                      <span className="text-xs text-muted-foreground">(You)</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {onlineUsers.map((u) => (
                <motion.div
                  key={u.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-lg bg-card hover:bg-muted cursor-pointer border border-border"
                  onClick={() => {
                    setSelectedUser(u);
                    setShowUsers(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className={`h-10 w-10 ring-2 ${u.isVerified ? 'ring-blue-500' : 'ring-green-500'}`}>
                      <AvatarFallback className={u.isVerified ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' : ''}>
                        {u.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold flex items-center gap-2">
                        {u.name}
                        {u.isVerified && <img src={blueTick} alt="Verified" className="h-4 w-4" />}
                      </p>
                      <p className="text-xs text-green-500">● Online</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Private Chat Dialog */}
      {selectedUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-card rounded-2xl border-2 border-primary/30 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/50">
              <Avatar className={`h-10 w-10 ring-2 ${selectedUser.isVerified ? 'ring-blue-500' : 'ring-border'}`}>
                <AvatarFallback>{selectedUser.name[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold flex items-center gap-2">
                  {selectedUser.name}
                  {selectedUser.isVerified && <img src={blueTick} alt="Verified" className="h-4 w-4" />}
                </p>
                <p className="text-xs text-green-500">● Online</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setSelectedUser(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="h-80 p-4">
              <div className="space-y-3">
                {privateMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Start a conversation with {selectedUser.name}
                  </p>
                ) : (
                  privateMessages.map((msg) => {
                    const isOwn = msg.userId === user?.uid;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border flex gap-2">
              <Input
                value={privateNewMessage}
                onChange={(e) => setPrivateNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') sendPrivateMessage();
                }}
                placeholder={`Message ${selectedUser.name}...`}
                className="flex-1"
              />
              <Button onClick={sendPrivateMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
