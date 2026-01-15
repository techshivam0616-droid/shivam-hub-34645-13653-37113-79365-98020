import { Header } from '@/components/Layout/Header';
import { QuoteCarousel } from '@/components/Home/QuoteCarousel';
import { SectionCard } from '@/components/Home/SectionCard';
import { ChannelPopup } from '@/components/Home/ChannelPopup';
import { HomePopup } from '@/components/Home/HomePopup';
import { PromotionalBanner } from '@/components/Home/PromotionalBanner';

import { motion } from 'framer-motion';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

// Import ultra-realistic icons
import modsIcon from '@/assets/icons/mods-icon.png';
import gamesIcon from '@/assets/icons/games-icon.png';
import assetsIcon from '@/assets/icons/assets-icon.png';
import bundlesIcon from '@/assets/icons/bundles-icon.png';
import moviesIcon from '@/assets/icons/movies-icon.png';
import coursesIcon from '@/assets/icons/courses-icon.png';

const Index = () => {
  const { settings } = useWebsiteSettings();
  
  const sections = [
    {
      iconImage: modsIcon,
      title: 'Mods',
      description: 'Discover and download the latest game modifications and enhancements',
      path: '/mods',
    },
    {
      iconImage: gamesIcon,
      title: 'Games',
      description: 'Explore and download exciting games for all platforms',
      path: '/games',
    },
    {
      iconImage: assetsIcon,
      title: 'Assets',
      description: 'Download premium quality assets for your projects',
      path: '/assets',
    },
    {
      iconImage: bundlesIcon,
      title: 'Bundles',
      description: 'Get amazing bundle packs with exclusive content',
      path: '/bundles',
    },
    {
      iconImage: moviesIcon,
      title: 'Movies',
      description: 'Access a vast collection of movies across all genres',
      path: 'https://tech-movies.vercel.app/',
      external: true,
    },
    {
      iconImage: coursesIcon,
      title: 'Courses',
      description: 'Learn new skills with our comprehensive course library',
      path: '/courses',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Header />
      <ChannelPopup />
      <HomePopup />
      
      <main className="container px-4 pt-4 pb-12 space-y-6 relative z-10">
        {/* Floating decorative orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 opacity-20 pointer-events-none float">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/40 to-transparent blur-2xl" />
        </div>
        <div className="absolute top-60 right-16 w-24 h-24 opacity-15 pointer-events-none float" style={{ animationDelay: '2s' }}>
          <div className="w-full h-full rounded-full bg-gradient-to-br from-secondary/50 to-transparent blur-2xl" />
        </div>
        <div className="absolute bottom-60 left-24 w-20 h-20 opacity-15 pointer-events-none float" style={{ animationDelay: '4s' }}>
          <div className="w-full h-full rounded-full bg-gradient-to-br from-accent/50 to-transparent blur-2xl" />
        </div>
        <div className="absolute top-1/2 right-8 w-28 h-28 opacity-10 pointer-events-none float" style={{ animationDelay: '3s' }}>
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/30 via-secondary/20 to-transparent blur-3xl" />
        </div>

        {/* Hero Section with Glassmorphic design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 pt-2"
        >
          {/* Main Title with glow effect */}
          <div className="relative">
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-bold gradient-text tracking-tight drop-shadow-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Welcome to the Future
            </motion.h1>
            {/* Glow behind title */}
            <div className="absolute inset-0 text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary via-secondary to-accent blur-3xl opacity-30 -z-10">
              Welcome to the Future
            </div>
          </div>
          
          {/* Promotional Banner Slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <PromotionalBanner />
          </motion.div>
        </motion.div>


        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <QuoteCarousel />
        </motion.div>

        {/* Cards Grid with enhanced spacing */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {sections.map((section, index) => (
            <SectionCard
              key={section.title}
              {...section}
              index={index}
            />
          ))}
        </motion.div>

        {/* Site Description - Glassmorphic box at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {settings.siteDescription}
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border/30 mt-20 py-12 glass-effect relative z-10">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4 gradient-text">About Us</h3>
              <p className="text-sm text-muted-foreground">
                {settings.aboutUs}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 gradient-text">What We Offer</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {settings.whatWeOffer.split('|').map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      index % 3 === 0 ? 'bg-primary shadow-lg shadow-primary/50' : 
                      index % 3 === 1 ? 'bg-secondary shadow-lg shadow-secondary/50' : 
                      'bg-accent shadow-lg shadow-accent/50'
                    } animate-pulse`}></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 gradient-text">Connect With Us</h3>
              <a 
                href={settings.channelLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-glow transition-all duration-300 hover:scale-105 glass-card px-5 py-3 rounded-xl neon-border"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Visit Our YouTube Channel
              </a>
            </div>
          </div>
          
          <div className="border-t border-border/30 pt-6 text-center">
            <p className="text-sm text-muted-foreground font-semibold">
              Developer: <span className="gradient-text font-bold text-base">SHIVAM KUMAR</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
