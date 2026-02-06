import * as React from 'react';
import { Header } from '@/components/Layout/Header';
import { motion } from 'framer-motion';
import { Users, Target, Heart, Zap, Shield, Award } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/20 mb-4">
              <Users className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About Us</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We are passionate about delivering the best digital content and resources to our community.
            </p>
          </div>

          {/* Mission */}
          <div className="bg-card rounded-2xl border p-8 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Our mission is to provide high-quality mods, games, apps, and digital resources that enhance your digital experience. We believe everyone deserves access to premium content, which is why we work tirelessly to bring you the best selection available.
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <ValueCard 
              icon={<Heart className="h-6 w-6" />}
              title="Community First"
              description="We prioritize our community's needs and feedback in everything we do."
              color="primary"
            />
            <ValueCard 
              icon={<Zap className="h-6 w-6" />}
              title="Fast & Reliable"
              description="Quick downloads and reliable links are our top priority."
              color="secondary"
            />
            <ValueCard 
              icon={<Shield className="h-6 w-6" />}
              title="Safe & Secure"
              description="All content is thoroughly tested to ensure your safety."
              color="accent"
            />
            <ValueCard 
              icon={<Award className="h-6 w-6" />}
              title="Quality Content"
              description="We only share the best and most requested content."
              color="primary"
            />
          </div>

          {/* Team Section */}
          <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Join Our Community</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Be part of our growing community. Share your feedback, request new content, and connect with other users who share your interests.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Stat number="50K+" label="Downloads" />
              <Stat number="1000+" label="Apps & Games" />
              <Stat number="10K+" label="Happy Users" />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const ValueCard = ({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) => (
  <div className="bg-card rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className={`inline-flex p-3 rounded-xl mb-4 ${
      color === 'primary' ? 'bg-primary/10 text-primary' : 
      color === 'secondary' ? 'bg-secondary/20 text-secondary' : 
      'bg-accent/20 text-accent'
    }`}>
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const Stat = ({ number, label }: { number: string; label: string }) => (
  <div className="px-6 py-3">
    <p className="text-2xl font-bold text-primary">{number}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default AboutUs;
