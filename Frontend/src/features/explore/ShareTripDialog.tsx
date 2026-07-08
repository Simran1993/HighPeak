import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { postsApi } from '@/api/posts';
import { queryKeys } from '@/lib/queryKeys';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';
import type { TripResponse } from '@/types/api';

export function ShareTripDialog({
  trip,
  open,
  onClose,
}: {
  trip: TripResponse;
  open: boolean;
  onClose: () => void;
}) {
  const [caption, setCaption] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () =>
      postsApi.create({
        tripId: trip.id,
        caption: caption || undefined,
        coverImageUrl: coverImageUrl || undefined,
      }),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
      queryClient.invalidateQueries({ queryKey: queryKeys.trip(trip.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripPost(trip.id) });
      toast.success('Your trip is live on Explore! 🎉');
      onClose();
      navigate(`/explore/${post.id}`);
    },
    onError: handleApiError,
  });

  return (
    <Modal open={open} onClose={onClose} title="Share to Explore">
      <p className="mb-4 text-sm text-gray-500">
        Posting <span className="font-medium text-gray-800">{trip.title}</span> makes its itinerary
        visible to everyone on HighPeak. Other travelers can view it day by day, like it, and save
        it for their own plans.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <Field label="Caption">
          <Textarea
            placeholder="10 days across Japan on a budget — temples, ramen, and the world's best trains 🍜"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={2000}
          />
        </Field>
        <Field label="Cover image URL (optional)">
          <Input
            placeholder="https://images.example.com/photo.jpg"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Post to Explore
        </Button>
      </form>
    </Modal>
  );
}
