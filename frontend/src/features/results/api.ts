import axios from 'axios';

const baseURL = `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/results`;

const resultsApi = axios.create({
  baseURL,
});

function withAuth(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

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

export async function getResultsHistory(token: string) {
  const { data } = await resultsApi.get<GradedResultRecord[]>('/', withAuth(token));
  return data;
}

export async function getResultDetail(token: string, resultId: string) {
  const { data } = await resultsApi.get<GradedResultRecord>(`/${resultId}`, withAuth(token));
  return data;
}
