import { api } from './client';
import type {
  ActivityResponse,
  CreateActivityRequest,
  CreateDayRequest,
  DayResponse,
  UpdateActivityRequest,
} from '@/types/api';

export const itineraryApi = {
  get: (tripId: string) => api.get<DayResponse[]>(`/trips/${tripId}/itinerary`).then((r) => r.data),

  addDay: (tripId: string, body: CreateDayRequest) =>
    api.post<DayResponse>(`/trips/${tripId}/itinerary/days`, body).then((r) => r.data),

  deleteDay: (tripId: string, dayId: string) =>
    api.delete(`/trips/${tripId}/itinerary/days/${dayId}`),

  addActivity: (tripId: string, dayId: string, body: CreateActivityRequest) =>
    api
      .post<ActivityResponse>(`/trips/${tripId}/itinerary/days/${dayId}/activities`, body)
      .then((r) => r.data),

  updateActivity: (tripId: string, dayId: string, activityId: string, body: UpdateActivityRequest) =>
    api
      .patch<ActivityResponse>(`/trips/${tripId}/itinerary/days/${dayId}/activities/${activityId}`, body)
      .then((r) => r.data),

  deleteActivity: (tripId: string, dayId: string, activityId: string) =>
    api.delete(`/trips/${tripId}/itinerary/days/${dayId}/activities/${activityId}`),
};
