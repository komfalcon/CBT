import axios from 'axios';
import {
  BillingLog,
  MaintenanceStatusResponse,
  OverviewStats,
  PaginatedResult,
  ToggleMaintenanceResponse,
  UserAccount,
} from '../../pages/admin/types';

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');

export const adminClient = axios.create({
  baseURL: `${apiBase}/admin`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getOverviewStats(): Promise<OverviewStats> {
  const { data } = await adminClient.get<OverviewStats>('/stats/overview');
  return data;
}

export async function getMaintenanceStatus(): Promise<MaintenanceStatusResponse> {
  try {
    const { data } = await adminClient.get<MaintenanceStatusResponse>('/maintenance/status');
    return data;
  } catch {
    // Fallback to public status route
    const { data } = await axios.get<MaintenanceStatusResponse>(`${apiBase}/system/maintenance-status`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    return data;
  }
}

export async function toggleMaintenance(
  password?: string,
  isMaintenance?: boolean,
): Promise<ToggleMaintenanceResponse> {
  const { data } = await adminClient.post<ToggleMaintenanceResponse>('/maintenance/toggle', {
    password: password || undefined,
    isMaintenance,
  });
  return data;
}

export async function getCandidates(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<PaginatedResult<UserAccount>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.search) query.append('search', params.search);
  if (params.role) query.append('role', params.role);
  if (params.status) query.append('status', params.status);

  const { data } = await adminClient.get<PaginatedResult<UserAccount>>(`/users?${query.toString()}`);
  return data;
}

export async function updateCandidateStatus(
  userId: string,
  status: 'active' | 'suspended',
): Promise<{ success: boolean; message?: string }> {
  const { data } = await adminClient.patch(`/users/${userId}/status`, { status });
  return data;
}

export async function generateCbtKeys(count: number): Promise<string[]> {
  const { data } = await adminClient.post<string[]>('/cbt-keys/generate', { count });
  return data;
}

export async function getVouchers(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResult<UserAccount>> {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 10).toString(),
    role: 'student',
    search: params.search || 'voucher-',
  });

  const { data } = await adminClient.get<PaginatedResult<UserAccount>>(`/users?${query.toString()}`);
  return data;
}

export async function getBillingLedger(params: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResult<BillingLog>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());

  const { data } = await adminClient.get<PaginatedResult<BillingLog>>(`/billing/logs?${query.toString()}`);
  return data;
}
