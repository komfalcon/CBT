import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Coins } from 'lucide-react';
import { ALL_CANONICAL_SUBJECTS } from '../../constants/subjects';
import { examConfig } from '../../config/examConfig';
import { siteConfig } from '../../config/siteConfig';

export function PublicBetaSection() {
  const totalSubjectsCount = ALL_CANONICAL_SUBJECTS.length;

  const infoCards = [
    {
      title: 'Full beta access',
      text: `All ${totalSubjectsCount} subjects, full question bank and syllabus tracker.`,
      icon: BookOpen,
    },
    {
      title: 'Mock & drill limits',
      text: `${examConfig.freeBeta.mocksPerWeek} full mocks per week · unlimited topic drills during beta.`,
      icon: Clock,
    },
    {
      title: 'AuriCoin AI allowance',
      text: `${examConfig.freeBeta.aiExplanationsPerWeek} Falke AI explanations per week, refilled every ${examConfig.freeBeta.aiRefillDay}.`,
      icon: Coins,
    },
  ];

  return (
    <section id="access" className="py-16 sm:py-20 lg:py-24 border-t border-[var(--arena-border-subtle)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top: Header on Left, 3 Info Cards on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-16 lg:mb-20">
          {/* Header */}
          <div className="max-w-md">
            <div className="text-xs font-semibold text-[var(--arena-primary)] uppercase tracking-wider mb-2">
              Public beta access
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--arena-text-primary)]">
              Free while we build it with you.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--arena-text-secondary)] leading-relaxed">
              No payment card. If your school issued a CBT key, it unlocks unlimited mocks immediately.
            </p>
          </div>

          {/* 3 Info Cards stacked */}
          <div className="space-y-4">
            {infoCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="flex items-start gap-4 rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface)] p-4 sm:p-5 transition-colors shadow-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--arena-primary-subtle)] text-[var(--arena-primary)] border border-blue-200/40 dark:border-blue-900/40">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-[var(--arena-text-primary)]">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-[var(--arena-text-secondary)]">
                      {card.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom: Final CTA Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-600/30 bg-gradient-to-br from-[#122858] via-[#091a42] to-[#040e28] px-6 py-12 sm:px-12 sm:py-16 text-center text-white shadow-xl">
          {/* Decorative ambient glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Your next mock is the one that counts.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300">
              Set your subject combination in under a minute and sit your first timed mock tonight.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={siteConfig.urls.register}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--arena-primary)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[var(--arena-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Create free account</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Explore the Arena
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
