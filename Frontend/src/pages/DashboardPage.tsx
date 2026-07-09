import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, Plus } from 'lucide-react';
import { tripsApi } from '@/api/trips';
import { queryKeys } from '@/lib/queryKeys';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateRange, gradientFor } from '@/lib/utils';
import type { MemberRole } from '@/types/api';

const roleColors: Record<MemberRole, string> = {
  OWNER: 'bg-brand-100 text-brand-700',
  EDITOR: 'bg-emerald-100 text-emerald-700',
  VIEWER: 'bg-gray-100 text-gray-600',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: trips, isLoading } = useQuery({ queryKey: queryKeys.trips(), queryFn: tripsApi.list });

  if (isLoading) return <PageSpinner label="Loading your trips…" />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="text-sm text-gray-500">Plan, collaborate, and share your adventures.</p>
        </div>
        <Button onClick={() => navigate('/trips/new')}>
          <Plus className="h-4 w-4" /> New trip
        </Button>
      </div>

      {!trips?.length ? (
        <EmptyState
          emoji="🗺️"
          title="No trips yet"
          subtitle="Create your first trip and start building the itinerary — or find inspiration in Explore."
          action={<Button onClick={() => navigate('/trips/new')}>Create a trip</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              to={`/trips/${trip.id}`}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`h-24 bg-gradient-to-br ${gradientFor(trip.id)} relative`}>
                <div className="absolute right-3 top-3 flex gap-1.5">
                  <Badge className={roleColors[trip.myRole]}>{trip.myRole.toLowerCase()}</Badge>
                  {trip.status === 'PUBLISHED' && (
                    <Badge className="bg-white/90 text-gray-800">posted</Badge>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold group-hover:text-brand-700">{trip.title}</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {trip.destination ?? 'Destination TBD'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateRange(trip.startDate, trip.endDate)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
