import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/auth`,
});

export type LoginResponse = {
  requiresMFA: boolean;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
};

export async function register(payload: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'super_admin' | 'admin' | 'examiner' | 'proctor' | 'student';
}) {
  const { data } = await api.post<{ message: string }>('/register', payload);
  return data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.post<{ message: string }>('/verify-email', { token });
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<LoginResponse>('/login', payload);
  return data;
}

export async function verifyOtp(payload: { tempToken: string; otp: string }) {
  const { data } = await api.post<LoginResponse>('/verify-otp', payload);
  return data;
}

export async function refreshToken(refreshToken: string) {
  const { data } = await api.post<{ accessToken: string; refreshToken: string }>('/refresh', {
    refreshToken,
  });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>('/forgot-password', { email });
  return data;
}
