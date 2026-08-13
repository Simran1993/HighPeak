import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Loader2, Pencil, X } from 'lucide-react';
import { usersApi } from '@/api/users';
import { postsApi } from '@/api/posts';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { PostCard } from '@/features/explore/PostCard';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Avatar } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';
import type { ProfileResponse } from '@/types/api';

const SUGGESTED_INTERESTS = [
  'Backpacking', 'Hiking', 'Food tours', 'Photography', 'Beaches', 'Mountains',
  'Road trips', 'Solo travel', 'Budget travel', 'Luxury stays', 'Museums',
  'Nightlife', 'Camping', 'Scuba diving', 'Skiing', 'Wildlife', 'Temples',
];

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.string().max(1000, 'Bio must be at most 1000 characters').optional(),
});
type FormValues = z.infer<typeof schema>;

function InterestsEditor({
  interests,
  onChange,
}: {
  interests: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = (value: string) => {
    const v = value.trim().slice(0, 30);
    if (!v) return;
    if (interests.length >= 20) return;
    if (interests.some((i) => i.toLowerCase() === v.toLowerCase())) return;
    onChange([...interests, v]);
    setDraft('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {interests.map((i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
          >
            {i}
            <button type="button" onClick={() => onChange(interests.filter((x) => x !== i))}>
              <X className="h-3 w-3 text-brand-400 hover:text-brand-700" />
            </button>
          </span>
        ))}
      </div>
      <Input
        className="mt-2"
        placeholder="Type an interest and press Enter (e.g. Hiking)"
        value={draft}
        maxLength={30}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          }
        }}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTED_INTERESTS.filter(
          (s) => !interests.some((i) => i.toLowerCase() === s.toLowerCase()),
        )
          .slice(0, 8)
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 hover:border-brand-400 hover:text-brand-600"
            >
              + {s}
            </button>
          ))}
      </div>
    </div>
  );
}

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
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { name: profile.name, bio: profile.bio ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => usersApi.updateMe({ name: v.name, bio: v.bio ?? '', interests }),
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
        <Field label={`Interests (${interests.length}/20)`}>
          <InterestsEditor interests={interests} onChange={setInterests} />
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
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
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

  const avatarUpload = useMutation({
    mutationFn: usersApi.uploadAvatar,
    onSuccess: (updated) => {
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(updated.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Profile picture updated');
    },
    onError: handleApiError,
  });

  if (isLoading) return <PageSpinner label="Loading profile…" />;
  if (isError || !profile)
    return <EmptyState emoji="🔍" title="Profile not found" subtitle="This user may no longer exist." />;

  const totalLikes = (posts ?? []).reduce((sum, p) => sum + p.likeCount, 0);

  return (
    <div className="mx-auto max-w-xl">
      {/* Instagram-style header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Avatar with upload */}
          <div className="relative shrink-0">
            <span className="block rounded-full bg-gradient-to-tr from-brand-500 via-sky-400 to-emerald-400 p-[3px]">
              <span className="block rounded-full bg-white p-[3px]">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
                  />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white sm:h-24 sm:w-24">
                    {profile.name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                )}
              </span>
            </span>
            {isMe && (
              <>
                <button
                  title="Change profile picture"
                  onClick={() => avatarInput.current?.click()}
                  disabled={avatarUpload.isPending}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-md ring-2 ring-white hover:bg-brand-700"
                >
                  {avatarUpload.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 10 * 1024 * 1024) {
                      handleApiError(new Error('Image exceeds the 10 MB limit'));
                    } else if (f) {
                      avatarUpload.mutate(f);
                    }
                    e.target.value = '';
                  }}
                />
              </>
            )}
          </div>

          {/* Name + stats */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-xl font-bold">{profile.name}</h1>
              {isMe && (
                <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit profile
                </Button>
              )}
            </div>
            <div className="mt-3 flex gap-6 text-sm">
              <span>
                <strong className="block text-base">{posts?.length ?? 0}</strong>
                <span className="text-gray-500">posts</span>
              </span>
              <span>
                <strong className="block text-base">{totalLikes}</strong>
                <span className="text-gray-500">likes</span>
              </span>
              <span>
                <strong className="block text-base">
                  {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </strong>
                <span className="text-gray-500">joined</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">{profile.bio}</p>
        ) : (
          isMe && (
            <p className="mt-4 text-sm italic text-gray-400">
              No bio yet — tell other travelers who you are.
            </p>
          )
        )}

        {/* Interests */}
        {profile.interests.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.interests.map((i) => (
              <span
                key={i}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
              >
                {i}
              </span>
            ))}
          </div>
        ) : (
          isMe && (
            <button
              onClick={() => setShowEdit(true)}
              className="mt-4 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-brand-400 hover:text-brand-600"
            >
              + Add your travel interests
            </button>
          )
        )}
      </div>

      {/* Notifications (own profile only) */}
      {isMe && (
        <div className="mt-8">
          <NotificationCenter />
        </div>
      )}

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
