import { api } from './client';
import type { AuthResponse } from '@/types/api';

export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register', body).then((r) => r.data),

  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body).then((r) => r.data),

  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};
