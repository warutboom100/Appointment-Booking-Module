import { api } from './client';
import type { SafeUser, LoginResponse, RegisterInput, ApiResponse } from '@/types';

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
    username,
    password,
  });
  return data.data;
}

export async function registerApi(input: RegisterInput): Promise<SafeUser> {
  const { data } = await api.post<ApiResponse<SafeUser>>('/auth/register', input);
  return data.data;
}

export async function logoutApi(): Promise<void> {
  await api.post('/auth/logout');
}

export async function refreshTokenApi(): Promise<{ accessToken: string }> {
  const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
  return data.data;
}
