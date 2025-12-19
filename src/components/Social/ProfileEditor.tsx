import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { maleAvatars, femaleAvatars, getAvatarById } from './avatars';

interface ProfileData {
  displayName: string;
  bio: string;
  avatar: string;
}

export function ProfileEditor() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    bio: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'male' | 'female'>('male');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const profileDoc = await getDoc(doc(db, 'user_profiles', user.uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setProfile({
          displayName: data.displayName || user.displayName || '',
          bio: data.bio || '',
          avatar: data.avatar || ''
        });
      } else {
        setProfile({
          displayName: user.displayName || user.email?.split('@')[0] || '',
          bio: '',
          avatar: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await setDoc(doc(db, 'user_profiles', user.uid), {
        displayName: profile.displayName,
        bio: profile.bio,
        avatar: profile.avatar,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast.success('Profile saved! ✨');
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const avatars = selectedCategory === 'male' ? maleAvatars : femaleAvatars;

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Please login to edit your profile</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
      </Card>
    );
  }

  const selectedAvatarData = profile.avatar ? getAvatarById(profile.avatar) : null;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Edit Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Avatar */}
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24 ring-4 ring-primary">
            {selectedAvatarData ? (
              <AvatarImage src={selectedAvatarData.url} />
            ) : (
              <AvatarFallback className="text-2xl bg-primary/20">
                {profile.displayName.charAt(0) || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <p className="text-sm text-muted-foreground">
            {selectedAvatarData?.name || 'No avatar selected'}
          </p>
        </div>

        {/* Avatar Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Choose Avatar
          </Label>
          
          {/* Category Tabs */}
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'male' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('male')}
            >
              👨 Boys
            </Button>
            <Button
              variant={selectedCategory === 'female' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('female')}
            >
              👩 Girls
            </Button>
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-4 gap-3">
            {avatars.map((avatar) => (
              <motion.button
                key={avatar.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfile({ ...profile, avatar: avatar.id })}
                className={`relative rounded-full overflow-hidden ${
                  profile.avatar === avatar.id 
                    ? 'ring-4 ring-primary shadow-lg' 
                    : 'ring-2 ring-border hover:ring-primary/50'
                }`}
              >
                <img 
                  src={avatar.url} 
                  alt={avatar.name}
                  className="w-full h-full aspect-square object-cover"
                />
                {profile.avatar === avatar.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <span className="text-xl">✓</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Name Input */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={profile.displayName}
            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
            placeholder="Enter your name"
          />
        </div>

        {/* Bio Input */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell us about yourself..."
            rows={3}
          />
        </div>

        {/* Save Button */}
        <Button 
          onClick={saveProfile} 
          disabled={saving}
          className="w-full gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  );
}
