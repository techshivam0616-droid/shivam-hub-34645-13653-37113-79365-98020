import { Header } from '@/components/Layout/Header';
import { QuoteCarousel } from '@/components/Home/QuoteCarousel';
import { SectionCard, sectionIcons } from '@/components/Home/SectionCard';
import { ChannelPopup } from '@/components/Home/ChannelPopup';
import { HomePopup } from '@/components/Home/HomePopup';
import { PromotionalBanner } from '@/components/Home/PromotionalBanner';
import { PageTransition } from '@/components/ui/PageTransition';
import { TechAICard } from '@/components/Home/TechAICard';

import { motion } from 'framer-motion';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

const Index = () => {
  const { settings } = useWebsiteSettings();
  
  const sections = [
    {
      icon: sectionIcons.Mods,
      title: 'Mods',
      description: 'Discover and download the latest game modifications and enhancements',
      path: '/mods',
    },
    {
      icon: sectionIcons.Games,
      title: 'Games',
      description: 'Explore and download exciting games for all platforms',
      path: '/games',
    },
    {
      icon: sectionIcons.Assets,
      title: 'Assets',
      description: 'Download premium quality assets for your projects',
      path: '/assets',
    },
    {
      icon: sectionIcons.Bundles,
      title: 'Bundles',
      description: 'Get amazing bundle packs with exclusive content',
      path: '/bundles',
    },
    {
      icon: sectionIcons.Movies,
      title: 'Movies',
      description: 'Access a vast collection of movies across all genres',
      path: 'https://tech-movies.vercel.app/',
      external: true,
    },
    {
      icon: sectionIcons.Courses,
      title: 'Courses',
      description: 'Learn new skills with our comprehensive course library',
      path: '/courses',
    },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen relative overflow-hidden">
      <Header />
      <ChannelPopup />
      <HomePopup />
      
      <main className="container px-4 pt-6 pb-12 space-y-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 pt-4"
        >
          {/* Main Title */}
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Welcome to the Future
          </motion.h1>
          
          {/* Promotional Banner Slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-3xl mx-auto"
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

        {/* Tech AI Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="max-w-5xl mx-auto"
        >
          <TechAICard />
        </motion.div>

        {/* Cards Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto"
        >
          {sections.map((section, index) => (
            <SectionCard
              key={section.title}
              icon={section.icon}
              title={section.title}
              description={section.description}
              path={section.path}
              external={section.external}
              index={index}
            />
          ))}
        </motion.div>

        {/* Site Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-base text-muted-foreground leading-relaxed">
              {settings.siteDescription}
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border mt-16 py-10 bg-card/50 relative z-10">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-base font-semibold mb-3 text-foreground">About Us</h3>
              <p className="text-sm text-muted-foreground">
                {settings.aboutUs}
              </p>
            </div>
            
            <div>
              <h3 className="text-base font-semibold mb-3 text-foreground">What We Offer</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {settings.whatWeOffer.split('|').map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-base font-semibold mb-3 text-foreground">Connect With Us</h3>
              <a 
                href={settings.channelLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors px-4 py-2 rounded-lg border border-border hover:bg-secondary"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Visit Our YouTube Channel
              </a>
            </div>
          </div>
          
          <div className="border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Developer: <span className="font-semibold text-foreground">SHIVAM KUMAR</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
    </PageTransition>
  );
};

export default Index;
