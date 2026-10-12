import { SUBJECT_LABELS, AVAILABLE_SUBJECTS, getSubjectLabel } from '../../constants/subjects';
import { supportChannels } from '../../components/SupportPageShell';

/**
 * Every fact on the landing page lives here so it can be checked in one place.
 * Anything marked "verified" was confirmed against the code, not copied from old marketing copy.
 */

export const SITE_NAME = 'Aurikrex Exam Arena';

/** verified: backend/src/exam/exam.service.ts (English 60, others 40, 7200 s) */
export const MOCK_FORMAT = { subjects: 4, englishQuestions: 60, electiveQuestions: 40, minutes: 120 } as const;

export const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: "What's included", href: '#included' },
  { label: 'Subjects', href: '#subjects' },
  { label: 'Free beta', href: '#access' },
] as const;

/** verified: AuthPage (register + 6-digit email code), MockSetupPage, ExamConsole, ResultReview */
export const STEPS = [
  {
    title: 'Create a free account',
    text: 'Sign up with your email and confirm it with the 6-digit code we send you.',
  },
  {
    title: 'Choose your four subjects',
    text: 'Use of English plus three electives, the same shape as the UTME.',
  },
  {
    title: 'Take a mock or a drill',
    text: `A full mock is ${MOCK_FORMAT.englishQuestions + MOCK_FORMAT.electiveQuestions * 3} questions in ${MOCK_FORMAT.minutes} minutes. A drill is 10, 20 or 40 questions on one subject.`,
  },
  {
    title: 'Review and repeat',
    text: 'See your score for each subject, go through every answer, and drill the topics you missed.',
  },
] as const;

export type FeatureIcon = 'clock' | 'target' | 'keyboard' | 'message' | 'chart' | 'book';

/** verified against exam, dashboard, results, Falke AI and syllabus pages */
export const FEATURES: ReadonlyArray<{ icon: FeatureIcon; title: string; text: string }> = [
  {
    icon: 'clock',
    title: 'Timed four-subject mocks',
    text: `${MOCK_FORMAT.englishQuestions} English questions and ${MOCK_FORMAT.electiveQuestions} for each elective, against a ${MOCK_FORMAT.minutes}-minute countdown. Your answers are saved as you go.`,
  },
  {
    icon: 'target',
    title: 'Topic drills',
    text: 'Pick a subject, choose topics and difficulty, and practise 10, 20 or 40 questions.',
  },
  {
    icon: 'keyboard',
    title: 'Built for the exam room',
    text: 'Answer with A to D, move with N and P, flag with F, submit with S. A question palette and an on-screen calculator are included.',
  },
  {
    icon: 'message',
    title: 'Explanations in English or Pidgin',
    text: 'Ask Falke AI to explain any answer. Explanations are AI-generated, so check anything that looks wrong.',
  },
  {
    icon: 'chart',
    title: 'Results that show weak spots',
    text: 'Filter your results by subject and by correct, wrong or skipped, and see which topics need work.',
  },
  {
    icon: 'book',
    title: 'Syllabus and progress tracking',
    text: 'Follow your coverage topic by topic and see how you rank on the leaderboard.',
  },
];

/** verified: derived from constants/subjects.ts so the count can never drift from the app */
export const SUBJECTS: ReadonlyArray<{ key: string; label: string; compulsory: boolean }> = [
  'english',
  ...AVAILABLE_SUBJECTS.filter((key) => key in SUBJECT_LABELS),
].map((key) => ({ key, label: getSubjectLabel(key), compulsory: key === 'english' }));

/**
 * verified: new accounts get the "max" tier and 5,000 AuriCoins a month, each AI request costs 5
 * (backend/src/coins/coins.service.ts, auth.service.ts). A daily cap on full mocks also exists
 * (exam.service.ts), but Terms of Service and Help Centre quote different numbers, so no figure
 * is shown here until that is settled.
 */
export const BETA_TERMS = [
  'Every feature on this page is included while the public beta runs, and no payment card is needed.',
  'There is a daily limit on full mock exams. Drills are not limited in the same way.',
  'Falke AI explanations use AuriCoins. Your account gets 5,000 a month and each AI request costs 5.',
] as const;

export const SUPPORT = {
  email: supportChannels.email,
  phoneDisplay: supportChannels.phoneDisplay,
  phoneLink: supportChannels.phoneLink,
} as const;

export const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Subjects', href: '#subjects' },
      { label: 'Free beta', href: '#access' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help centre', to: '/help' },
      { label: 'Contact us', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
    ],
  },
] as const;
