import { api } from './client';
import type { NotificationResponse } from '@/types/api';

export const notificationsApi = {
  list: () => api.get<NotificationResponse[]>('/notifications').then((r) => r.data),

  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),

  markRead: (id: string) => api.post(`/notifications/${id}/read`),

  markAllRead: () => api.post('/notifications/read-all'),
};
