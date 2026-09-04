import axios from 'axios';

const baseURL = `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/results`;

const resultsApi = axios.create({
  baseURL,
  withCredentials: true,
});

function withAuth(_token?: string): { headers?: Record<string, string> } { return {}; }

export type GradedSubjectScore = {
  subject: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
};

export type GradedResultRecord = {
  resultId: string;
  sessionId: string;
  userId: string;
  type: 'mock' | 'drill';
  subjectScores: GradedSubjectScore[];
  totalScore: number;
  timeSpentSeconds: number;
  answers: Record<string, string>;
  questionsSnapshot: any[]; // Renders full details with correct answer & explanation
  completedAt: string;
};

export async function getResultsHistory(_token?: string) {
  const { data } = await resultsApi.get<GradedResultRecord[]>('/', withAuth(_token));
  return data;
}

export async function getResultDetail(_token: string | undefined, resultId: string) {
  const { data } = await resultsApi.get<GradedResultRecord>(`/${resultId}`, withAuth(_token));
  return data;
}

export type TopicStatRecord = {
  topic: string;
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
};

export async function getTopicStats(_token?: string) {
  const { data } = await resultsApi.get<TopicStatRecord[]>('/topic-stats', withAuth(_token));
  return data;
}
