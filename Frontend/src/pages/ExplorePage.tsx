import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { postsApi } from '@/api/posts';
import { queryKeys } from '@/lib/queryKeys';
import { PostCard } from '@/features/explore/PostCard';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

const PAGE_SIZE = 10;

export function ExplorePage() {
  const navigate = useNavigate();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: queryKeys.feed(),
    queryFn: ({ pageParam }) => postsApi.feed(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => (lastPage.length === PAGE_SIZE ? pages.length : undefined),
  });

  if (isLoading) return <PageSpinner label="Loading the feed…" />;

  const posts = data?.pages.flat() ?? [];

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="text-sm text-gray-500">
          Real itineraries from real travelers. Find one you love, then plan your own version.
        </p>
      </div>

      {!posts.length ? (
        <EmptyState
          emoji="🌍"
          title="No posts yet"
          subtitle="Be the first! Create a trip, build the itinerary, and share it to Explore."
          action={<Button onClick={() => navigate('/trips/new')}>Create a trip</Button>}
        />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {hasNextPage && (
            <div className="flex justify-center pb-8">
              <Button variant="outline" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
