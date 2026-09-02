import axios from 'axios';
import { normalizeExamAnswers, normalizeExamQuestions } from './sessionState';

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
  /** Stable frontend key; backend session rows may expose this as `id`. */
  questionId: string;
  id?: string;
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
  id?: string;
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
  return normalizeExamSession(data);
}

type BackendExamQuestion = Omit<ExamQuestion, 'questionId'> & {
  questionId?: string;
  id?: string;
};

/**
 * The session endpoint returns SQLite question rows, whose primary key is `id`.
 * The UI uses `questionId` for answer and review state. Normalize once at the
 * boundary so every consumer keys state by the same stable question identity.
 */
export function normalizeExamSession(session: ExamSessionRecord): ExamSessionRecord {
  const rawQuestions = (session.questions || []) as BackendExamQuestion[];
  const questions = normalizeExamQuestions(rawQuestions) as ExamQuestion[];
  const answers = normalizeExamAnswers(questions, session.answers);
  return { ...session, questions, answers };
}

export async function getExamSession(token: string, sessionId: string) {
  const { data } = await examApi.get<ExamSessionRecord>(`/sessions/${sessionId}`, withAuth(token));
  return normalizeExamSession(data);
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
  return normalizeExamSession(data);
}

export async function submitExamSession(token: string, sessionId: string) {
  const { data } = await examApi.post<any>(`/sessions/${sessionId}/submit`, {}, withAuth(token));
  return data;
}
