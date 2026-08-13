import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Mountain } from 'lucide-react';
import { invitesApi } from '@/api/invites';
import { queryKeys } from '@/lib/queryKeys';
import { EmptyState } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/lib/errors';
import { toast } from '@/stores/toastStore';

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const join = async () => {
    if (!token) return;
    setJoining(true);
    setError(null);
    try {
      await invitesApi.accept(token);
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount() });
      toast.success("You're in! Welcome to the trip.");
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError(apiErrorMessage(e));
      setJoining(false);
    }
  };

  if (error) {
    return (
      <EmptyState
        emoji="😕"
        title="Couldn't join this trip"
        subtitle={error}
        action={<Button onClick={() => navigate('/dashboard')}>Go to my trips</Button>}
      />
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
        <Mountain className="h-7 w-7 text-brand-600" />
      </div>
      <h1 className="text-xl font-bold">You've been invited to a trip</h1>
      <p className="mt-2 text-sm text-gray-500">
        Join to collaborate on the itinerary, chat, and plan together.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Button onClick={join} loading={joining}>
          {joining ? 'Joining…' : 'Join trip'}
        </Button>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
