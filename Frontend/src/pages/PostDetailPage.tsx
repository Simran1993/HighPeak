import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, CalendarDays, ExternalLink, Heart, MapPin, Trash2 } from 'lucide-react';
import { postsApi } from '@/api/posts';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { TripMap, type MapPin as Pin } from '@/components/map/TripMap';
import { Avatar, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { CATEGORY_META, cn, formatCost, formatDate, formatDateRange, formatTime, timeAgo } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);

  const { data: post, isLoading, isError } = useQuery({
    queryKey: queryKeys.post(postId!),
    queryFn: () => postsApi.get(postId!),
    enabled: !!postId,
  });

  const { data: days } = useQuery({
    queryKey: queryKeys.postItinerary(postId!),
    queryFn: () => postsApi.itinerary(postId!),
    enabled: !!postId,
  });

  const pins: Pin[] = useMemo(
    () =>
      (days ?? []).flatMap((day) =>
        day.activities.map((a) => ({
          query: a.location,
          label: a.title,
          sublabel: `${day.date} · ${formatTime(a.startTime)}`,
        })),
      ),
    [days],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const likeMutation = useMutation({
    mutationFn: () => (post!.likedByMe ? postsApi.unlike(post!.id) : postsApi.like(post!.id)),
    onSuccess: invalidate,
    onError: handleApiError,
  });

  const saveMutation = useMutation({
    mutationFn: () => (post!.savedByMe ? postsApi.unsave(post!.id) : postsApi.save(post!.id)),
    onSuccess: invalidate,
    onError: handleApiError,
  });

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.remove(post!.id),
    onSuccess: () => {
      invalidate();
      toast.success('Post removed from Explore');
      navigate('/explore');
    },
    onError: handleApiError,
  });

  if (isLoading) return <PageSpinner label="Loading post…" />;
  if (isError || !post)
    return <EmptyState emoji="🔍" title="Post not found" subtitle="It may have been removed by its author." />;

  const isAuthor = me?.id === post.authorId;

  return (
    <div className="-mt-6">
      {/* Hero: background map of the destination + itinerary stops */}
      <div className="relative -mx-4 h-72 overflow-hidden sm:h-80">
        <TripMap destination={post.destination} pins={pins} interactive={false} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">{post.tripTitle}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {post.destination ?? 'Destination TBD'}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" /> {formatDateRange(post.startDate, post.endDate)}
            </span>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Author + actions */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Avatar name={post.authorName} src={post.authorAvatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{post.authorName}</p>
            <p className="text-xs text-gray-500">shared {timeAgo(post.createdAt)}</p>
          </div>
          <button
            onClick={() => likeMutation.mutate()}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium',
              post.likedByMe
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:text-rose-600',
            )}
          >
            <Heart className={cn('h-4 w-4', post.likedByMe && 'fill-rose-600')} /> {post.likeCount}
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium',
              post.savedByMe
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:text-brand-700',
            )}
          >
            <Bookmark className={cn('h-4 w-4', post.savedByMe && 'fill-brand-600')} />
            {post.savedByMe ? 'Saved' : 'Save'}
          </button>
          {isAuthor && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => {
                if (confirm('Remove this post from Explore? Your trip itself is not deleted.'))
                  deleteMutation.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {post.caption && <p className="mt-4 text-gray-800">{post.caption}</p>}
        {post.tripDescription && <p className="mt-2 text-sm text-gray-500">{post.tripDescription}</p>}

        {/* Read-only itinerary */}
        <h2 className="mb-4 mt-8 text-xl font-bold">
          Itinerary <span className="text-sm font-normal text-gray-500">({post.dayCount} days)</span>
        </h2>

        {!days?.length ? (
          <EmptyState emoji="📅" title="No itinerary shared" subtitle="The author hasn't added days to this trip yet." />
        ) : (
          <ol className="relative mb-12 space-y-6 border-l-2 border-brand-100 pl-6">
            {days.map((day, idx) => (
              <li key={day.id} className="relative">
                <span className="absolute -left-[31px] flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-4 ring-gray-50">
                  {idx + 1}
                </span>
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="font-semibold">{formatDate(day.date, { weekday: 'short' })}</h3>
                    {day.notes && <p className="text-sm text-gray-500">{day.notes}</p>}
                  </div>
                  {day.activities.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-gray-400">Free day.</p>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {day.activities.map((a) => (
                        <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                          <span className="mt-0.5 w-16 shrink-0 text-sm font-medium text-gray-500">
                            {formatTime(a.startTime)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{a.title}</span>
                              {a.category && (
                                <Badge className={CATEGORY_META[a.category].color}>
                                  {CATEGORY_META[a.category].emoji} {CATEGORY_META[a.category].label}
                                </Badge>
                              )}
                              {a.cost != null && (
                                <span className="text-xs font-medium text-gray-500">{formatCost(a.cost)}</span>
                              )}
                            </div>
                            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="h-3.5 w-3.5 shrink-0" /> {a.location}
                            </p>
                            {a.notes && <p className="mt-1 text-sm text-gray-600">{a.notes}</p>}
                            {a.bookingLink && (
                              <a
                                href={a.bookingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                              >
                                Booking <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
