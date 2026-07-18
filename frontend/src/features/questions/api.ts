import axios from 'axios';

const baseURL = `${import.meta.env.VITE_API_BASE_URL ?? '/api'}`;

const questionApi = axios.create({
  baseURL: `${baseURL}/questions`,
});

export type QuestionOption = {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  image_url?: string;
};

export type QuestionRecord = {
  questionId: string;
  subject: string;
  topic: string;
  question_text: string;
  difficulty_level: number;
  status: string;
  options?: QuestionOption[];
  correct_option?: string;
  created_at?: string;
};

export type PaginatedQuestions = {
  data: QuestionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function withAuth(token?: string) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}

export async function getQuestions(token: string, params?: Record<string, string | number | undefined>) {
  const { data } = await questionApi.get<PaginatedQuestions>('/', {
    ...(withAuth(token) ?? {}),
    params,
  });
  return data;
}

export async function searchQuestions(
  query: string,
  params?: Record<string, string | number | undefined>,
) {
  const { data } = await questionApi.get<PaginatedQuestions>('/search', {
    params: { q: query, ...params },
  });
  return data;
}

export async function createQuestion(
  token: string,
  payload: {
    subject: string;
    topic: string;
    question_text: string;
    options: QuestionOption[];
    correct_option: string;
    question_type: string;
    difficulty_level: number;
    tags?: string[];
  },
) {
  const { data } = await questionApi.post('/', payload, withAuth(token));
  return data;
}

export async function getQuestionStats(token: string) {
  const { data } = await questionApi.get('/stats', withAuth(token));
  return data;
}

export async function getQuestionSubjects() {
  const { data } = await questionApi.get<Array<{ subject: string; count: number }>>('/subjects');
  return data;
}

export async function getSubjectTopics(subject: string) {
  const { data } = await questionApi.get<string[]>('/topics', { params: { subject } });
  return data;
}

export async function uploadImportFile(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await questionApi.post('/import/upload', formData, {
    ...(withAuth(token) ?? {}),
    headers: {
      ...(withAuth(token)?.headers ?? {}),
      'Content-Type': 'multipart/form-data',
    },
  });
  return data as {
    importId: string;
    columns: string[];
    preview: Record<string, string>[];
    totalRows: number;
  };
}

export async function commitImport(
  token: string,
  payload: { importId: string; columnMapping: Record<string, string>; async?: boolean },
) {
  const { data } = await questionApi.post('/import/commit', payload, withAuth(token));
  return data;
}
