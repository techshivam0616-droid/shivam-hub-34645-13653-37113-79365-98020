import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/Auth/AuthDialog';

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  index: number;
  external?: boolean;
}

export function SectionCard({ icon: Icon, title, description, path, index, external }: SectionCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleGetStarted = () => {
    if (external) {
      window.open(path, '_blank');
      return;
    }
    if (!user) {
      setShowAuth(true);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: index * 0.15,
          type: "spring",
          stiffness: 100
        }}
        whileHover={{ y: -12, scale: 1.02 }}
        className="h-full"
      >
        <Card className="h-full group relative overflow-hidden glass-effect border-2 border-border hover:border-primary/70 transition-all duration-500 neon-border">
          {/* Animated gradient background */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 animate-pulse" />
          </div>
          
          {/* Glowing orbs */}
          <motion.div 
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/30 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div 
            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-secondary/30 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          <CardHeader className="relative z-10">
            <motion.div 
              className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center mb-6 neon-border relative overflow-hidden"
              whileHover={{ scale: 1.15, rotate: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-secondary/50 animate-pulse" />
              <Icon className="h-10 w-10 text-white relative z-10 drop-shadow-2xl" />
            </motion.div>
            <CardTitle className="text-3xl gradient-text font-bold mb-2">{title}</CardTitle>
            <CardDescription className="text-base text-muted-foreground leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <Button 
              onClick={handleGetStarted} 
              className="w-full bg-gradient-to-r from-primary via-accent to-secondary hover:shadow-neon transition-all duration-300 text-white font-bold py-6 text-lg group-hover:scale-105 relative overflow-hidden"
            >
              <span className="relative z-10">Get Started</span>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-secondary via-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{ 
                  x: ['-100%', '100%']
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
      
      <AuthDialog 
        open={showAuth} 
        onOpenChange={(open) => {
          setShowAuth(open);
          if (!open && user) {
            navigate(path);
          }
        }} 
      />
    </>
  );
}
