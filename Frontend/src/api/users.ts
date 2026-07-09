import { api } from './client';
import type { ProfileResponse, UpdateProfileRequest, UserResponse } from '@/types/api';

export const usersApi = {
  me: () => api.get<UserResponse>('/users/me').then((r) => r.data),
  updateMe: (body: UpdateProfileRequest) =>
    api.patch<UserResponse>('/users/me', body).then((r) => r.data),
  profile: (id: string) => api.get<ProfileResponse>(`/users/${id}`).then((r) => r.data),
};
