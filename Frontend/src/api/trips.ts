import { api } from './client';
import type {
  CreateTripRequest,
  TripMemberResponse,
  TripResponse,
  TripSummaryResponse,
  UpdateTripRequest,
} from '@/types/api';

export const tripsApi = {
  create: (body: CreateTripRequest) => api.post<TripResponse>('/trips', body).then((r) => r.data),
  list: () => api.get<TripSummaryResponse[]>('/trips').then((r) => r.data),
  get: (id: string) => api.get<TripResponse>(`/trips/${id}`).then((r) => r.data),
  update: (id: string, body: UpdateTripRequest) =>
    api.patch<TripResponse>(`/trips/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/trips/${id}`),
  members: (id: string) => api.get<TripMemberResponse[]>(`/trips/${id}/members`).then((r) => r.data),
  removeMember: (id: string, userId: string) => api.delete(`/trips/${id}/members/${userId}`),
  leave: (id: string) => api.delete(`/trips/${id}/members/me`),
};
