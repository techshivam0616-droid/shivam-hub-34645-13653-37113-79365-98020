import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowLeft, Crown, Lock, Sparkles, RefreshCw, CheckCircle, Share2, Heart } from 'lucide-react';
import { DownloadDialog } from '@/components/Content/DownloadDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useVerification } from '@/hooks/useVerification';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuthDialog } from '@/components/Auth/AuthDialog';

export default function ItemDetails() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isVerified } = useVerification();
  const { settings } = useWebsiteSettings();
  const [showDownload, setShowDownload] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [item, setItem] = useState<any>(location.state?.item || null);
  const [loading, setLoading] = useState(!location.state?.item);

  useEffect(() => {
    const fetchItem = async () => {
      // If item is passed via state, use it
      if (location.state?.item) {
        setItem(location.state.item);
        setLikeCount(location.state.item.likes || 0);
        setLoading(false);
        return;
      }

      // Otherwise, fetch from Firebase using type and id
      if (type && id) {
        try {
        const itemDoc = await getDoc(doc(db, type, id));
          if (itemDoc.exists()) {
            const data = itemDoc.data();
            const fetchedItem = { id: itemDoc.id, ...data };
            setItem(fetchedItem);
            setLikeCount(data.likes || 0);
          } else {
            toast.error('Item not found');
            navigate('/');
          }
        } catch (error) {
          console.error('Error fetching item:', error);
          toast.error('Failed to load item');
          navigate('/');
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/');
      }
    };

    fetchItem();
  }, [type, id, location.state, navigate]);

  // Check like status when user or item changes
  useEffect(() => {
    if (user && item?.id) {
      const likeRef = doc(db, 'content_likes', `${user.uid}_${item.id}`);
      getDoc(likeRef).then((snap) => {
        if (snap.exists()) setLiked(true);
      });
    }
  }, [user, item]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const isPremium = item.isPremium === true;
  const canAccess = !isPremium || (user && isVerified);

  const isNew = item.createdAt && 
    (Date.now() - new Date(item.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  const isUpdated = item.updatedAt && 
    (Date.now() - new Date(item.updatedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  const handleDownloadClick = () => {
    // Check if user is logged in first
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (isPremium && !isVerified) {
      navigate('/buy-bluetick');
      return;
    }
    setShowDownload(true);
  };

  const handleShare = async () => {
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

  const handleLike = async () => {
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

  const offerItems = settings.whatWeOffer?.split('|') || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Item Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-2">
            {item.thumbnail && (
              <div className="relative w-full bg-muted">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-64 md:h-80 object-contain"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  {isPremium && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg">
                      <Crown className="h-3 w-3 mr-1" />
                      PREMIUM
                    </Badge>
                  )}
                  {isNew && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-lg">
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

                {/* Share & Like buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-background/80 backdrop-blur-sm"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className={`bg-background/80 backdrop-blur-sm ${liked ? 'text-red-500' : ''}`}
                    onClick={handleLike}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                    {likeCount}
                  </Button>
                </div>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">{item.title || 'Untitled'}</CardTitle>
              <CardDescription className="text-base mt-2">
                {item.description || 'No description available'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Item Info */}
              <div className="grid grid-cols-2 gap-4">
                {item.size && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-medium">{item.size}</p>
                  </div>
                )}
                {item.version && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="font-medium">{item.version}</p>
                  </div>
                )}
                {item.downloads && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Downloads</p>
                    <p className="font-medium">{item.downloads}</p>
                  </div>
                )}
                {item.category && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{item.category}</p>
                  </div>
                )}
              </div>

              {/* Download Button */}
              <Button 
                onClick={handleDownloadClick} 
                className="w-full py-6 text-lg"
                size="lg"
                variant={isPremium && !canAccess ? 'outline' : 'default'}
              >
                {isPremium && !canAccess ? (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Unlock Premium Content
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Download Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* About Us & What We Offer Section */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* About Us */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">About Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {settings.aboutUs}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* What We Offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">What We Offer</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {offerItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      {item.trim()}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <DownloadDialog
        open={showDownload}
        onOpenChange={setShowDownload}
        item={item}
        type={type || 'item'}
      />

      <AuthDialog 
        open={showAuth} 
        onOpenChange={(isOpen) => {
          setShowAuth(isOpen);
          if (!isOpen && user) {
            // After login, open download dialog
            setTimeout(() => setShowDownload(true), 300);
          }
        }} 
      />
    </div>
  );
}