import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Send, X, User } from 'lucide-react';
import { FaWhatsapp, FaTelegram, FaInstagram } from 'react-icons/fa';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { KingBadge } from '@/components/ui/KingBadge';
import { getAvatarById } from './avatars';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  timestamp: number;
}

interface UserProfile {
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
}

interface SocialChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SocialChat({ isOpen, onClose }: SocialChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Listen to social chat messages
    const q = query(
      collection(db, 'social_chat'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail || '',
          userAvatar: data.userAvatar,
          timestamp: data.timestamp?.toMillis?.() || Date.now()
        };
      }).reverse();

      setMessages(msgs);

      // Fetch verification status
      const uniqueEmails = [...new Set(msgs.map(m => m.userEmail).filter(Boolean))];
      const verified = new Set<string>();

      await Promise.all(
        uniqueEmails.map(async (email) => {
          try {
            const verDoc = await getDoc(doc(db, 'verified_users', email));
            if (verDoc.exists() && verDoc.data()?.verified) {
              verified.add(email);
            }
          } catch (e) {}
        })
      );

      setVerifiedUsers(verified);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const profileDoc = await getDoc(doc(db, 'user_profiles', user.uid));
      const userAvatar = profileDoc.exists() ? profileDoc.data()?.avatar : '';

      await addDoc(collection(db, 'social_chat'), {
        text: newMessage.trim(),
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userEmail: user.email || '',
        userAvatar,
        timestamp: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const viewUserProfile = async (userId: string, userEmail: string) => {
    setProfileLoading(true);
    try {
      const profileDoc = await getDoc(doc(db, 'user_profiles', userId));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        const isVerified = verifiedUsers.has(userEmail);
        setSelectedProfile({
          displayName: data.displayName || 'User',
          username: data.username || '',
          bio: data.bio || '',
          avatar: data.avatar || '',
          email: userEmail,
          whatsappNumber: data.hideWhatsapp ? '' : (data.whatsappNumber || ''),
          telegramUsername: data.hideTelegram ? '' : (data.telegramUsername || ''),
          instagramId: data.hideInstagram ? '' : (data.instagramId || ''),
          hideWhatsapp: data.hideWhatsapp || false,
          hideTelegram: data.hideTelegram || false,
          hideInstagram: data.hideInstagram || false,
          isVerified
        });
      } else {
        toast.error('Profile not found');
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  if (!isOpen) return null;

  const avatarData = selectedProfile?.avatar ? getAvatarById(selectedProfile.avatar) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed inset-0 z-50 bg-background flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold gradient-text">Social Chat</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwn = message.userId === user?.uid;
                const isVerified = verifiedUsers.has(message.userEmail);
                const msgAvatarData = message.userAvatar ? getAvatarById(message.userAvatar) : null;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <button
                      onClick={() => viewUserProfile(message.userId, message.userEmail)}
                      className="focus:outline-none"
                    >
                      <Avatar className={`h-8 w-8 flex-shrink-0 ring-2 ${isVerified ? 'ring-blue-500' : 'ring-border'} hover:ring-primary transition-all cursor-pointer`}>
                        {msgAvatarData ? (
                          <AvatarImage src={msgAvatarData.url} />
                        ) : (
                          <AvatarFallback className={isVerified ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs' : 'text-xs'}>
                            {message.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </button>
                    <div className={`flex flex-col ${isOwn ? 'items-end' : ''}`}>
                      <button 
                        onClick={() => viewUserProfile(message.userId, message.userEmail)}
                        className="flex items-center gap-1 mb-1 hover:underline cursor-pointer"
                      >
                        <span className="text-xs font-semibold">{message.userName}</span>
                        {isVerified && <KingBadge size="sm" />}
                      </button>
                      <Card className={`px-3 py-2 max-w-[70vw] ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm break-words">{message.text}</p>
                      </Card>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* User Profile Sheet */}
      <Sheet open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </SheetTitle>
          </SheetHeader>
          
          {profileLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            </div>
          ) : selectedProfile && (
            <div className="mt-6 space-y-6">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 ring-4 ring-primary">
                  {avatarData ? (
                    <AvatarImage src={avatarData.url} />
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
                </div>
              </div>

              {/* Contact Info */}
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
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AnimatePresence>
  );
}
