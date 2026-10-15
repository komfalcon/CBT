import axios from 'axios';

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
const api = axios.create({
  baseURL: `${apiBase}/auth`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type LoginResponse = {
  requiresMFA: boolean;
  accessToken?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
};

function persistAuthData(data?: LoginResponse) {
  if (!data) return;
  const token = data.accessToken || data.token;
  if (token) {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('token', token);
  }
  if (data.user?.role) {
    localStorage.setItem('user_role', data.user.role);
  }
}

export async function register(payload: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'super_admin' | 'admin' | 'examiner' | 'proctor' | 'student';
}) {
  const { data } = await api.post<{ message: string; token?: string; cbt_key?: string }>('/register', payload);
  return data;
}

export async function verifyEmail(payload: { email: string; code: string }) {
  const { data } = await api.post<{ message: string }>('/verify-email', payload);
  return data;
}

export async function resendVerification(email: string) {
  const { data } = await api.post<{ message: string }>('/resend-verification', { email });
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<LoginResponse>('/login', payload);
  persistAuthData(data);
  return data;
}

export async function verifyOtp(payload: { otp: string }) {
  const { data } = await api.post<LoginResponse>('/verify-otp', payload);
  persistAuthData(data);
  return data;
}

export async function refreshToken() {
  const { data } = await api.post<{ refreshed: boolean; accessToken?: string; token?: string }>('/refresh', {});
  if (data.accessToken || data.token) {
    const token = data.accessToken || data.token;
    localStorage.setItem('accessToken', token!);
    localStorage.setItem('token', token!);
  }
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>('/forgot-password', { email });
  return data;
}

export async function resetPassword(payload: { email: string; code: string; password: string }) {
  const { data } = await api.post<{ message: string }>('/reset-password', payload);
  return data;
}

export async function googleLogin(payload: { credential: string }) {
  const { data } = await api.post<LoginResponse>('/google', payload);
  persistAuthData(data);
  return data;
}

export async function loginWithCbtKey(payload: { cbtKey: string }) {
  const { data } = await api.post<LoginResponse>('/login/cbt-key', payload);
  persistAuthData(data);
  return data;
}

export async function getMe() {
  const { data } = await api.get<Record<string, any>>('/me');
  if (data?.role) {
    localStorage.setItem('user_role', data.role);
  }
  return data;
}

export async function updateMe(
  payload: { fullName?: string; phone?: string; exam_subject_combination?: string[] },
) {
  const { data } = await api.patch<Record<string, any>>('/me', payload);
  return data;
}

export async function logout() {
  try {
    const { data } = await api.post<{ message: string }>('/logout', {});
    return data;
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user_role');
  }
}
