import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/ai`,
  withCredentials: true,
});

export const explainQuestion = async (data: { questionId: string; questionText: string; correctAnswer: string; studentAnswer: string }) => {
  const res = await api.post('/explain', data);
  return res.data;
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
