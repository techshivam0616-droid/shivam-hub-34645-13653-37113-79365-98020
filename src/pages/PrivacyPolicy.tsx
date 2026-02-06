import * as React from 'react';
import { Header } from '@/components/Layout/Header';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Users, Database, Cookie, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Section 
              icon={<Eye className="h-5 w-5" />}
              title="Information We Collect"
              content={`We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include:
              
• Your name, email address, and contact information
• Account credentials and profile information
• Payment information (processed securely through third parties)
• Any content you upload or share on our platform`}
            />

            <Section 
              icon={<Database className="h-5 w-5" />}
              title="How We Use Your Information"
              content={`We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Send you technical notices, updates, and support messages
• Respond to your comments, questions, and customer service requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions and abuse`}
            />

            <Section 
              icon={<Lock className="h-5 w-5" />}
              title="Data Security"
              content={`We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.`}
            />

            <Section 
              icon={<Users className="h-5 w-5" />}
              title="Information Sharing"
              content={`We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:

• To trusted third parties who assist us in operating our website
• When required by law or to protect our rights
• In connection with a merger, acquisition, or sale of assets`}
            />

            <Section 
              icon={<Cookie className="h-5 w-5" />}
              title="Cookies & Tracking"
              content={`We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.`}
            />

            <Section 
              icon={<Mail className="h-5 w-5" />}
              title="Contact Us"
              content={`If you have any questions about this Privacy Policy, please contact us through our Contact page or email us directly. We are committed to protecting your privacy and will respond to your inquiries promptly.`}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const Section = ({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) => (
  <div className="bg-card rounded-2xl border p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    </div>
    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>
  </div>
);

export default PrivacyPolicy;
