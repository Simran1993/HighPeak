import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { WS_URL } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/stores/toastStore';
import type { NotificationResponse } from '@/types/api';

/**
 * Subscribes to the current user's private notification queue
 * (/user/queue/notifications). New notifications refresh the bell's caches
 * and surface a toast.
 */
export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', (message) => {
          const notification: NotificationResponse = JSON.parse(message.body);
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
          queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() });
          toast.info(notification.message);
        });
      },
    });

    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [accessToken, queryClient]);
}
