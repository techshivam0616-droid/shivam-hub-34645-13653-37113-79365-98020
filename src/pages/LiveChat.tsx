import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, doc, getDoc, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
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
  reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds
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
  const [mutualFollowers, setMutualFollowers] = useState<Set<string>>(new Set());
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
      
      setMessages(messageList.map(m => ({
        ...m,
        reactions: snapshot.docs.find(d => d.id === m.id)?.data().reactions || {}
      })));

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

    // Check mutual followers for current user
    const checkMutualFollowers = async () => {
      if (!user) return;
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          const myFollowing = profileDoc.data()?.following || [];
          const myFollowers = profileDoc.data()?.followers || [];
          const mutual = new Set<string>();
          
          for (const userId of myFollowing) {
            if (myFollowers.includes(userId)) {
              mutual.add(userId);
            }
          }
          setMutualFollowers(mutual);
        }
      } catch (error) {
        console.log('Error checking followers:', error);
      }
    };
    checkMutualFollowers();

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

    // Check if mutual follow
    if (!mutualFollowers.has(selectedUser.id)) {
      toast.error('You can only message users who follow you back!');
      return;
    }

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

  const reactions = ['❤️', '🔥', '⭐', '👍', '😂', '👏', '😍'];
  const [showReactions, setShowReactions] = useState<string | null>(null);

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const currentReactions = messageDoc.data().reactions || {};
        const emojiReactions = currentReactions[emoji] || [];
        
        if (emojiReactions.includes(user.uid)) {
          // Remove reaction
          const newReactions = {
            ...currentReactions,
            [emoji]: emojiReactions.filter((id: string) => id !== user.uid)
          };
          await updateDoc(messageRef, { reactions: newReactions });
        } else {
          // Add reaction
          const newReactions = {
            ...currentReactions,
            [emoji]: [...emojiReactions, user.uid]
          };
          await updateDoc(messageRef, { reactions: newReactions });
        }
      }
      setShowReactions(null);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col overflow-hidden">
      <div className="container mx-auto max-w-4xl flex flex-col h-full p-3">
        {/* Header - Compact */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 pb-2 border-b border-primary/20 shrink-0"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="hover:bg-primary/10 h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold flex items-center gap-2 gradient-text">
              <MessageCircle className="h-5 w-5 text-primary" />
              Live Chat
            </h1>
            <p className="text-xs text-muted-foreground">{messages.length} messages • {onlineUsers.length + 1} online</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUsers(true)}
            className="gap-1 border-primary/30 hover:bg-primary/10 h-8 text-xs"
          >
            <Users className="h-3 w-3" />
            Users
          </Button>
        </motion.div>

        {/* Messages - Takes remaining space */}
        <div className="flex-1 overflow-y-auto py-2 min-h-0" ref={scrollRef}>
          <div className="space-y-3">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <MessageCircle className="h-12 w-12 mx-auto text-primary/30 mb-3" />
                  <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                </motion.div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.userId === user?.uid;
                  const isVerified = verifiedUsers.has(message.userEmail);
                  const messageReactions = message.reactions || {};
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''} group relative`}
                    >
                      <Avatar className={`h-8 w-8 ring-2 shrink-0 ${isVerified ? 'ring-blue-500' : 'ring-border'}`}>
                        <AvatarFallback className={`text-xs ${isVerified ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' : ''}`}>
                          {message.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-xs font-semibold ${isVerified ? 'text-blue-500' : ''}`}>
                            {message.userName}
                          </span>
                          {isVerified && (
                            <img src={blueTick} alt="Verified" className="h-3 w-3 object-contain" />
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="relative">
                          <div
                            className={`rounded-2xl px-3 py-2 text-sm ${
                              isVerified
                                ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-blue-400/50'
                                : isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-muted rounded-bl-sm'
                            }`}
                          >
                            <p className="leading-relaxed break-words">{message.text}</p>
                          </div>
                          
                          {/* Reaction button */}
                          <button
                            onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                            className={`absolute -bottom-1 ${isOwn ? '-left-6' : '-right-6'} opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-full p-1 shadow-sm hover:bg-muted`}
                          >
                            <Heart className="h-3 w-3" />
                          </button>
                          
                          {/* Reaction picker */}
                          <AnimatePresence>
                            {showReactions === message.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                className={`absolute top-full mt-1 ${isOwn ? 'right-0' : 'left-0'} z-20 bg-card border border-border rounded-full px-2 py-1 shadow-lg flex gap-1`}
                              >
                                {reactions.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => toggleReaction(message.id, emoji)}
                                    className={`text-base hover:scale-125 transition-transform p-0.5 ${
                                      messageReactions[emoji]?.includes(user?.uid || '') ? 'bg-primary/20 rounded-full' : ''
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Show reactions */}
                        {Object.keys(messageReactions).length > 0 && (
                          <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? 'justify-end' : ''}`}>
                            {Object.entries(messageReactions).map(([emoji, users]) => {
                              if (!Array.isArray(users) || users.length === 0) return null;
                              return (
                                <motion.button
                                  key={emoji}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  onClick={() => toggleReaction(message.id, emoji)}
                                  className={`flex items-center gap-0.5 text-xs bg-muted/80 hover:bg-muted border border-border rounded-full px-1.5 py-0.5 ${
                                    users.includes(user?.uid || '') ? 'ring-1 ring-primary' : ''
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-muted-foreground">{users.length}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input - Fixed at bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 p-2 bg-card/80 backdrop-blur-sm rounded-xl border border-primary/20 shadow-lg shrink-0 mt-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border-primary/20 focus:border-primary bg-background/50 h-9 text-sm"
          />
          <Button 
            onClick={sendMessage} 
            size="sm" 
            className="bg-primary hover:bg-primary/90 rounded-lg h-9 w-9 p-0"
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
            <div className="p-4 border-t border-border">
              {mutualFollowers.has(selectedUser.id) ? (
                <div className="flex gap-2">
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
              ) : (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💬 Follow each other on Social to message!
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => navigate('/social')}
                    className="mt-1"
                  >
                    Go to Social →
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
