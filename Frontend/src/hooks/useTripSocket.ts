import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { WS_URL } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';
import type { TripEvent } from '@/types/api';

/**
 * Live collaboration: subscribes to /topic/trips/{tripId} and invalidates
 * the relevant React Query caches when other members change things.
 */
export function useTripSocket(tripId: string | undefined) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!tripId || !accessToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/trips/${tripId}`, (message) => {
          const event: TripEvent = JSON.parse(message.body);
          switch (event.type) {
            case 'TRIP_UPDATED':
              queryClient.invalidateQueries({ queryKey: queryKeys.trip(tripId) });
              break;
            case 'MEMBER_ADDED':
            case 'MEMBER_REMOVED':
            case 'MEMBER_LEFT':
              queryClient.invalidateQueries({ queryKey: queryKeys.tripMembers(tripId) });
              queryClient.invalidateQueries({ queryKey: queryKeys.trip(tripId) });
              break;
            case 'DAY_ADDED':
            case 'DAY_DELETED':
            case 'ACTIVITY_ADDED':
            case 'ACTIVITY_UPDATED':
            case 'ACTIVITY_DELETED':
              queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) });
              break;
            case 'MESSAGE_ADDED':
              queryClient.invalidateQueries({ queryKey: queryKeys.messages(tripId) });
              break;
          }
        });
      },
    });

    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [tripId, accessToken, queryClient]);
}
