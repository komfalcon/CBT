import axios from 'axios';

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
const api = axios.create({
  baseURL: `${apiBase}/ai`,
  withCredentials: true,
});

export type ExplanationResponse = { explanation: string; remainingCoins: number; nextResetDate: string; reportable?: boolean };

export const explainQuestion = async (data: { questionId: string; questionText: string; correctAnswer: string; studentAnswer: string }): Promise<ExplanationResponse> => {
  const res = await api.post('/explain', data);
  return res.data as ExplanationResponse;
};

export const reportExplanation = async (questionId: string, reason?: string) => {
  const res = await api.post(`/explanations/${questionId}/report`, { reason });
  return res.data as { reported: boolean; flagged: boolean; reportCount: number };
};

export const getChatSessions = async () => {
  const res = await api.get('/sessions');
  return res.data;
};

export const createChatSession = async (data: { title: string }) => {
  const res = await api.post('/sessions', data);
  return res.data;
};

export const getChatSession = async (sessionId: string) => {
  const res = await api.get(`/sessions/${sessionId}`);
  return res.data;
};

export const deleteChatSession = async (sessionId: string) => {
  const res = await api.delete(`/sessions/${sessionId}`);
  return res.data;
};

export const chatWithTutor = async (data: { message: string; history: any[]; contextPayload?: string; sessionId?: string }) => {
  const res = await api.post('/chat', data);
  return res.data;
};

export const generateQuestionDiagram = async (questionId: string) => {
  const res = await api.post(`/generate-diagram/${questionId}`);
  return res.data as { svg: string };
};
