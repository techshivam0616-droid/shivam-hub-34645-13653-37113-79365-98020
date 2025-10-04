import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ref, push, onValue, serverTimestamp, onDisconnect, set, off } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: number;
}

interface OnlineUser {
  id: string;
  name: string;
  lastSeen: number;
}

export default function LiveChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to access live chat');
      navigate('/');
      return;
    }

    // Set up presence
    const userStatusRef = ref(realtimeDb, `presence/${user.uid}`);
    const presenceRef = ref(realtimeDb, 'presence');
    
    set(userStatusRef, {
      id: user.uid,
      name: user.displayName || 'User',
      lastSeen: serverTimestamp()
    });

    onDisconnect(userStatusRef).remove();

    // Listen to online users
    onValue(presenceRef, (snapshot) => {
      const data = snapshot.val();
      setOnlineUsers(data || {});
    });

    // Listen to messages
    const messagesRef = ref(realtimeDb, 'messages');
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([id, msg]: [string, any]) => ({
          id,
          ...msg
        }));
        setMessages(messageList.sort((a, b) => a.timestamp - b.timestamp));
      }
    });

    return () => {
      set(userStatusRef, null);
      off(messagesRef);
      off(presenceRef);
    };
  }, [user, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messagesRef = ref(realtimeDb, 'messages');
    await push(messagesRef, {
      text: newMessage,
      userId: user.uid,
      userName: user.displayName || 'User',
      timestamp: Date.now()
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Live Chat
              <span className="text-red-600">✅</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {Object.keys(onlineUsers).length} users online
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.userId === user?.uid;
              const isOnline = onlineUsers[message.userId];
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col ${isOwn ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {message.userName}
                      </span>
                      {isOnline && <span className="text-red-600 text-xs">✅</span>}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-md ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.text}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
