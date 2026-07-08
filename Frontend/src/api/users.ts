import { api } from './client';
import type { UserResponse } from '@/types/api';

export const usersApi = {
  me: () => api.get<UserResponse>('/users/me').then((r) => r.data),
};
