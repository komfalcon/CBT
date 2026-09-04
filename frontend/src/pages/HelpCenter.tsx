import { useMemo, useState } from 'react';
import { BrainCircuit, ChevronDown, CircleHelp, CreditCard, KeyRound, Laptop, Mail, MonitorSmartphone, Search, Send, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SupportHero, SupportPageShell, supportChannels } from '../components';

type CategoryId = 'all' | 'account' | 'simulator' | 'keys' | 'technical';

interface Category {
  id: CategoryId;
  label: string;
  summary: string;
  icon: typeof UserRound;
}

interface FaqItem {
  id: string;
  category: Exclude<CategoryId, 'all'>;
  question: string;
  answer: string;
}

const categories: Category[] = [
  { id: 'all', label: 'All topics', summary: 'Browse every answer', icon: CircleHelp },
  { id: 'account', label: 'Account & Billing', summary: 'Sign-in, plans, payments, and refunds', icon: CreditCard },
  { id: 'simulator', label: 'Using the CBT Simulator', summary: 'Mocks, drills, scores, and FalkeAI', icon: MonitorSmartphone },
  { id: 'keys', label: 'CBT Keys', summary: 'Safe quick access on shared devices', icon: KeyRound },
  { id: 'technical', label: 'Technical Issues', summary: 'Browser, connection, and checkout help', icon: Laptop },
];

const faqs: FaqItem[] = [
  {
    id: 'verify-account',
    category: 'account',
    question: 'How do I create and verify my candidate account?',
    answer: 'Choose Sign up, enter your full name, email address, optional phone number, and a password with at least 8 characters, an uppercase letter, a number, and a special character. We send a six-digit code to your email. Enter that code on the verification screen to activate the account, then sign in to begin setting your UTME subjects.',
  },
  {
    id: 'google-sign-in',
    category: 'account',
    question: 'Can I sign in with Google?',
    answer: 'Yes. When the Google sign-in option is available, you can use it to create or sign in to a candidate profile with your Google account. Use the same email address you want connected to your Aurikrex Exam Arena profile. If you normally sign in with a password, you can continue using email and password instead.',
  },
  {
    id: 'subjects',
    category: 'account',
    question: 'Why do I need to choose four UTME subjects?',
    answer: 'Your full mock exam uses your four-subject UTME combination. Use of English is required, then choose three electives that match the subjects you plan to take. You can review and update the combination from your study workspace before starting a mock.',
  },
  {
    id: 'plans-and-payments',
    category: 'account',
    question: 'Which plan should I choose and how do I pay?',
    answer: 'Plus includes one full mock each day. Pro includes two full mocks each day plus subject drills. Max includes up to five full mocks each day, advanced performance review, drills, and FalkeAI access subject to daily AI limits. Select a plan from the study workspace and complete the secure Paystack checkout with your card. The plan and amount are confirmed after payment verification.',
  },
  {
    id: 'cancel-refund',
    category: 'account',
    question: 'How do I cancel a plan or ask about a refund?',
    answer: 'Cancel before the next billing date to prevent renewal; your paid access remains available until the end of the current billing period. If you cannot see a cancellation control in your account, email info@aurikrex.tech from the email connected to the plan. For a refund review, send the Paystack reference, charge date, amount, and a short explanation within 7 days. See the Terms of Service for the full refund policy.',
  },
  {
    id: 'mock-format',
    category: 'simulator',
    question: 'What does a full mock exam look like?',
    answer: 'A full mock uses your four-subject combination: 60 Use of English questions and 40 questions for each of the other three subjects, for 180 questions total. The simulator starts with a two-hour countdown and lets you move between subject tabs and question numbers before you submit.',
  },
  {
    id: 'drills',
    category: 'simulator',
    question: 'How do subject drills work?',
    answer: 'A drill focuses on one subject from your UTME combination. You can choose 10, 20, or 40 questions, select a difficulty level, and optionally target one or more topics. The timer allows one minute per question. Use drills to practise a weak topic before trying another full mock.',
  },
  {
    id: 'saved-answers',
    category: 'simulator',
    question: 'Are my answers saved while I take a test?',
    answer: 'Yes. An answer is saved when you select it and the active session also saves periodically. Keep your browser and connection open while taking a timed test. The simulator is designed as a continuous timed session, so do not depend on closing the page as a way to pause the clock.',
  },
  {
    id: 'scores',
    category: 'simulator',
    question: 'How are scores and performance analytics calculated?',
    answer: 'After submission, each subject is scored out of 100 based on correct, incorrect, and unanswered questions. A full mock adds the four subject scores for a total out of 400; a drill is scored out of 100. Your review also shows subject and topic patterns, timing, and history to help you focus revision.',
  },
  {
    id: 'falke-ai',
    category: 'simulator',
    question: 'What can FalkeAI help me with?',
    answer: 'FalkeAI is the in-app study tutor available to eligible Max-plan candidates. Ask it to explain a question, unpack a difficult topic, or help you create a next study step using your current learning context. It can make mistakes, so use its guidance alongside the question explanations and your study materials. Do not include sensitive personal information in chat prompts.',
  },
  {
    id: 'cbt-key-purpose',
    category: 'keys',
    question: 'What is my CBT key and where do I find it?',
    answer: 'Your CBT key is a unique alternative sign-in credential for your candidate account. It is shown in your study workspace, where you can reveal and copy it. It is especially useful when you need to access your account from a trusted cyber-café or shared computer without entering a password.',
  },
  {
    id: 'cbt-key-safety',
    category: 'keys',
    question: 'Can I share my CBT key with a friend or a cyber café?',
    answer: 'No. Your CBT key gives access to your candidate account, learning history, and paid features. Do not share, sell, photograph, post, or type it where someone else can record it. A cyber-café attendant should never need the key; enter it yourself and sign out when you finish.',
  },
  {
    id: 'cbt-key-trouble',
    category: 'keys',
    question: 'My CBT key is not working. What should I do?',
    answer: 'Check that you entered the key exactly as it appears in your workspace, without extra spaces. Confirm that your email verification is complete. If it still fails, sign in with email or Google where possible, then contact support from your registered email so we can verify the account and help secure access.',
  },
  {
    id: 'browser-connection',
    category: 'technical',
    question: 'What setup gives the best CBT experience?',
    answer: 'Use an up-to-date Chrome, Edge, Firefox, or Safari browser on a desktop or laptop with a stable internet connection. Keep only the tabs you need open, avoid private or incognito mode if it blocks sign-in storage, and use a charger or reliable power source for a full mock.',
  },
  {
    id: 'technical-error',
    category: 'technical',
    question: 'What details should I send if I see an error or a payment does not activate?',
    answer: 'First refresh once and sign back in. If the issue remains, contact support with the email on your account, the page or feature you were using, the time the issue occurred, your browser and device, and a screenshot if you can safely provide one. For payment issues, also include the Paystack transaction reference. Never send your password, CBT key, card number, or verification code.',
  },
];

export default function HelpCenter() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [expandedId, setExpandedId] = useState<string | null>('verify-account');

  const visibleFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return faqs.filter((item) => {
      const inCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesQuery = !normalizedQuery || item.question.toLowerCase().includes(normalizedQuery) || item.answer.toLowerCase().includes(normalizedQuery);
      return inCategory && matchesQuery;
    });
  }, [query, selectedCategory]);

  const selectCategory = (categoryId: CategoryId) => {
    setSelectedCategory(categoryId);
    setExpandedId(null);
  };

  return (
    <SupportPageShell>
      <SupportHero
        eyebrow="Help centre"
        title="Find your next study step."
        description="Straight answers for candidate accounts, paid access, timed mocks, subject drills, CBT keys, technical troubleshooting, and FalkeAI."
        icon={CircleHelp}
      />

      <main className="support-help-main mx-auto max-w-7xl px-8 py-16">
        <section className="support-surface rounded-[24px] p-7">
          <div className="support-help-search-header flex items-end justify-between gap-8">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Search support</p><h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.045em] text-text-primary">Start with the question you have.</h2></div>
            <p className="max-w-sm text-right text-[13px] leading-6 text-text-muted">Search by feature, plan, issue, or a word from an on-screen error.</p>
          </div>
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “CBT key”, “mock timer”, “refund”, or “FalkeAI”"
              className="support-input h-14 w-full rounded-xl border pl-12 pr-4 text-[14px] outline-none transition"
              aria-label="Search help articles"
            />
          </div>
        </section>

        <section className="support-help-categories mt-8 grid grid-cols-4 gap-4" aria-label="Help categories">
          {categories.map((category) => {
            const Icon = category.icon;
            const active = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => selectCategory(category.id)}
                className={`support-help-category rounded-2xl border p-5 text-left transition ${active ? 'border-primary/50 bg-primary/[0.10] shadow-[0_14px_32px_rgba(48,75,200,0.14)]' : 'support-surface hover:-translate-y-0.5 hover:border-border-hover'}`}
                aria-pressed={active}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${active ? 'border-primary/30 bg-primary/15 text-primary' : 'border-border bg-bg-primary/45 text-text-secondary'}`}><Icon className="h-5 w-5" /></div>
                <h2 className="mt-5 font-display text-[16px] font-semibold tracking-[-0.03em] text-text-primary">{category.label}</h2>
                <p className="mt-2 text-[12px] leading-5 text-text-muted">{category.summary}</p>
              </button>
            );
          })}
        </section>

        <section className="support-help-content mt-16 grid grid-cols-[minmax(0,1fr)_284px] gap-10">
          <div>
            <div className="flex items-end justify-between border-b border-border pb-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Common questions</p><h2 className="mt-3 font-display text-[30px] font-semibold tracking-[-0.045em] text-text-primary">{selectedCategory === 'all' ? 'Everything you need to know' : categories.find((category) => category.id === selectedCategory)?.label}</h2></div>
              <p className="text-xs text-text-muted">{visibleFaqs.length} answer{visibleFaqs.length === 1 ? '' : 's'}</p>
            </div>

            <div className="mt-5 space-y-3">
              {visibleFaqs.map((item) => {
                const expanded = expandedId === item.id;
                const category = categories.find((entry) => entry.id === item.category);
                return (
                  <article key={item.id} className="overflow-hidden rounded-2xl support-surface">
                    <button
                      type="button"
                      className="support-faq-trigger flex w-full items-start justify-between gap-6 px-6 py-5 text-left transition"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      aria-expanded={expanded}
                      aria-controls={`${item.id}-answer`}
                    >
                      <span><span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-primary">{category?.label}</span><span className="font-display text-[16px] font-semibold leading-6 tracking-[-0.025em] text-text-primary">{item.question}</span></span>
                      <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-primary transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded && <div id={`${item.id}-answer`} className="border-t border-border px-6 py-5 text-[14px] leading-7 text-text-secondary">{item.answer}</div>}
                  </article>
                );
              })}
              {visibleFaqs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-bg-secondary/35 px-8 py-12 text-center">
                  <p className="font-display text-lg font-semibold text-text-primary">No exact answer found.</p>
                  <p className="mt-2 text-[13px] leading-6 text-text-secondary">Try another search term or send the support team a short description of what you need.</p>
                  <button type="button" onClick={() => { setQuery(''); setSelectedCategory('all'); }} className="mt-5 text-sm font-semibold text-primary hover:text-primary-hover">Clear filters</button>
                </div>
              )}
            </div>
          </div>

          <aside className="self-start space-y-4">
            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.07] p-6"><BrainCircuit className="h-6 w-6 text-violet-300" /><h2 className="mt-5 font-display text-[18px] font-semibold tracking-[-0.03em] text-text-primary">Using FalkeAI?</h2><p className="mt-2 text-[13px] leading-6 text-text-secondary">Use it to understand a topic or an answer, not as a substitute for your own practice. Always review important responses.</p></div>
            <div className="support-surface rounded-2xl p-6"><Mail className="h-6 w-6 text-primary" /><h2 className="mt-5 font-display text-[18px] font-semibold tracking-[-0.03em] text-text-primary">Still need help?</h2><p className="mt-2 text-[13px] leading-6 text-text-secondary">Contact us with the email on your account, the feature you were using, and a screenshot if it is safe to share.</p><Link to="/contact" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-text-on-accent transition hover:bg-primary-hover"><Send className="h-4 w-4" />Contact support</Link><a className="mt-4 block text-[13px] font-semibold text-primary hover:text-primary-hover" href={`mailto:${supportChannels.email}`}>{supportChannels.email}</a></div>
          </aside>
        </section>
      </main>
    </SupportPageShell>
  );
}
