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
        <Card className="h-full group relative overflow-hidden bg-card border-2 border-border hover:border-primary/70 transition-all duration-500">
          <CardHeader className="relative z-10">
            <motion.div 
              className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center mb-6 relative overflow-hidden"
              whileHover={{ scale: 1.15, rotate: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className="h-10 w-10 text-white relative z-10 drop-shadow-2xl" />
            </motion.div>
            <CardTitle className="text-3xl text-foreground font-bold mb-2">{title}</CardTitle>
            <CardDescription className="text-base text-foreground/80 leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <Button 
              onClick={handleGetStarted} 
              className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 text-primary-foreground font-bold py-6 text-lg"
            >
              <span className="relative z-10">Get Started</span>
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
