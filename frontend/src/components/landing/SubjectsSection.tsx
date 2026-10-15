import React from 'react';
import { Lock } from 'lucide-react';
import { COMPULSORY_SUBJECT, ELECTIVE_SUBJECTS } from '../../constants/subjects';

export function SubjectsSection() {
  const electiveCount = ELECTIVE_SUBJECTS.length;

  return (
    <section id="subjects" className="py-16 sm:py-20 lg:py-24 border-t border-[var(--arena-border-subtle)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <div className="text-xs font-semibold text-[var(--arena-primary)] uppercase tracking-wider mb-2">
            Subjects
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--arena-text-primary)]">
            Use of English plus {electiveCount} electives.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[var(--arena-text-secondary)]">
            Every combination on the UTME brochure is supported. Pick yours once and every mock follows it.
          </p>
        </div>

        {/* Subjects Layout: Left English Card, Right 16 Electives Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-stretch">
          {/* Left: Use of English Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-[var(--arena-border)] bg-[var(--arena-primary-subtle)] p-6 transition-all shadow-sm">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/50 dark:border-blue-800/40 bg-white/70 dark:bg-blue-950/70 px-2.5 py-1 text-xs font-semibold text-[var(--arena-primary)] mb-5">
                <Lock className="h-3 w-3" />
                <span>Mandatory</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--arena-text-primary)]">
                {COMPULSORY_SUBJECT.label}
              </h3>
            </div>
            <div className="mt-8 pt-4 border-t border-[var(--arena-border-subtle)] text-xs font-medium text-[var(--arena-text-secondary)]">
              {COMPULSORY_SUBJECT.questions} questions · every mock
            </div>
          </div>

          {/* Right: 16 Electives Grid (4 columns x 4 rows) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ELECTIVE_SUBJECTS.map((sub) => (
              <div
                key={sub.code}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface)] px-4 py-3.5 transition-all hover:border-[var(--arena-border-hover,#94a3b8)]"
              >
                <span className="text-xs sm:text-sm font-semibold text-[var(--arena-text-primary)] truncate" title={sub.label}>
                  {sub.label}
                </span>
                <span className="shrink-0 font-mono text-[11px] font-bold text-[var(--arena-text-muted)] bg-[var(--arena-bg-subtle)] border border-[var(--arena-border-subtle)] px-2 py-0.5 rounded">
                  {sub.code}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
