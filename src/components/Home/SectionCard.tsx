import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/Auth/AuthDialog';

interface SectionCardProps {
  iconImage: string;
  title: string;
  description: string;
  path: string;
  index: number;
  external?: boolean;
}

export function SectionCard({ iconImage, title, description, path, index, external }: SectionCardProps) {
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
          delay: index * 0.12,
          type: "spring",
          stiffness: 120
        }}
        whileHover={{ y: -8, scale: 1.02 }}
        className="h-full"
      >
        <Card className="h-full group relative overflow-hidden glass-card border-glow">
          {/* Animated gradient background */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 blur-xl" />
          </div>
          
          {/* Icon glow effect */}
          <div className="absolute top-6 left-6 w-28 h-28 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <CardHeader className="relative z-10 pb-4">
            <motion.div 
              className="relative h-20 w-20 rounded-2xl overflow-hidden mb-5 shadow-lg ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all duration-300"
              whileHover={{ scale: 1.1, rotate: 3 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent z-10" />
              <img 
                src={iconImage} 
                alt={title} 
                className="w-full h-full object-cover"
              />
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transitionDuration: '700ms' }} />
            </motion.div>
            <CardTitle className="text-2xl gradient-text font-bold mb-2">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 pt-2">
            <Button 
              onClick={handleGetStarted} 
              className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-300 text-primary-foreground font-bold py-5 text-base shadow-lg hover:shadow-xl btn-glow rounded-xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
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
