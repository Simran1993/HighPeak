import { api } from './client';
import type { InviteResponse } from '@/types/api';

export const invitesApi = {
  send: (tripId: string, email: string) =>
    api.post<InviteResponse>(`/trips/${tripId}/invites`, { email }).then((r) => r.data),

  pending: (tripId: string) =>
    api.get<InviteResponse[]>(`/trips/${tripId}/invites`).then((r) => r.data),

  revoke: (tripId: string, inviteId: string) => api.delete(`/trips/${tripId}/invites/${inviteId}`),

  accept: (token: string) => api.post(`/invites/${token}/accept`),
};
