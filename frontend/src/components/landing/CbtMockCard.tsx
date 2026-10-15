import React from 'react';
import { Clock, Sparkles } from 'lucide-react';

export interface MockCardOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
  isSelected?: boolean;
}

export interface MockNavigatorSquare {
  number: number;
  status: 'answered' | 'current' | 'flagged' | 'unanswered';
}

export interface CbtMockCardProps {
  subject: string;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: string;
  questionPrompt: string;
  underlinedWord?: string;
  options: MockCardOption[];
  falkeExplanation?: {
    label: string;
    text: string;
  };
  navigatorItems: MockNavigatorSquare[];
  footnote: string;
}

export const DEFAULT_MOCK_CARD_PROPS: CbtMockCardProps = {
  subject: 'Use of English',
  questionNumber: 14,
  totalQuestions: 60,
  timeRemaining: '01:24:17',
  questionPrompt:
    'Choose the option nearest in meaning to the underlined word: The students were keen to begin the practical session.',
  underlinedWord: 'keen',
  options: [
    { key: 'A', text: 'reluctant', isSelected: false },
    { key: 'B', text: 'eager', isSelected: true },
    { key: 'C', text: 'indifferent', isSelected: false },
    { key: 'D', text: 'anxious', isSelected: false },
  ],
  falkeExplanation: {
    label: 'Falke AI explanation',
    text: '"Keen" means enthusiastic or very willing — so "eager" is the closest match.',
  },
  navigatorItems: Array.from({ length: 30 }, (_, i) => {
    const num = i + 1;
    if (num === 14) return { number: num, status: 'current' as const };
    if (num === 19) return { number: num, status: 'flagged' as const };
    if (num <= 15) return { number: num, status: 'answered' as const };
    return { number: num, status: 'unanswered' as const };
  }),
  footnote: 'Illustration only — not a live exam.',
};

export function CbtMockCard(props: Partial<CbtMockCardProps>) {
  const data = { ...DEFAULT_MOCK_CARD_PROPS, ...props };

  // Render question prompt with underlined word if specified
  const renderQuestionText = () => {
    if (!data.underlinedWord) return data.questionPrompt;
    const parts = data.questionPrompt.split(data.underlinedWord);
    if (parts.length < 2) return data.questionPrompt;
    return (
      <>
        {parts[0]}
        <span className="font-semibold underline underline-offset-4 decoration-2 decoration-current">
          {data.underlinedWord}
        </span>
        {parts.slice(1).join(data.underlinedWord)}
      </>
    );
  };

  return (
    <div className="relative w-full max-w-[620px] rounded-2xl border border-[var(--arena-border)] bg-[var(--arena-surface)] p-5 sm:p-6 shadow-[var(--arena-card-shadow)] text-[var(--arena-text-primary)] transition-colors">
      {/* Top Header Row: Subject, Question number, and Timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--arena-border-subtle)] pb-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-semibold text-[var(--arena-primary)] border border-blue-200/60 dark:border-blue-900/40">
            {data.subject}
          </span>
          <span className="text-[var(--arena-text-secondary)] font-medium">
            Question {data.questionNumber} of {data.totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-semibold text-[var(--arena-text-primary)] bg-[var(--arena-bg-subtle)] px-2.5 py-1 rounded-md border border-[var(--arena-border-subtle)]">
          <Clock className="h-3.5 w-3.5 text-[var(--arena-primary)]" />
          <span>{data.timeRemaining}</span>
        </div>
      </div>

      {/* Main Content Area: Question + Options on left, Navigator on right */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_135px] gap-6 pt-5">
        {/* Left: Question & Options */}
        <div className="space-y-4">
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--arena-text-primary)] font-medium">
            {renderQuestionText()}
          </p>

          {/* Options A-D */}
          <div className="space-y-2">
            {data.options.map((opt) => {
              const isSelected = opt.isSelected;
              return (
                <div
                  key={opt.key}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-[var(--arena-primary)] bg-[var(--arena-primary-subtle)] text-[var(--arena-text-primary)] ring-1 ring-[var(--arena-primary)]'
                      : 'border-[var(--arena-border)] bg-[var(--arena-surface)] text-[var(--arena-text-secondary)] hover:border-[var(--arena-border-hover,#94a3b8)]'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                      isSelected
                        ? 'bg-[var(--arena-primary)] text-white'
                        : 'bg-[var(--arena-bg-subtle)] text-[var(--arena-text-secondary)] border border-[var(--arena-border)]'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <span className={isSelected ? 'font-semibold text-[var(--arena-text-primary)]' : ''}>
                    {opt.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Falke AI Explanation Box */}
          {data.falkeExplanation && (
            <div className="rounded-xl border border-[var(--arena-amber-border)] bg-[var(--arena-amber-bg)] p-3 text-xs leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--arena-amber)] mb-1">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>{data.falkeExplanation.label}</span>
              </div>
              <p className="text-[var(--arena-text-secondary)] italic">
                {data.falkeExplanation.text}
              </p>
            </div>
          )}
        </div>

        {/* Right: Question Navigator Grid (5 cols x 6 rows = 30) */}
        <div className="flex flex-col sm:border-l sm:border-[var(--arena-border-subtle)] sm:pl-5">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[var(--arena-text-muted)] mb-2.5">
            NAVIGATOR
          </div>
          <div className="grid grid-cols-5 gap-1.5 w-fit">
            {data.navigatorItems.map((item) => {
              let styleClass =
                'border border-[var(--arena-border)] bg-[var(--arena-surface)] text-[var(--arena-text-muted)]';

              if (item.status === 'current') {
                styleClass =
                  'bg-[var(--arena-primary)] border-[var(--arena-primary)] text-white font-bold ring-2 ring-[var(--arena-primary)]/30';
              } else if (item.status === 'answered') {
                styleClass =
                  'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold';
              } else if (item.status === 'flagged') {
                styleClass =
                  'bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold';
              }

              return (
                <div
                  key={item.number}
                  className={`flex h-5 w-5 sm:h-5 sm:w-5 items-center justify-center rounded text-[10px] transition-colors ${styleClass}`}
                >
                  {item.number}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div className="mt-4 pt-3 border-t border-[var(--arena-border-subtle)] text-center">
        <span className="text-[11px] font-medium text-[var(--arena-text-muted)] tracking-wide">
          {data.footnote}
        </span>
      </div>
    </div>
  );
}
