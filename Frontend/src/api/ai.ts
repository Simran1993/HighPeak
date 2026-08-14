import { api } from './client';
import type { DayResponse, GenerateItineraryRequest } from '@/types/api';

export const aiApi = {
  generateItinerary: (tripId: string, body: GenerateItineraryRequest) =>
    api.post<DayResponse[]>(`/trips/${tripId}/ai/itinerary`, body).then((r) => r.data),
};
