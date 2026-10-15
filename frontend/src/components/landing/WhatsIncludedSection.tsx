import React from 'react';
import { BarChart3, Clock, Keyboard, Sparkles, Target, Trophy } from 'lucide-react';
import { examConfig } from '../../config/examConfig';

export function WhatsIncludedSection() {
  const features = [
    {
      title: 'Timed full mocks',
      text: `${examConfig.totalQuestions} questions, ${examConfig.durationMinutes} minutes, four subjects — structured exactly like the real CBT.`,
      icon: Clock,
      tint: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      title: 'Topic drills',
      text: `Repair one weak area at a time with ${examConfig.drillSizes[0]}, ${examConfig.drillSizes[1]} or ${examConfig.drillSizes[2]}-question focused drills.`,
      icon: Target,
      tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Exam hotkeys',
      text: 'A-D to answer, N/P to move, F to flag, S to submit. Build real muscle memory.',
      icon: Keyboard,
      tint: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      title: 'Falke AI tutor',
      text: 'Step-by-step explanations in Standard English or Nigerian Pidgin.',
      icon: Sparkles,
      tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      title: 'Diagnostics',
      text: 'Readiness index, subject accuracy and pace — so you know where marks leak.',
      icon: BarChart3,
      tint: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
    {
      title: 'Syllabus & leaderboard',
      text: 'Track coverage of the official syllabus and compete on XP and streaks.',
      icon: Trophy,
      tint: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
  ];

  return (
    <section id="whats-included" className="py-16 sm:py-20 lg:py-24 border-t border-[var(--arena-border-subtle)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <div className="text-xs font-semibold text-[var(--arena-primary)] uppercase tracking-wider mb-2">
            What's included
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--arena-text-primary)]">
            Everything a candidate needs, none of the noise.
          </h2>
        </div>

        {/* 6 Feature Cards Grid (3 cols on desktop, 2 on tablet, 1 on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-[var(--arena-border)] bg-[var(--arena-surface)] p-6 transition-all hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.tint} mb-4`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--arena-text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[var(--arena-text-secondary)]">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
