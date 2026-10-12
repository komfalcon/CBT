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
const section = 'scroll-mt-20 py-16 md:py-20 lg:py-24';

function Heading({ id, children, lead }: { id: string; children: string; lead?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 id={id} className="font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] font-semibold leading-tight text-text-primary text-balance">
        {children}
      </h2>
      {lead && <p className="mt-3 text-body-lg text-text-secondary">{lead}</p>}
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
        <section aria-labelledby="hero-title" className={`${container} grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-24`}>
          <div>
            <h1 id="hero-title" className="font-display text-[clamp(2rem,1.25rem+2.4vw,3rem)] font-bold leading-[1.1] text-text-primary text-balance">
              Practise for the JAMB UTME with timed computer-based mocks.
            </h1>
            <p className="mt-5 max-w-xl text-body-lg text-text-secondary">
              Sit full four-subject mock exams, drill the topics you miss, and get clear explanations in English or Nigerian Pidgin.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {signedIn ? (
                <>
                  <ActionLink to="/mock-setup" variant="primary" size="lg">Start a mock exam</ActionLink>
                  <ActionLink to="/dashboard" size="lg">Go to dashboard</ActionLink>
                </>
              ) : (
                <>
                  <ActionLink to="/auth?mode=register" variant="primary" size="lg">Create free account</ActionLink>
                  <ActionLink to="/auth?mode=login" size="lg">Sign in</ActionLink>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-text-secondary">
              Free during the public beta. No payment card needed.
              {!signedIn && (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={() => setKeyOpen(true)}
                    className="inline-flex min-h-9 items-center font-medium text-primary underline underline-offset-4"
                  >
                    Have a CBT key?
                  </button>
                </>
              )}
            </p>
          </div>
          <SampleExam />
        </section>

        <section id="how-it-works" aria-labelledby="how-title" className={`${section} border-t border-border`}>
          <div className={container}>
            <Heading id="how-title" lead="From sign-up to your first score in four steps.">How it works</Heading>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-royal-blue text-sm font-semibold text-white" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">{step.title}</h3>
                  <p className="mt-2 text-body-md text-text-secondary">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="included" aria-labelledby="included-title" className={`${section} border-t border-border bg-bg-secondary`}>
          <div className={container}>
            <Heading id="included-title">What's included</Heading>
            <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = ICONS[feature.icon];
                return (
                  <li key={feature.title}>
                    <Icon size={24} className="text-primary" aria-hidden="true" />
                    <h3 className="mt-3 font-display text-lg font-semibold text-text-primary">{feature.title}</h3>
                    <p className="mt-2 text-body-md text-text-secondary">{feature.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="subjects" aria-labelledby="subjects-title" className={`${section} border-t border-border`}>
          <div className={container}>
            <Heading
              id="subjects-title"
              lead={`A mock has ${MOCK_FORMAT.englishQuestions} questions in Use of English and ${MOCK_FORMAT.electiveQuestions} in each of your three electives.`}
            >
              {`${subjectCount} subjects to practise`}
            </Heading>
            <ul className="mt-8 flex flex-wrap gap-2.5">
              {SUBJECTS.map((subject) => (
                <li key={subject.key} className="rounded-full border border-border bg-bg-card px-4 py-2 text-sm text-text-primary">
                  {subject.label}
                  {subject.compulsory && <span className="ml-2 text-text-secondary">· compulsory</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="access" aria-labelledby="access-title" className={`${section} border-t border-border bg-bg-secondary`}>
          <div className={`${container} grid gap-10 lg:grid-cols-2`}>
            <Heading id="access-title" lead="You can sign in with your email and password, or with the CBT key created with your account.">
              Free during the public beta
            </Heading>
            <ul className="space-y-4 text-body-md text-text-secondary">
              {BETA_TERMS.map((term) => (
                <li key={term} className="border-l-2 border-accent-royal-blue pl-4">{term}</li>
              ))}
              <li className="pl-4 text-sm">
                Read the full <Link className="font-medium text-primary underline underline-offset-4" to="/terms">terms of service</Link>.
              </li>
            </ul>
          </div>
        </section>

        <section aria-labelledby="final-title" className={`${section} border-t border-border`}>
          <div className={`${container} text-center`}>
            <h2 id="final-title" className="mx-auto max-w-2xl font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] font-semibold leading-tight text-text-primary text-balance">
              Take your first mock exam today.
            </h2>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {signedIn ? (
                <ActionLink to="/mock-setup" variant="primary" size="lg">Start a mock exam</ActionLink>
              ) : (
                <>
                  <ActionLink to="/auth?mode=register" variant="primary" size="lg">Create free account</ActionLink>
                  <ActionLink size="lg" onClick={() => setKeyOpen(true)}>Sign in with CBT key</ActionLink>
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
