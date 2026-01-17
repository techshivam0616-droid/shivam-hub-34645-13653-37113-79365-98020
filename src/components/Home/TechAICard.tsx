import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

export function TechAICard() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="cursor-pointer overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5"
        onClick={() => navigate('/tech-ai')}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center relative">
                <Sparkles className="h-7 w-7 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 blur-xl opacity-50" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  Tech AI
                </h3>
                <p className="text-sm text-muted-foreground">
                  Image Gen • Code Gen • Research • More
                </p>
              </div>
            </div>
            <motion.div
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              className="text-primary"
            >
              <ArrowRight className="h-6 w-6" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
