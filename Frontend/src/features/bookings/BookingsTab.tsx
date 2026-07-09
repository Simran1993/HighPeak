import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Info, Plus } from 'lucide-react';
import { itineraryApi } from '@/api/itinerary';
import { queryKeys } from '@/lib/queryKeys';
import { BOOKING_GROUPS, type BookingContext } from '@/lib/bookingLinks';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AddBookingModal } from './AddBookingModal';
import { CATEGORY_META, formatCost, formatDate, formatTime } from '@/lib/utils';
import type { TripResponse } from '@/types/api';

/**
 * Booking hub:
 *  1. Deep-links to real providers pre-filled with the trip's destination/dates.
 *  2. A tracker listing every ACCOMMODATION / TRANSPORT activity in the
 *     itinerary (your "booked things"), with costs and confirmation links.
 *
 * To track a booking, add it as an itinerary activity with the right category
 * and paste the confirmation URL into its booking link.
 */
export function BookingsTab({ trip }: { trip: TripResponse }) {
  const [tab, setTab] = useState<(typeof BOOKING_GROUPS)[number]['key']>('stays');
  const [showAdd, setShowAdd] = useState(false);
  const canEdit = trip.myRole === 'OWNER' || trip.myRole === 'EDITOR';
  const ctx: BookingContext = {
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
  };

  const { data: days } = useQuery({
    queryKey: queryKeys.itinerary(trip.id),
    queryFn: () => itineraryApi.get(trip.id),
  });

  const bookings = useMemo(
    () =>
      (days ?? []).flatMap((day) =>
        day.activities
          .filter((a) => a.category === 'ACCOMMODATION' || a.category === 'TRANSPORT')
          .map((a) => ({ ...a, date: day.date })),
      ),
    [days],
  );

  const bookedTotal = bookings.reduce((sum, b) => sum + (b.cost ?? 0), 0);
  const group = BOOKING_GROUPS.find((g) => g.key === tab)!;

  return (
    <div className="space-y-6">
      {/* Provider deep links */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Find & book</h3>
        <p className="mb-4 mt-0.5 text-sm text-gray-500">
          Opens the provider pre-filled with{' '}
          <span className="font-medium text-gray-700">{trip.destination ?? 'your destination'}</span>
          {trip.startDate && ` · ${formatDate(trip.startDate)} → ${formatDate(trip.endDate)}`}
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {BOOKING_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setTab(g.key)}
              className={
                tab === g.key
                  ? 'rounded-xl bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white'
                  : 'rounded-xl bg-gray-100 px-3.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200'
              }
            >
              {g.emoji} {g.title}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {group.providers.map((p) => (
            <a
              key={p.name}
              href={p.url(ctx)}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border border-gray-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold group-hover:text-brand-700">{p.name}</span>
                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-brand-500" />
              </div>
              <p className="mt-1 text-sm text-gray-500">{p.tagline}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Booking tracker */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h3 className="font-semibold">Booked so far</h3>
          <div className="flex items-center gap-3">
            {bookedTotal > 0 && (
              <span className="text-sm font-medium text-gray-600">Total {formatCost(bookedTotal)}</span>
            )}
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4" /> Add booking
              </Button>
            )}
          </div>
        </div>

        {!bookings.length ? (
          <div className="flex items-start gap-3 px-5 py-6 text-sm text-gray-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <p>
              Nothing tracked yet.{' '}
              {canEdit ? (
                <>
                  Hit <span className="font-medium text-gray-700">Add booking</span> to log a stay
                  or ticket you've already booked — it lands in the itinerary too. Activities with
                  the <Badge className={CATEGORY_META.ACCOMMODATION.color}>🏨 Stay</Badge> or{' '}
                  <Badge className={CATEGORY_META.TRANSPORT.color}>🚆 Transport</Badge> category
                  also show up here automatically.
                </>
              ) : (
                <>No stays or transport have been added to this trip's itinerary yet.</>
              )}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xl">{CATEGORY_META[b.category!].emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{b.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(b.date)} · {formatTime(b.startTime)} · {b.location}
                  </p>
                </div>
                {b.cost != null && (
                  <span className="text-sm font-semibold text-gray-700">{formatCost(b.cost)}</span>
                )}
                {b.bookingLink && (
                  <a
                    href={b.bookingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                  >
                    Confirmation <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddBookingModal open={showAdd} onClose={() => setShowAdd(false)} tripId={trip.id} days={days ?? []} />
    </div>
  );
}
