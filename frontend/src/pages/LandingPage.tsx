import React from 'react';
import { useAuthStatus } from '../hooks/useAuthStatus';
import { ArenaNavbar } from '../components/landing/ArenaNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { WhatsIncludedSection } from '../components/landing/WhatsIncludedSection';
import { SubjectsSection } from '../components/landing/SubjectsSection';
import { PublicBetaSection } from '../components/landing/PublicBetaSection';
import { ArenaFooter } from '../components/landing/ArenaFooter';

export default function LandingPage() {
  const status = useAuthStatus();
  const hasSession = status === 'signed-in';

  return (
    <div className="arena-root min-h-screen bg-[var(--arena-bg)] text-[var(--arena-text-primary)] transition-colors antialiased">
      {/* Background subtle grid pattern */}
      <div className="pointer-events-none fixed inset-0 arena-grid-bg opacity-30 dark:opacity-20" />

      {/* 1. Navbar (Sticky) */}
      <ArenaNavbar />

      <main id="main-content" className="relative z-10">
        {/* 2. Hero Section */}
        <HeroSection hasSession={hasSession} />

        {/* 3. How It Works Section */}
        <HowItWorksSection />

        {/* 4. What's Included Section */}
        <WhatsIncludedSection />

        {/* 5. Subjects Section */}
        <SubjectsSection />

        {/* 6. Public Beta Access Section & Final CTA Banner */}
        <PublicBetaSection />
      </main>

      {/* 7. Footer */}
      <ArenaFooter />
    </div>
  );
}
