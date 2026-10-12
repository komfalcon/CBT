import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, Clock, Keyboard, MessageCircle, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStatus } from '../hooks/useAuthStatus';
import { ActionLink } from './landing/ActionLink';
import { CbtKeyDialog } from './landing/CbtKeyDialog';
import { LandingFooter } from './landing/LandingFooter';
import { LandingHeader } from './landing/LandingHeader';
import { SampleExam } from './landing/SampleExam';
import { BETA_TERMS, FEATURES, MOCK_FORMAT, STEPS, SUBJECTS } from './landing/content';
import type { FeatureIcon } from './landing/content';

const ICONS: Record<FeatureIcon, LucideIcon> = {
  clock: Clock,
  target: Target,
  keyboard: Keyboard,
  message: MessageCircle,
  chart: BarChart3,
  book: BookOpen,
};

const container = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';
const section = 'scroll-mt-16 py-12 sm:py-16 md:py-20 lg:py-24';

function Heading({ id, children, lead }: { id: string; children: string; lead?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 id={id} className="font-display text-[clamp(1.35rem,1rem+1.2vw,2.25rem)] font-semibold leading-snug text-text-primary text-balance">
        {children}
      </h2>
      {lead && <p className="mt-2.5 text-sm text-text-secondary sm:mt-3 sm:text-body-lg">{lead}</p>}
    </div>
  );
}

export default function LandingPage() {
  const status = useAuthStatus();
  const [keyOpen, setKeyOpen] = useState(false);
  const signedIn = status === 'signed-in';
  const subjectCount = SUBJECTS.length;

  return (
    <div className="landing-root min-h-screen bg-bg-primary text-text-primary">
      <LandingHeader status={status} onOpenKey={() => setKeyOpen(true)} />

      <div id="content" tabIndex={-1} className="outline-none">
        {/* HERO SECTION */}
        <section
          aria-labelledby="hero-title"
          className={`${container} grid items-center gap-8 py-8 sm:py-12 md:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-20`}
        >
          <div>
            <h1
              id="hero-title"
              className="font-display text-[clamp(1.75rem,1.15rem+2.2vw,3rem)] font-bold leading-[1.15] text-text-primary text-balance"
            >
              Practise for the JAMB UTME with timed computer-based mocks.
            </h1>
            <p className="mt-3.5 text-sm leading-relaxed text-text-secondary sm:mt-5 sm:text-body-lg">
              Sit full four-subject mock exams, drill the topics you miss, and get clear explanations in English or Nigerian Pidgin.
            </p>

            {/* CTAs with touch-optimized layouts */}
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              {signedIn ? (
                <>
                  <ActionLink to="/mock-setup" variant="primary" size="lg" className="w-full sm:w-auto">
                    Start a mock exam
                  </ActionLink>
                  <ActionLink to="/dashboard" size="lg" className="w-full sm:w-auto">
                    Go to dashboard
                  </ActionLink>
                </>
              ) : (
                <>
                  <ActionLink to="/auth?mode=register" variant="primary" size="lg" className="w-full sm:w-auto">
                    Create free account
                  </ActionLink>
                  <ActionLink to="/auth?mode=login" size="lg" className="w-full sm:w-auto">
                    Sign in
                  </ActionLink>
                </>
              )}
            </div>

            {/* Secondary trust / key trigger */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-text-secondary sm:text-sm">
              <span>Free during public beta · No card needed.</span>
              {!signedIn && (
                <button
                  type="button"
                  onClick={() => setKeyOpen(true)}
                  className="inline-flex min-h-[44px] items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-none"
                >
                  Have a CBT key?
                </button>
              )}
            </div>
          </div>

          {/* Sample exam preview */}
          <SampleExam />
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" aria-labelledby="how-title" className={`${section} border-t border-border`}>
          <div className={container}>
            <Heading id="how-title" lead="From sign-up to your first score in four straightforward steps.">
              How it works
            </Heading>
            <ol className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-border/60 bg-bg-card/40 p-4 sm:border-0 sm:bg-transparent sm:p-0">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-royal-blue text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <h3 className="mt-3 font-display text-base font-semibold text-text-primary sm:mt-4 sm:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-text-secondary sm:mt-2 sm:text-body-md">
                    {step.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* WHAT'S INCLUDED */}
        <section id="included" aria-labelledby="included-title" className={`${section} border-t border-border bg-bg-secondary`}>
          <div className={container}>
            <Heading id="included-title" lead="Exam tools designed specifically for Nigerian UTME candidates.">
              What's included
            </Heading>
            <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-9">
              {FEATURES.map((feature) => {
                const Icon = ICONS[feature.icon];
                return (
                  <li key={feature.title} className="rounded-xl border border-border bg-bg-card p-4 sm:border-0 sm:bg-transparent sm:p-0">
                    <Icon size={22} className="text-primary sm:h-6 sm:w-6" aria-hidden="true" />
                    <h3 className="mt-2.5 font-display text-base font-semibold text-text-primary sm:mt-3 sm:text-lg">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-text-secondary sm:mt-2 sm:text-body-md">
                      {feature.text}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* SUBJECTS SHOWCASE */}
        <section id="subjects" aria-labelledby="subjects-title" className={`${section} border-t border-border`}>
          <div className={container}>
            <Heading
              id="subjects-title"
              lead={`Mocks feature ${MOCK_FORMAT.englishQuestions} questions in Use of English and ${MOCK_FORMAT.electiveQuestions} in each of your 3 electives.`}
            >
              {`${subjectCount} subjects available`}
            </Heading>
            <ul className="mt-6 flex flex-wrap gap-2 sm:mt-8 sm:gap-2.5">
              {SUBJECTS.map((subject) => (
                <li
                  key={subject.key}
                  className={`rounded-full border px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm ${
                    subject.compulsory
                      ? 'border-accent-royal-blue/60 bg-accent-royal-blue/10 font-medium text-text-primary'
                      : 'border-border bg-bg-card text-text-primary'
                  }`}
                >
                  {subject.label}
                  {subject.compulsory && (
                    <span className="ml-1.5 text-[11px] text-accent-royal-blue sm:text-xs">
                      · compulsory
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FREE BETA ACCESS */}
        <section id="access" aria-labelledby="access-title" className={`${section} border-t border-border bg-bg-secondary`}>
          <div className={`${container} grid gap-8 lg:grid-cols-2 lg:gap-10`}>
            <Heading
              id="access-title"
              lead="Sign in using your email and password, or use the personal CBT key generated with your account."
            >
              Free during the public beta
            </Heading>
            <ul className="space-y-3 text-xs leading-relaxed text-text-secondary sm:space-y-4 sm:text-body-md">
              {BETA_TERMS.map((term) => (
                <li key={term} className="border-l-2 border-accent-royal-blue pl-3.5 sm:pl-4">
                  {term}
                </li>
              ))}
              <li className="pl-3.5 pt-1 text-xs sm:pl-4 sm:text-sm">
                Read our full{' '}
                <Link className="font-medium text-primary underline underline-offset-4" to="/terms">
                  terms of service
                </Link>
                .
              </li>
            </ul>
          </div>
        </section>

        {/* FINAL CTA */}
        <section aria-labelledby="final-title" className={`${section} border-t border-border`}>
          <div className={`${container} text-center`}>
            <h2
              id="final-title"
              className="mx-auto max-w-2xl font-display text-[clamp(1.35rem,1rem+1.2vw,2.25rem)] font-semibold leading-tight text-text-primary text-balance"
            >
              Take your first mock exam today.
            </h2>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
              {signedIn ? (
                <ActionLink to="/mock-setup" variant="primary" size="lg" className="w-full sm:w-auto">
                  Start a mock exam
                </ActionLink>
              ) : (
                <>
                  <ActionLink to="/auth?mode=register" variant="primary" size="lg" className="w-full sm:w-auto">
                    Create free account
                  </ActionLink>
                  <ActionLink size="lg" onClick={() => setKeyOpen(true)} className="w-full sm:w-auto">
                    Sign in with CBT key
                  </ActionLink>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
      <CbtKeyDialog open={keyOpen} onClose={() => setKeyOpen(false)} />
    </div>
  );
}
