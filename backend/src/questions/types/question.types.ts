export const QUESTION_SUBJECTS = [
  'english',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'geography',
  'economics',
  'government',
  'literature',
  'commerce',
  'accounting',
  'agriculture',
  'civic_education',
  'crk',
  'irk',
  'history',
  'further_mathematics',
] as const;

export type QuestionSubject = (typeof QUESTION_SUBJECTS)[number];

export const QUESTION_TYPES = [
  'mcq_single',
  'mcq_multiple',
  'true_false',
  'fill_blank',
  'image_based',
  'latex',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const BLOOM_LEVELS = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
] as const;

export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export const QUESTION_STATUSES = [
  'draft',
  'under_review',
  'approved',
  'published',
  'retired',
] as const;

export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const QUESTION_SOURCES = ['manual', 'import', 'ai_generated'] as const;
export type QuestionSource = (typeof QUESTION_SOURCES)[number];

export const MEDIA_TYPES = ['image', 'audio', 'video'] as const;
export type QuestionMediaType = (typeof MEDIA_TYPES)[number];

export const OPTION_IDS = ['A', 'B', 'C', 'D', 'E'] as const;
export type QuestionOptionId = (typeof OPTION_IDS)[number];
