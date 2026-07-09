import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '@/api/trips';
import { queryKeys } from '@/lib/queryKeys';
import { TripForm } from '@/features/trips/TripForm';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';

export function NewTripPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: tripsApi.create,
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      toast.success('Trip created — time to build the itinerary!');
      navigate(`/trips/${trip.id}`);
    },
    onError: handleApiError,
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Create a trip</h1>
      <p className="mb-6 text-sm text-gray-500">
        You can invite friends and fill in the details later.
      </p>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <TripForm onSubmit={(v) => mutation.mutate(v)} submitting={mutation.isPending} submitLabel="Create trip" />
      </div>
    </div>
  );
}
