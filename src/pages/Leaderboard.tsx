import { Header } from '@/components/Layout/Header';
import { UserLeaderboard } from '@/components/Home/UserLeaderboard';
import { motion } from 'framer-motion';

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-lg mx-auto"
        >
          <UserLeaderboard />
        </motion.div>
      </main>
    </div>
  );
};

export default Leaderboard;
