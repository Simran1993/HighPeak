import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Pencil } from 'lucide-react';
import { usersApi } from '@/api/users';
import { postsApi } from '@/api/posts';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { PostCard } from '@/features/explore/PostCard';
import { Avatar } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';
import type { ProfileResponse } from '@/types/api';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional(),
  avatarUrl: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function EditProfileModal({
  profile,
  open,
  onClose,
}: {
  profile: ProfileResponse;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: profile.name,
      bio: profile.bio ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      usersApi.updateMe({ name: v.name, bio: v.bio ?? '', avatarUrl: v.avatarUrl ?? '' }),
    onSuccess: (me) => {
      setUser(me);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(me.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Profile updated');
      onClose();
    },
    onError: handleApiError,
  });

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Field label="Name" error={formState.errors.name?.message}>
          <Input {...register('name')} />
        </Field>
        <Field label="Bio" error={formState.errors.bio?.message}>
          <Textarea
            placeholder="Budget backpacker · 23 countries · always chasing mountains 🏔️"
            {...register('bio')}
          />
        </Field>
        <Field label="Avatar image URL (optional)">
          <Input placeholder="https://…" {...register('avatarUrl')} />
        </Field>
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Save profile
        </Button>
      </form>
    </Modal>
  );
}

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const me = useAuthStore((s) => s.user);
  const [showEdit, setShowEdit] = useState(false);
  const isMe = me?.id === userId;

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: queryKeys.profile(userId!),
    queryFn: () => usersApi.profile(userId!),
    enabled: !!userId,
  });

  const { data: posts } = useQuery({
    queryKey: queryKeys.authorPosts(userId!),
    queryFn: () => postsApi.byAuthor(userId!),
    enabled: !!userId,
  });

  if (isLoading) return <PageSpinner label="Loading profile…" />;
  if (isError || !profile)
    return <EmptyState emoji="🔍" title="Profile not found" subtitle="This user may no longer exist." />;

  const totalLikes = (posts ?? []).reduce((sum, p) => sum + p.likeCount, 0);

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar name={profile.name} src={profile.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Joined {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          </div>
          {isMe && (
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4" /> Edit profile
            </Button>
          )}
        </div>

        {profile.bio ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{profile.bio}</p>
        ) : (
          isMe && (
            <p className="mt-4 text-sm italic text-gray-400">
              No bio yet — tell other travelers who you are.
            </p>
          )
        )}

        <div className="mt-4 flex gap-6 border-t border-gray-100 pt-4 text-sm">
          <span>
            <strong>{posts?.length ?? 0}</strong>{' '}
            <span className="text-gray-500">post{posts?.length === 1 ? '' : 's'}</span>
          </span>
          <span>
            <strong>{totalLikes}</strong> <span className="text-gray-500">likes received</span>
          </span>
        </div>
      </div>

      {/* Posts */}
      <h2 className="mb-4 mt-8 text-lg font-bold">{isMe ? 'My posts' : 'Posts'}</h2>
      {!posts?.length ? (
        <EmptyState
          emoji="📭"
          title={isMe ? "You haven't posted yet" : 'No posts yet'}
          subtitle={
            isMe
              ? 'Open one of your trips and hit "Share to Explore" to publish its itinerary.'
              : "This traveler hasn't shared any itineraries."
          }
        />
      ) : (
        <div className="space-y-6 pb-10">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {isMe && <EditProfileModal profile={profile} open={showEdit} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
