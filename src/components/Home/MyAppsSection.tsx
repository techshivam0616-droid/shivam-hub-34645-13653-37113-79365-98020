import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Smartphone, Gamepad2, Play, ShoppingCart, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface MyApp {
  id: string;
  name: string;
  description: string;
  developerName: string;
  logoUrl: string;
  htmlCode: string;
  type: 'app' | 'game';
  buyContact: string;
  buyContactLink: string;
}

export function MyAppsSection() {
  const [apps, setApps] = useState<MyApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<MyApp | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'myApps'), (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MyApp[];
      setApps(appsData);
    });
    return () => unsubscribe();
  }, []);

  if (apps.length === 0) return null;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Cartoon Graphics Decorations */}
        <div className="absolute -top-4 -left-4 w-20 h-20 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <circle cx="50" cy="50" r="40" fill="currentColor" />
            <circle cx="35" cy="40" r="8" fill="white" />
            <circle cx="65" cy="40" r="8" fill="white" />
            <path d="M 30 65 Q 50 80 70 65" stroke="white" strokeWidth="4" fill="none" />
          </svg>
        </div>
        <div className="absolute -top-2 -right-2 w-16 h-16 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full text-secondary">
            <polygon points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40" fill="currentColor" />
          </svg>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text flex items-center justify-center gap-3">
            <Smartphone className="h-8 w-8" />
            My Apps & Games
            <Gamepad2 className="h-8 w-8" />
          </h2>
          <p className="text-muted-foreground mt-2">Play games and use apps directly!</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {apps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1 group cursor-pointer border-primary/20"
                onClick={() => { setSelectedApp(app); setShowPlayer(true); }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center space-y-3">
                    {app.logoUrl ? (
                      <img 
                        src={app.logoUrl} 
                        alt={app.name} 
                        className="w-16 h-16 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        {app.type === 'game' ? (
                          <Gamepad2 className="h-8 w-8 text-primary-foreground" />
                        ) : (
                          <Smartphone className="h-8 w-8 text-primary-foreground" />
                        )}
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1">{app.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{app.description}</p>
                      <p className="text-xs text-primary mt-1">By {app.developerName}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${app.type === 'game' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {app.type === 'game' ? 'Game' : 'App'}
                      </span>
                    </div>
                    
                    <Button size="sm" className="w-full group-hover:bg-primary">
                      <Play className="h-4 w-4 mr-1" />
                      {app.type === 'game' ? 'Play Now' : 'Open'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* App Player Dialog */}
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedApp?.logoUrl && (
                <img src={selectedApp.logoUrl} alt="" className="w-8 h-8 rounded-lg" />
              )}
              {selectedApp?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* HTML Content */}
            <div 
              className="w-full min-h-[400px] rounded-lg overflow-hidden bg-background"
              dangerouslySetInnerHTML={{ __html: selectedApp?.htmlCode || '' }}
            />
            
            {/* Buy Section */}
            {(selectedApp?.buyContact || selectedApp?.buyContactLink) && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Want to buy this {selectedApp?.type}?</p>
                    {selectedApp?.buyContact && (
                      <p className="font-semibold">{selectedApp.buyContact}</p>
                    )}
                  </div>
                  {selectedApp?.buyContactLink && (
                    <Button asChild>
                      <a href={selectedApp.buyContactLink} target="_blank" rel="noopener noreferrer">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Now
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}