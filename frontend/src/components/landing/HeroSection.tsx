import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Key, ShieldCheck } from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';
import { examConfig } from '../../config/examConfig';
import { CbtMockCard } from './CbtMockCard';

interface HeroSectionProps {
  hasSession: boolean;
}

export function HeroSection({ hasSession }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {/* Left Column: Headlines & CTAs */}
          <div className="max-w-xl">
            {/* Season Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--arena-border)] bg-[var(--arena-surface)] px-3 py-1 text-xs font-medium text-[var(--arena-text-secondary)] shadow-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>{examConfig.seasonPillText}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-[var(--arena-text-primary)] leading-[1.15]">
              Practise for the JAMB UTME with timed computer-based mocks.
            </h1>

            {/* Subcopy */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base leading-relaxed text-[var(--arena-text-secondary)]">
              Sit full four-subject mocks, drill the topics you keep missing, review every answer in detail, and get Falke AI explanations in Standard English or Nigerian Pidgin.
            </p>

            {/* CTAs */}
            <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to={siteConfig.urls.register}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--arena-primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--arena-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)]"
              >
                <span>Create free account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to={siteConfig.urls.cbtKey}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--arena-border)] bg-[var(--arena-surface)] px-4 py-3 text-sm font-medium text-[var(--arena-text-primary)] transition-colors hover:bg-[var(--arena-bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)]"
              >
                <Key className="h-4 w-4 text-[var(--arena-text-secondary)]" />
                <span>Have a CBT key?</span>
              </Link>
            </div>

            {/* Reassurance line */}
            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-[var(--arena-text-muted)]">
              <ShieldCheck className="h-4 w-4 text-[var(--arena-text-secondary)]" />
              <span>Free during the public beta · No payment card needed</span>
            </div>

            {/* Dashboard link - Shown only when session exists */}
            {hasSession && (
              <div className="mt-3 text-xs">
                <span className="text-[var(--arena-text-muted)]">Already practising? </span>
                <Link
                  to={siteConfig.urls.dashboard}
                  className="font-semibold text-[var(--arena-primary)] hover:underline"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: CBT Mock Card Illustration */}
          <div className="flex justify-center lg:justify-end">
            <CbtMockCard />
          </div>
        </div>
      </div>
    </section>
  );
}
