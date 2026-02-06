import * as React from 'react';
import { Header } from '@/components/Layout/Header';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertCircle, Ban, RefreshCw, ShieldCheck } from 'lucide-react';

const TermsConditions = () => {
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Terms & Conditions</h1>
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Section 
              icon={<Scale className="h-5 w-5" />}
              title="Agreement to Terms"
              content={`By accessing and using our website, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access our service.

These Terms apply to all visitors, users, and others who access or use the Service. By accessing or using the Service, you agree to be bound by these Terms.`}
            />

            <Section 
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Use of Service"
              content={`You agree to use our service only for lawful purposes and in accordance with these Terms. You agree not to:

• Use the service in any way that violates applicable laws
• Attempt to gain unauthorized access to any portion of the service
• Interfere with or disrupt the service or servers
• Transmit any viruses, malware, or other malicious code
• Collect or harvest any information from our service`}
            />

            <Section 
              icon={<AlertCircle className="h-5 w-5" />}
              title="Disclaimer"
              content={`The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties including, without limitation, implied warranties of merchantability or fitness for a particular purpose.

We do not guarantee that the service will be uninterrupted, secure, or error-free.`}
            />

            <Section 
              icon={<Ban className="h-5 w-5" />}
              title="Limitations"
              content={`In no event shall we or our suppliers be liable for any damages arising out of the use or inability to use the materials on our website, even if we have been notified of the possibility of such damage.

Some jurisdictions do not allow limitations on implied warranties, so these limitations may not apply to you.`}
            />

            <Section 
              icon={<RefreshCw className="h-5 w-5" />}
              title="Changes to Terms"
              content={`We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.

By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.`}
            />

            <Section 
              icon={<FileText className="h-5 w-5" />}
              title="Governing Law"
              content={`These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.

Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.`}
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

export default TermsConditions;
