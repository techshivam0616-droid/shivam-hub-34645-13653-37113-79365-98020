import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/Auth/AuthDialog';
import { Gamepad2, Puzzle, Package, Film, GraduationCap, FolderOpen, ArrowRight, LucideIcon } from 'lucide-react';

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
          delay: index * 0.1,
          type: "spring",
          stiffness: 120
        }}
        whileHover={{ y: -4 }}
        className="h-full"
      >
        <Card className="h-full group relative overflow-hidden border-glow bg-card hover:shadow-lg transition-all duration-300">
          <CardHeader className="relative z-10 pb-4">
            {/* Icon Container */}
            <motion.div 
              className="icon-premium h-16 w-16 mb-5"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon className="h-8 w-8 text-foreground" strokeWidth={1.5} />
            </motion.div>
            
            <CardTitle className="text-xl font-semibold text-foreground mb-2">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10 pt-2">
            <Button 
              onClick={handleGetStarted} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-5 text-sm transition-all duration-300 rounded-xl group/btn"
            >
              <span className="flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
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

// Export icon mapping for use in Index.tsx
export const sectionIcons = {
  Mods: Puzzle,
  Games: Gamepad2,
  Assets: FolderOpen,
  Bundles: Package,
  Movies: Film,
  Courses: GraduationCap
};
