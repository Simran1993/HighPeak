import { api } from './client';
import type { ProfileResponse, UpdateProfileRequest, UserResponse } from '@/types/api';

export const usersApi = {
  me: () => api.get<UserResponse>('/users/me').then((r) => r.data),
  updateMe: (body: UpdateProfileRequest) =>
    api.patch<UserResponse>('/users/me', body).then((r) => r.data),
  profile: (id: string) => api.get<ProfileResponse>(`/users/${id}`).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<UserResponse>('/users/me/avatar', form).then((r) => r.data);
  },
};
