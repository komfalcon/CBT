import React from 'react';
import { examConfig } from '../../config/examConfig';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Create and verify your account',
      text: 'Sign up with email or Google and confirm with a six-digit code.',
    },
    {
      number: '02',
      title: 'Choose English plus three electives',
      text: 'Use of English is locked in. Pick the three subjects on your UTME slip.',
    },
    {
      number: '03',
      title: 'Take a full mock or focused drill',
      text: `${examConfig.totalQuestions} questions in ${examConfig.durationMinutes} minutes, or a 10-question repair drill on one topic.`,
    },
    {
      number: '04',
      title: 'Review and repeat weak areas',
      text: 'See every answer, read the explanation, then drill what you missed.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 border-t border-[var(--arena-border-subtle)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <div className="text-xs font-semibold text-[var(--arena-primary)] uppercase tracking-wider mb-2">
            How it works
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--arena-text-primary)]">
            Four steps from sign-up to exam-ready.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--arena-text-secondary)]">
            The same loop serious candidates already follow — just faster, timed and measured.
          </p>
        </div>

        {/* Content: Left 4 Steps, Right Student Image */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* 4 Steps */}
          <div className="space-y-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex items-start gap-4 rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface)] p-4 sm:p-5 transition-colors shadow-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--arena-primary-subtle)] text-xs font-bold text-[var(--arena-primary)] border border-blue-200/40 dark:border-blue-900/40 font-mono">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--arena-text-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--arena-text-secondary)] leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Image Panel */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--arena-border)] shadow-md">
            <img
              src="/images/student-study.jpg"
              alt="Candidate studying with CBT exam simulation"
              width={1024}
              height={682}
              loading="lazy"
              className="h-[360px] sm:h-[420px] w-full object-cover"
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <p className="text-base sm:text-lg font-bold tracking-wide">
                Discipline. Focus. Progress.
              </p>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Practise the CBT format until it feels routine.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
