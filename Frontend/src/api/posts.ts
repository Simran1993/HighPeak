import { api } from './client';
import type { CreatePostRequest, DayResponse, PostResponse, UpdatePostRequest } from '@/types/api';

export const postsApi = {
  feed: (page = 0, size = 20) =>
    api.get<PostResponse[]>('/posts', { params: { page, size } }).then((r) => r.data),

  mine: () => api.get<PostResponse[]>('/posts/mine').then((r) => r.data),
  saved: () => api.get<PostResponse[]>('/posts/saved').then((r) => r.data),
  get: (id: string) => api.get<PostResponse>(`/posts/${id}`).then((r) => r.data),
  byTrip: (tripId: string) => api.get<PostResponse>(`/posts/by-trip/${tripId}`).then((r) => r.data),
  itinerary: (id: string) => api.get<DayResponse[]>(`/posts/${id}/itinerary`).then((r) => r.data),

  create: (body: CreatePostRequest) => api.post<PostResponse>('/posts', body).then((r) => r.data),
  update: (id: string, body: UpdatePostRequest) =>
    api.patch<PostResponse>(`/posts/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/posts/${id}`),

  like: (id: string) => api.post(`/posts/${id}/like`),
  unlike: (id: string) => api.delete(`/posts/${id}/like`),
  save: (id: string) => api.post(`/posts/${id}/save`),
  unsave: (id: string) => api.delete(`/posts/${id}/save`),
};
