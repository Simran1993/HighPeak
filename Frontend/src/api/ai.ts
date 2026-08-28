import { api } from './client';
import type { AiItinerarySuggestion, DayResponse, GenerateItineraryRequest } from '@/types/api';

export const aiApi = {
  /** Step 1 — get a proposed itinerary without saving anything. */
  suggest: (tripId: string, body: GenerateItineraryRequest) =>
    api
      .post<AiItinerarySuggestion>(`/trips/${tripId}/ai/itinerary/suggest`, body)
      .then((r) => r.data),

  /** Step 2 — commit a proposal the user confirmed. */
  apply: (tripId: string, suggestion: AiItinerarySuggestion) =>
    api.post<DayResponse[]>(`/trips/${tripId}/ai/itinerary/apply`, suggestion).then((r) => r.data),

  /** Legacy one-shot generate + save. */
  generateItinerary: (tripId: string, body: GenerateItineraryRequest) =>
    api.post<DayResponse[]>(`/trips/${tripId}/ai/itinerary`, body).then((r) => r.data),
};
