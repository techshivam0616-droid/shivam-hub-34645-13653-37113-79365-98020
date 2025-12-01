import { Header } from '@/components/Layout/Header';
import { QuoteCarousel } from '@/components/Home/QuoteCarousel';
import { SectionCard } from '@/components/Home/SectionCard';
import { ChannelPopup } from '@/components/Home/ChannelPopup';
import { HomePopup } from '@/components/Home/HomePopup';
import { Package, Film, GraduationCap, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

const Index = () => {
  const { settings } = useWebsiteSettings();
  
  const sections = [
    {
      icon: Package,
      title: 'Mods',
      description: 'Discover and download the latest game modifications and enhancements',
      path: '/mods',
    },
    {
      icon: Gamepad2,
      title: 'Games',
      description: 'Explore and download exciting games for all platforms',
      path: '/games',
    },
    {
      icon: Film,
      title: 'Movies',
      description: 'Access a vast collection of movies across all genres',
      path: 'https://tech-movies.vercel.app/',
      external: true,
    },
    {
      icon: GraduationCap,
      title: 'Courses',
      description: 'Learn new skills with our comprehensive course library',
      path: '/courses',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      <ChannelPopup />
      <HomePopup />
      
      <main className="container px-4 py-12 space-y-16 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 py-12"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold gradient-text tracking-tight"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Welcome to the Future
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {settings.siteDescription}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <QuoteCarousel />
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {sections.map((section, index) => (
            <SectionCard
              key={section.title}
              {...section}
              index={index}
            />
          ))}
        </div>
      </main>

      <footer className="border-t border-border/50 mt-20 py-12 bg-card/30 backdrop-blur-lg relative z-10">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 gradient-text">About Us</h3>
              <p className="text-sm text-muted-foreground">
                {settings.aboutUs}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 gradient-text">What We Offer</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {settings.whatWeOffer.split('|').map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      index % 3 === 0 ? 'bg-primary' : 
                      index % 3 === 1 ? 'bg-secondary' : 
                      'bg-accent'
                    } animate-pulse`}></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 gradient-text">Connect With Us</h3>
              <a 
                href={settings.channelLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-glow transition-all duration-300 hover:scale-105 neon-border px-4 py-2 rounded-lg"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Visit Our YouTube Channel
              </a>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-6 text-center">
            <p className="text-sm text-muted-foreground font-semibold">
              Developer: <span className="gradient-text font-bold">SHIVAM KUMAR</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
