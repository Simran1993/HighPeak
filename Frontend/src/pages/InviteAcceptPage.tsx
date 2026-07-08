import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { invitesApi } from '@/api/invites';
import { queryKeys } from '@/lib/queryKeys';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/lib/errors';
import { toast } from '@/stores/toastStore';

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    invitesApi
      .accept(token)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
        toast.success("You're in! Welcome to the trip.");
        navigate('/dashboard', { replace: true });
      })
      .catch((e) => setError(apiErrorMessage(e)));
  }, [token, navigate, queryClient]);

  if (error) {
    return (
      <EmptyState
        emoji="😕"
        title="Couldn't accept this invite"
        subtitle={error}
        action={<Button onClick={() => navigate('/dashboard')}>Go to my trips</Button>}
      />
    );
  }
  return <PageSpinner label="Accepting invite…" />;
}
