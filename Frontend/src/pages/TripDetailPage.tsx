import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Globe2, MapPin, MessageCircle, Pencil, Share2, Trash2, Users } from 'lucide-react';
import { tripsApi } from '@/api/trips';
import { itineraryApi } from '@/api/itinerary';
import { queryKeys } from '@/lib/queryKeys';
import { useTripSocket } from '@/hooks/useTripSocket';
import { TripMap, type MapPin as Pin } from '@/components/map/TripMap';
import { ItineraryTab } from '@/features/itinerary/ItineraryTab';
import { MembersTab } from '@/features/trips/MembersTab';
import { BookingsTab } from '@/features/bookings/BookingsTab';
import { ChatTab } from '@/features/chat/ChatTab';
import { ShareTripDialog } from '@/features/explore/ShareTripDialog';
import { TripForm } from '@/features/trips/TripForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import { cn, formatDateRange, formatTime } from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';

type Tab = 'itinerary' | 'bookings' | 'chat' | 'members';

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) ?? 'itinerary';
  const [showEdit, setShowEdit] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useTripSocket(id);

  const { data: trip, isLoading, isError } = useQuery({
    queryKey: queryKeys.trip(id!),
    queryFn: () => tripsApi.get(id!),
    enabled: !!id,
  });

  const { data: days } = useQuery({
    queryKey: queryKeys.itinerary(id!),
    queryFn: () => itineraryApi.get(id!),
    enabled: !!id,
  });

  const pins: Pin[] = useMemo(
    () =>
      (days ?? []).flatMap((day) =>
        day.activities.map((a) => ({
          query: a.location,
          label: a.title,
          sublabel: `${day.date} · ${formatTime(a.startTime)}`,
        })),
      ),
    [days],
  );

  const updateTrip = useMutation({
    mutationFn: (values: Parameters<typeof tripsApi.update>[1]) => tripsApi.update(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trip(id!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      toast.success('Trip updated');
      setShowEdit(false);
    },
    onError: handleApiError,
  });

  const deleteTrip = useMutation({
    mutationFn: () => tripsApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      toast.success('Trip deleted');
      navigate('/dashboard');
    },
    onError: handleApiError,
  });

  if (isLoading) return <PageSpinner label="Loading trip…" />;
  if (isError || !trip)
    return <EmptyState emoji="🔍" title="Trip not found" subtitle="It may have been deleted, or you may not be a member." />;

  const canEdit = trip.myRole === 'OWNER' || trip.myRole === 'EDITOR';

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'itinerary', label: 'Itinerary', icon: <CalendarDays className="h-4 w-4" /> },
    { key: 'bookings', label: 'Bookings', icon: <Globe2 className="h-4 w-4" /> },
    { key: 'chat', label: 'Chat', icon: <MessageCircle className="h-4 w-4" /> },
    { key: 'members', label: `Members (${trip.memberCount})`, icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="-mt-6">
      {/* Hero: background map at the trip's location */}
      <div className="relative -mx-4 h-64 overflow-hidden sm:h-72">
        <TripMap destination={trip.destination} pins={pins} interactive={false} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2">
                {trip.status === 'PUBLISHED' && (
                  <Badge className="bg-emerald-100 text-emerald-700">On Explore</Badge>
                )}
                <Badge className="bg-white/90 text-gray-700 shadow-sm">{trip.myRole.toLowerCase()}</Badge>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">{trip.title}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-gray-600">
                {trip.destination ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destination)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-brand-700 hover:underline"
                  >
                    <MapPin className="h-4 w-4" /> {trip.destination}
                  </a>
                ) : (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Destination TBD
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" /> {formatDateRange(trip.startDate, trip.endDate)}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              {canEdit && trip.status !== 'PUBLISHED' && (
                <Button size="sm" variant="secondary" onClick={() => setShowShare(true)}>
                  <Share2 className="h-4 w-4" /> Share to Explore
                </Button>
              )}
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              )}
              {trip.myRole === 'OWNER' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Delete this trip permanently? This cannot be undone.'))
                      deleteTrip.mutate();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {trip.description && <p className="mt-4 max-w-3xl text-gray-600">{trip.description}</p>}

      {/* Tabs */}
      <div className="mt-5 flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSearchParams(t.key === 'itinerary' ? {} : { tab: t.key })}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === 'itinerary' && <ItineraryTab tripId={trip.id} canEdit={canEdit} />}
        {tab === 'bookings' && <BookingsTab trip={trip} />}
        {tab === 'chat' && <ChatTab tripId={trip.id} />}
        {tab === 'members' && <MembersTab tripId={trip.id} myRole={trip.myRole} />}
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit trip">
        <TripForm
          initial={trip}
          onSubmit={(v) => updateTrip.mutate(v)}
          submitting={updateTrip.isPending}
          submitLabel="Save changes"
        />
      </Modal>

      <ShareTripDialog trip={trip} open={showShare} onClose={() => setShowShare(false)} />
    </div>
  );
}
