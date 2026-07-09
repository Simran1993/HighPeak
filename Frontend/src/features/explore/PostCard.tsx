import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, CalendarDays, Heart, MapPin, Trash2 } from 'lucide-react';
import { postsApi } from '@/api/posts';
import { Avatar } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { cn, formatDateRange, gradientFor, timeAgo, tripDurationDays } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';
import type { PostResponse } from '@/types/api';

/**
 * Instagram-style post card: cover visual, author row, like/save actions,
 * caption — plus a "View itinerary" affordance, because that's the point.
 */
export function PostCard({ post }: { post: PostResponse }) {
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const isMine = me?.id === post.authorId;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['posts'] });

  const likeMutation = useMutation({
    mutationFn: () => (post.likedByMe ? postsApi.unlike(post.id) : postsApi.like(post.id)),
    onSuccess: invalidate,
    onError: handleApiError,
  });

  const saveMutation = useMutation({
    mutationFn: () => (post.savedByMe ? postsApi.unsave(post.id) : postsApi.save(post.id)),
    onSuccess: invalidate,
    onError: handleApiError,
  });

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.remove(post.id),
    onSuccess: () => {
      invalidate();
      toast.success('Post removed from Explore');
    },
    onError: handleApiError,
  });

  const duration = tripDurationDays(post.startDate, post.endDate);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/users/${post.authorId}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={post.authorName} src={post.authorAvatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold hover:text-brand-700">{post.authorName}</p>
            <p className="truncate text-xs text-gray-500">
              {post.destination ?? 'Somewhere'} · {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
        {isMine && (
          <button
            title="Delete post"
            className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-600"
            onClick={() => {
              if (confirm('Remove this post from Explore? Your trip itself is not deleted.'))
                deleteMutation.mutate();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Cover */}
      <Link to={`/explore/${post.id}`} className="block">
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.tripTitle}
            className="aspect-[16/10] w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              'relative flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br p-6',
              gradientFor(post.id),
            )}
          >
            <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_25%_25%,white_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
            <h3 className="relative max-w-full break-words text-center text-2xl font-extrabold text-white drop-shadow">
              {post.tripTitle}
            </h3>
          </div>
        )}
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          onClick={() => likeMutation.mutate()}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium transition-colors',
            post.likedByMe ? 'text-rose-600' : 'text-gray-600 hover:text-rose-600',
          )}
        >
          <Heart className={cn('h-5 w-5', post.likedByMe && 'fill-rose-600')} />
          {post.likeCount}
        </button>
        <button
          onClick={() => saveMutation.mutate()}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium transition-colors',
            post.savedByMe ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600',
          )}
        >
          <Bookmark className={cn('h-5 w-5', post.savedByMe && 'fill-brand-600')} />
          {post.saveCount}
        </button>
        <Link
          to={`/explore/${post.id}`}
          className="ml-auto rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
        >
          View itinerary →
        </Link>
      </div>

      {/* Caption & meta */}
      <div className="space-y-1.5 px-4 pb-4 pt-2">
        {post.caption && (
          <p className="text-sm text-gray-800">
            <span className="font-semibold">{post.authorName}</span> {post.caption}
          </p>
        )}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {post.destination ?? 'TBD'}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDateRange(post.startDate, post.endDate)}
          </span>
          <span>
            {post.dayCount} day{post.dayCount === 1 ? '' : 's'} planned
            {duration ? ` · ${duration}-day trip` : ''}
          </span>
        </p>
      </div>
    </article>
  );
}
