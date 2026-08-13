import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Heart, UserPlus, Users } from 'lucide-react';
import { notificationsApi } from '@/api/notifications';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { NotificationResponse, NotificationType } from '@/types/api';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const TYPE_ICON: Record<NotificationType, typeof Heart> = {
  POST_LIKE: Heart,
  TRIP_INVITE: UserPlus,
  INVITE_ACCEPTED: Users,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: queryKeys.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: notificationsApi.list,
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidate,
  });
  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const onItemClick = (n: NotificationResponse) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-bold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</p>
            ) : (
              items.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                      !n.read && 'bg-brand-50/60',
                    )}
                  >
                    <div className="relative shrink-0">
                      {n.actorName ? (
                        <Avatar name={n.actorName} src={n.actorAvatarUrl ?? undefined} size="sm" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          <Icon className="h-4 w-4 text-gray-500" />
                        </span>
                      )}
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
                        <Icon className="h-3 w-3 text-brand-600" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
