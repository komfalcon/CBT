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
  agriculture: 'Agricultural Science',
  civic_education: 'Civic Education',
  crs: 'Christian Religious Studies',
  irs: 'Islamic Studies',
  history: 'History',
  further_mathematics: 'Further Mathematics',
  computer_studies: 'Computer Studies',
  yoruba: 'Yoruba',
};

/** Maps 3-letter codes to subject keys */
export const SUBJECT_CODES: Record<string, string> = {
  english: 'ENG',
  mathematics: 'MTH',
  physics: 'PHY',
  chemistry: 'CHM',
  biology: 'BIO',
  economics: 'ECO',
  government: 'GOV',
  literature: 'LIT',
  crs: 'CRS',
  irs: 'IRS',
  geography: 'GEO',
  commerce: 'COM',
  accounting: 'ACC',
  agriculture: 'AGR',
  history: 'HIS',
  computer_studies: 'CMP',
  yoruba: 'YOR',
  further_mathematics: 'FMT',
  civic_education: 'CIV',
};

/** Maps legacy/import aliases to the canonical subject key used by the app. */
export const SUBJECT_ALIASES: Record<string, string> = {
  accounts: 'accounting',
  civic: 'civic_education',
  crk: 'crs',
  irk: 'irs',
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

export function getSubjectCode(subject: string): string {
  const key = subject.trim().toLowerCase();
  const canonicalKey = normalizeSubjectKey(key);
  return SUBJECT_CODES[canonicalKey] ?? SUBJECT_CODES[key] ?? key.slice(0, 3).toUpperCase();
}

/** 16 Electives matching the official UTME syllabus and Exam Arena curriculum */
export const ELECTIVE_SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics', code: 'MTH' },
  { key: 'physics', label: 'Physics', code: 'PHY' },
  { key: 'chemistry', label: 'Chemistry', code: 'CHM' },
  { key: 'biology', label: 'Biology', code: 'BIO' },
  { key: 'economics', label: 'Economics', code: 'ECO' },
  { key: 'government', label: 'Government', code: 'GOV' },
  { key: 'literature', label: 'Literature in English', code: 'LIT' },
  { key: 'crs', label: 'Christian Religious Stud...', code: 'CRS' },
  { key: 'irs', label: 'Islamic Studies', code: 'IRS' },
  { key: 'geography', label: 'Geography', code: 'GEO' },
  { key: 'commerce', label: 'Commerce', code: 'COM' },
  { key: 'accounting', label: 'Principles of Accounts', code: 'ACC' },
  { key: 'agriculture', label: 'Agricultural Science', code: 'AGR' },
  { key: 'history', label: 'History', code: 'HIS' },
  { key: 'computer_studies', label: 'Computer Studies', code: 'CMP' },
  { key: 'yoruba', label: 'Yoruba', code: 'YOR' },
] as const;

export const COMPULSORY_SUBJECT = {
  key: 'english',
  label: 'Use of English',
  code: 'ENG',
  questions: 60,
  mandatory: true,
} as const;

export const ALL_CANONICAL_SUBJECTS = [COMPULSORY_SUBJECT, ...ELECTIVE_SUBJECTS];

export const AVAILABLE_SUBJECTS = Object.keys(SUBJECT_LABELS)
  .filter((subject) => !SUBJECT_ALIASES[subject] && subject !== 'english');
