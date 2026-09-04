import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/auth`,
  withCredentials: true,
});

export type LoginResponse = { requiresMFA: boolean };

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

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<LoginResponse>('/login', payload);
  return data;
}

export async function verifyOtp(payload: { otp: string }) {
  const { data } = await api.post<LoginResponse>('/verify-otp', payload);
  return data;
}

export async function refreshToken() {
  const { data } = await api.post<{ refreshed: boolean }>('/refresh', {});
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
  return data;
}

export async function loginWithCbtKey(payload: { cbtKey: string }) {
  const { data } = await api.post<LoginResponse>('/login/cbt-key', payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get<Record<string, any>>('/me');
  return data;
}

export async function updateMe(
  payload: { fullName?: string; phone?: string; exam_subject_combination?: string[] },
) {
  const { data } = await api.patch<Record<string, any>>('/me', payload);
  return data;
}

export async function logout() {
  const { data } = await api.post<{ message: string }>('/logout', {});
  return data;
}
