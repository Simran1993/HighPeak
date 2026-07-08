import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Trash2, UserMinus } from 'lucide-react';
import { tripsApi } from '@/api/trips';
import { invitesApi } from '@/api/invites';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';
import type { MemberRole } from '@/types/api';

const roleColors: Record<MemberRole, string> = {
  OWNER: 'bg-brand-100 text-brand-700',
  EDITOR: 'bg-emerald-100 text-emerald-700',
  VIEWER: 'bg-gray-100 text-gray-600',
};

export function MembersTab({ tripId, myRole }: { tripId: string; myRole: MemberRole }) {
  const queryClient = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const canInvite = myRole === 'OWNER' || myRole === 'EDITOR';

  const { data: members, isLoading } = useQuery({
    queryKey: queryKeys.tripMembers(tripId),
    queryFn: () => tripsApi.members(tripId),
  });

  const { data: invites } = useQuery({
    queryKey: queryKeys.pendingInvites(tripId),
    queryFn: () => invitesApi.pending(tripId),
    enabled: canInvite,
  });

  const sendInvite = useMutation({
    mutationFn: () => invitesApi.send(tripId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingInvites(tripId) });
      toast.success(`Invite sent to ${email}`);
      setEmail('');
    },
    onError: handleApiError,
  });

  const revokeInvite = useMutation({
    mutationFn: (inviteId: string) => invitesApi.revoke(tripId, inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pendingInvites(tripId) }),
    onError: handleApiError,
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => tripsApi.removeMember(tripId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tripMembers(tripId) });
      toast.success('Member removed');
    },
    onError: handleApiError,
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      {canInvite && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) sendInvite.mutate();
          }}
          className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <Input
            type="email"
            required
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" loading={sendInvite.isPending}>
            <Mail className="h-4 w-4" /> Invite
          </Button>
        </form>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <h3 className="border-b border-gray-100 px-4 py-3 font-semibold">
          Members ({members?.length ?? 0})
        </h3>
        <ul className="divide-y divide-gray-50">
          {members?.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={m.name} src={m.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {m.name}
                  {m.userId === me?.id && <span className="text-gray-400"> (you)</span>}
                </p>
                <p className="truncate text-sm text-gray-500">{m.email}</p>
              </div>
              <Badge className={roleColors[m.role]}>{m.role.toLowerCase()}</Badge>
              {myRole === 'OWNER' && m.role !== 'OWNER' && (
                <button
                  title="Remove member"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => {
                    if (confirm(`Remove ${m.name} from this trip?`)) removeMember.mutate(m.userId);
                  }}
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {canInvite && !!invites?.length && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <h3 className="border-b border-gray-100 px-4 py-3 font-semibold">Pending invites</h3>
          <ul className="divide-y divide-gray-50">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{inv.invitedEmail}</p>
                  <p className="text-sm text-gray-500">
                    Invited by {inv.invitedByName} · expires{' '}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  title="Revoke invite"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => revokeInvite.mutate(inv.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
