import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Layout/Header';
import { SocialFeed } from '@/components/Social/SocialFeed';
import { UserProfilesBox } from '@/components/Social/UserProfilesBox';
import { ProfileEditor } from '@/components/Social/ProfileEditor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Home, User, Compass, PenSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Social() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-muted-foreground">You need to be logged in to access the social feed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Social</h1>
            <p className="text-sm text-muted-foreground">Share shayaris, connect with people</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full grid grid-cols-3 bg-muted/50">
                <TabsTrigger value="feed" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Feed</span>
                </TabsTrigger>
                <TabsTrigger value="explore" className="gap-2">
                  <Compass className="h-4 w-4" />
                  <span className="hidden sm:inline">Explore</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-4">
                <SocialFeed />
              </TabsContent>

              <TabsContent value="explore" className="space-y-4">
                <div className="lg:hidden">
                  <UserProfilesBox />
                </div>
                <SocialFeed />
              </TabsContent>

              <TabsContent value="profile">
                <ProfileEditor />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-4">
            <UserProfilesBox />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 lg:hidden z-40">
        <div className="flex justify-around">
          <Button
            variant={activeTab === 'feed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('feed')}
            className="flex-col h-auto py-2"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Feed</span>
          </Button>
          <Button
            variant={activeTab === 'explore' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('explore')}
            className="flex-col h-auto py-2"
          >
            <Compass className="h-5 w-5" />
            <span className="text-xs">Explore</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/live-chat')}
            className="flex-col h-auto py-2"
          >
            <PenSquare className="h-5 w-5" />
            <span className="text-xs">Chat</span>
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            className="flex-col h-auto py-2"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
