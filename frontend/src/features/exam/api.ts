import axios from 'axios';

const baseURL = `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/exam`;

const examApi = axios.create({
  baseURL,
});

function withAuth(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export type ExamQuestionOption = {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  image_url?: string;
};

export type ExamQuestion = {
  questionId: string;
  subject: string;
  topic: string;
  subtopic?: string;
  question_text: string;
  options: ExamQuestionOption[];
  difficulty_level: number;
  question_type: string;
  has_diagram?: boolean;
  diagram_svg?: string | null;
  latex?: string | null;
};

export type ExamSessionRecord = {
  sessionId: string;
  userId: string;
  type: 'mock' | 'drill';
  subjects: string[];
  questions: ExamQuestion[];
  answers: Record<string, string>;
  timeRemaining: number;
  status: 'active' | 'completed' | 'expired';
  startedAt: string;
  warnings?: string[];
};

export async function createExamSession(
  token: string,
  payload: { type: 'mock' | 'drill'; subject?: string; count?: number; difficultyLevel?: string; topics?: string[] },
) {
  const { data } = await examApi.post<ExamSessionRecord>('/sessions', payload, withAuth(token));
  return data;
}

export async function getExamSession(token: string, sessionId: string) {
  const { data } = await examApi.get<ExamSessionRecord>(`/sessions/${sessionId}`, withAuth(token));
  return data;
}

export async function saveExamAnswers(
  token: string,
  sessionId: string,
  answers: Record<string, string>,
  timeRemaining: number,
) {
  const { data } = await examApi.post<ExamSessionRecord>(
    `/sessions/${sessionId}/answers`,
    { answers, timeRemaining },
    withAuth(token),
  );
  return data;
}

export async function submitExamSession(token: string, sessionId: string) {
  const { data } = await examApi.post<any>(`/sessions/${sessionId}/submit`, {}, withAuth(token));
  return data;
}
