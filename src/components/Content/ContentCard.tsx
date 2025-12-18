import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Sparkles, RefreshCw, Crown, Lock } from 'lucide-react';
import { DownloadDialog } from './DownloadDialog';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useVerification } from '@/hooks/useVerification';
import { useNavigate } from 'react-router-dom';

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

  // Check if item is new (within 7 days)
  const isNew = item.createdAt && 
    (Date.now() - new Date(item.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  // Check if item is updated (within 7 days)
  const isUpdated = item.updatedAt && 
    (Date.now() - new Date(item.updatedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  const isPremium = item.isPremium === true;
  const canAccess = !isPremium || (user && isVerified);

  const handleDownloadClick = () => {
    if (isPremium && !isVerified) {
      // Redirect to blue tick purchase page
      navigate('/buy-bluetick');
      return;
    }
    setShowDownload(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`group relative overflow-hidden border-2 hover:border-primary transition-all ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
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
            </div>
          )}
          
          <div className="flex-1">
            <CardHeader>
              <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                {item.title || 'Untitled'}
              </CardTitle>
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
