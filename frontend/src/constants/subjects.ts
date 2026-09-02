export const SUBJECT_LABELS: Record<string, string> = {
  english: 'Use of English',
  mathematics: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  geography: 'Geography',
  economics: 'Economics',
  government: 'Government',
  literature: 'Literature in English',
  commerce: 'Commerce',
  accounting: 'Principles of Accounts',
  accounts: 'Principles of Accounts',
  agriculture: 'Agricultural Science',
  civic_education: 'Civic Education',
  civic: 'Civic Education',
  crk: 'Christian Religious Knowledge',
  crs: 'Christian Religious Knowledge',
  irk: 'Islamic Religious Knowledge',
  irs: 'Islamic Religious Knowledge',
  history: 'History',
  further_mathematics: 'Further Mathematics',
};

/** Maps legacy/import aliases to the canonical subject key used by the app. */
export const SUBJECT_ALIASES: Record<string, string> = {
  accounts: 'accounting',
  civic: 'civic_education',
  crs: 'crk',
  irs: 'irk',
};

export function normalizeSubjectKey(subject: string): string {
  const key = subject.trim().toLowerCase();
  return SUBJECT_ALIASES[key] ?? key;
}

export function getSubjectLabel(subject: string): string {
  const key = subject.trim().toLowerCase();
  const canonicalKey = normalizeSubjectKey(key);
  const knownLabel = SUBJECT_LABELS[canonicalKey] ?? SUBJECT_LABELS[key];
  if (knownLabel) return knownLabel;

  // Keep unknown values readable rather than exposing raw database formatting.
  return canonicalKey
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const AVAILABLE_SUBJECTS = Object.keys(SUBJECT_LABELS)
  .filter((subject) => !SUBJECT_ALIASES[subject] && subject !== 'english');
