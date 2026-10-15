export const examConfig = {
  seasonYear: 2027,
  seasonName: 'UTME 2027',
  seasonStatus: 'open' as 'open' | 'closed',
  seasonPillText: 'UTME 2027 practice season is open',
  
  // Real exam structure
  totalQuestions: 180,
  durationMinutes: 120,
  englishQuestions: 60,
  electiveQuestions: 40,
  electiveCount: 3,
  drillSizes: [10, 20, 40] as const,
  
  // Free Beta Limits
  freeBeta: {
    mocksPerWeek: 3,
    aiExplanationsPerWeek: 40,
    aiRefillDay: 'Monday',
  },
} as const;
