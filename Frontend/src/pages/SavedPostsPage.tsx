import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { postsApi } from '@/api/posts';
import { queryKeys } from '@/lib/queryKeys';
import { PostCard } from '@/features/explore/PostCard';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export function SavedPostsPage() {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useQuery({
    queryKey: queryKeys.savedPosts(),
    queryFn: postsApi.saved,
  });

  if (isLoading) return <PageSpinner label="Loading saved trips…" />;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Saved</h1>
        <p className="text-sm text-gray-500">Itineraries you bookmarked for later.</p>
      </div>
      {!posts?.length ? (
        <EmptyState
          emoji="🔖"
          title="Nothing saved yet"
          subtitle="Tap the bookmark on any Explore post to keep it here."
          action={<Button onClick={() => navigate('/explore')}>Browse Explore</Button>}
        />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
