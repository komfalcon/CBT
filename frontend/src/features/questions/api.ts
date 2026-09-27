import axios from 'axios';

const baseURL = `${(import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')}`;

const questionApi = axios.create({
  baseURL: `${baseURL}/questions`,
  withCredentials: true,
});

questionApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
  explanation?: string;
  tags?: string[];
  year_sourced?: number;
  created_at?: string;
};

export type PaginatedQuestions = {
  data: QuestionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function withAuth(token?: string): { headers?: Record<string, string> } {
  const activeToken = token || localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (activeToken) {
    return { headers: { Authorization: `Bearer ${activeToken}` } };
  }
  return {};
}

export async function getQuestions(token?: string, params?: Record<string, string | number | undefined>) {
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
  token: string | undefined,
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

export async function getQuestionStats(token?: string) {
  const { data } = await questionApi.get('/stats', withAuth(token));
  return data;
}

export async function getQuestionSubjects() {
  const { data } = await questionApi.get<Array<{ subject: string; count: number }>>('/subjects');
  return data;
}

export async function getSubjectTopics(subject: string) {
  const { data } = await questionApi.get<Array<{ topic: string; count: number }>>('/topics', {
    params: { subject },
  });
  return data;
}

export async function uploadImportFile(token: string | undefined, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const authHeader = withAuth(token)?.headers ?? {};
  const { data } = await questionApi.post('/import/upload', formData, {
    headers: {
      ...authHeader,
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
  token: string | undefined,
  payload: { importId: string; columnMapping: Record<string, string>; async?: boolean },
) {
  const { data } = await questionApi.post('/import/commit', payload, withAuth(token));
  return data;
}

export async function triggerAiGeneration(
  token: string | undefined,
  payload: {
    subject: string;
    sourceType?: 'new_text' | 'new_svg_diagram' | 'calculation_latex' | 'passage_comprehension' | 'mixed_curriculum';
    targetCount?: number;
    topics?: string[];
  },
) {
  const { data } = await questionApi.post('/ai-generate', payload, withAuth(token));
  return data;
}

export async function stopAiGeneration(token: string | undefined) {
  const { data } = await questionApi.post('/stop-ai-generate', {}, withAuth(token));
  return data;
}

export async function getAiGenerationStatus(token?: string) {
  const { data } = await questionApi.get('/ai-generate-status', withAuth(token));
  return data;
}

export async function triggerPdfScan(
  token: string | undefined,
  directoryPath?: string,
) {
  const { data } = await questionApi.post(
    '/scan-pdf',
    { directoryPath: directoryPath || 'C:\\Users\\DELL\\Downloads\\PQ' },
    withAuth(token),
  );
  return data;
}

export async function getPdfScanStatus(token?: string) {
  const { data } = await questionApi.get('/scan-pdf-status', withAuth(token));
  return data;
}

export async function uploadAndScanPdfFile(token: string | undefined, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const authHeader = withAuth(token)?.headers ?? {};
  const { data } = await questionApi.post('/scan-pdf-file', formData, {
    headers: {
      ...authHeader,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data as { success: boolean; extractedCount: number; message: string };
}


