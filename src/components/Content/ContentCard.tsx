import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Sparkles, RefreshCw, Crown, Lock, Share2, Heart } from 'lucide-react';
import { DownloadDialog } from './DownloadDialog';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useVerification } from '@/hooks/useVerification';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ContentCardProps {
  item: any;
  type: string;
  viewMode: 'grid' | 'list';
}

export function ContentCard({ item, type, viewMode }: ContentCardProps) {
  const { user } = useAuth();
  const { isVerified } = useVerification();
  const navigate = useNavigate();
  const [showDownload, setShowDownload] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);

  // Check like status on mount
  useState(() => {
    if (user && item.id) {
      const likeRef = doc(db, 'content_likes', `${user.uid}_${item.id}`);
      getDoc(likeRef).then((snap) => {
        if (snap.exists()) setLiked(true);
      });
    }
  });

  // Check if item is new (within 7 days)
  const isNew = item.createdAt && 
    (Date.now() - new Date(item.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  // Check if item is updated (within 7 days)
  const isUpdated = item.updatedAt && 
    (Date.now() - new Date(item.updatedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  const isPremium = item.isPremium === true;
  const canAccess = !isPremium || (user && isVerified);

  const handleCardClick = () => {
    navigate(`/item/${type}/${item.id || 'item'}`, { state: { item } });
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/item/${type}/${item.id || 'item'}`, { state: { item } });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/#/item/${type}/${item.id || 'item'}`;
    const shareData = {
      title: item.title || 'Check this out!',
      text: item.description || 'Amazing content from our site',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to like');
      return;
    }
    
    try {
      const likeRef = doc(db, 'content_likes', `${user.uid}_${item.id}`);
      if (liked) {
        await deleteDoc(likeRef);
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        toast.success('Like removed');
      } else {
        await setDoc(likeRef, {
          userId: user.uid,
          itemId: item.id,
          itemType: type,
          createdAt: new Date().toISOString()
        });
        setLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success('Liked!');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card 
          className={`group relative overflow-hidden border-2 hover:border-primary transition-all cursor-pointer ${viewMode === 'list' ? 'flex flex-row' : ''}`}
          onClick={handleCardClick}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {item.thumbnail && (
            <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'w-full'} overflow-hidden`}>
              <img
                src={item.thumbnail}
                alt={item.title}
                className={`w-full object-contain transition-transform duration-300 group-hover:scale-105 ${viewMode === 'list' ? 'h-full rounded-l-lg' : 'h-64 rounded-t-lg bg-card/30'}`}
              />
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-2">
                {isPremium && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg">
                    <Crown className="h-3 w-3 mr-1" />
                    PREMIUM
                  </Badge>
                )}
                {isNew && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-lg animate-pulse">
                    <Sparkles className="h-3 w-3 mr-1" />
                    NEW
                  </Badge>
                )}
                {isUpdated && !isNew && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    UPDATED
                  </Badge>
                )}
              </div>

              {/* Share & Like buttons on image */}
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className={`h-8 w-8 p-0 bg-background/80 backdrop-blur-sm ${liked ? 'text-red-500' : ''}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors flex-1">
                  {item.title || 'Untitled'}
                </CardTitle>
                {likeCount > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {likeCount}
                  </span>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {item.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {item.size && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary" />
                    Size: {item.size}
                  </p>
                )}
                {item.version && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                    Version: {item.version}
                  </p>
                )}
                <Button 
                  onClick={handleDownloadClick} 
                  className="w-full relative z-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-2"
                  variant={isPremium && !canAccess ? 'outline' : 'default'}
                >
                  {isPremium && !canAccess ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Premium Content
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      <DownloadDialog
        open={showDownload}
        onOpenChange={setShowDownload}
        item={item}
        type={type}
      />
    </>
  );
}
