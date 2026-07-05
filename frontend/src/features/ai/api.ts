import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/ai`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const explainQuestion = async (data: { questionId: string; questionText: string; correctAnswer: string; studentAnswer: string }) => {
  const res = await api.post('/explain', data);
  return res.data;
};

export const chatWithTutor = async (data: { message: string; history: any[]; contextPayload?: string }) => {
  const res = await api.post('/chat', data);
  return res.data;
};
