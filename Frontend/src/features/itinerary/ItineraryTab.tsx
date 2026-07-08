import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus, ExternalLink, MapPin, Pencil, Plane, Trash2 } from 'lucide-react';
import { itineraryApi } from '@/api/itinerary';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner, EmptyState } from '@/components/ui/Spinner';
import {
  CATEGORY_META,
  extractFlightCode,
  formatCost,
  formatDate,
  formatDuration,
  formatTime,
  isOvernight,
} from '@/lib/utils';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';
import type { ActivityCategory, ActivityResponse, DayResponse } from '@/types/api';

const CATEGORIES = Object.keys(CATEGORY_META) as ActivityCategory[];

const activitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().min(1, 'Time is required'),
  endTime: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  notes: z.string().min(1, 'Notes are required'),
  cost: z.string().optional(),
  category: z.string().optional(),
  bookingLink: z.string().optional(),
});
type ActivityFormValues = z.infer<typeof activitySchema>;

function toRequest(v: ActivityFormValues) {
  return {
    title: v.title,
    startTime: v.startTime.length === 5 ? `${v.startTime}:00` : v.startTime,
    endTime: v.endTime ? (v.endTime.length === 5 ? `${v.endTime}:00` : v.endTime) : null,
    location: v.location,
    notes: v.notes,
    cost: v.cost ? Number(v.cost) : null,
    category: (v.category || null) as ActivityCategory | null,
    bookingLink: v.bookingLink || null,
  };
}

function ActivityFormModal({
  open,
  onClose,
  tripId,
  dayId,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  tripId: string;
  dayId: string;
  editing?: ActivityResponse | null;
}) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState, reset } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    values: editing
      ? {
          title: editing.title,
          startTime: editing.startTime.slice(0, 5),
          endTime: editing.endTime?.slice(0, 5) ?? '',
          location: editing.location,
          notes: editing.notes,
          cost: editing.cost != null ? String(editing.cost) : '',
          category: editing.category ?? '',
          bookingLink: editing.bookingLink ?? '',
        }
      : { title: '', startTime: '', endTime: '', location: '', notes: '', cost: '', category: '', bookingLink: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: ActivityFormValues) =>
      editing
        ? itineraryApi.updateActivity(tripId, dayId, editing.id, toRequest(v))
        : itineraryApi.addActivity(tripId, dayId, toRequest(v)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) });
      toast.success(editing ? 'Activity updated' : 'Activity added');
      reset();
      onClose();
    },
    onError: handleApiError,
  });

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit activity' : 'Add activity'} wide>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" error={formState.errors.title?.message}>
            <Input placeholder="Flight AI302 to Tokyo" {...register('title')} />
          </Field>
          <Field label="Category">
            <Select {...register('category')}>
              <option value="">— None —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Start time" error={formState.errors.startTime?.message}>
            <Input type="time" {...register('startTime')} />
          </Field>
          <Field label="End / arrival (optional)">
            <Input type="time" {...register('endTime')} />
          </Field>
          <Field label="Location" error={formState.errors.location?.message}>
            <Input placeholder="Asakusa, Tokyo" {...register('location')} />
          </Field>
        </div>
        <Field label="Notes" error={formState.errors.notes?.message}>
          <Textarea placeholder="Arrive early to avoid crowds" {...register('notes')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cost (USD, optional)">
            <Input type="number" step="0.01" min="0" placeholder="0.00" {...register('cost')} />
          </Field>
          <Field label="Booking link (optional)">
            <Input placeholder="https://…" {...register('bookingLink')} />
          </Field>
        </div>
        <Button type="submit" loading={mutation.isPending} className="w-full">
          {editing ? 'Save changes' : 'Add activity'}
        </Button>
      </form>
    </Modal>
  );
}

function AddDayForm({ tripId, onDone }: { tripId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () => itineraryApi.addDay(tripId, { date, notes: notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) });
      toast.success('Day added');
      onDone();
    },
    onError: handleApiError,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (date) mutation.mutate();
      }}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <Field label="Date">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>
      <div className="min-w-[200px] flex-1">
        <Field label="Notes (optional)">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Arrival day" />
        </Field>
      </div>
      <Button type="submit" loading={mutation.isPending}>
        Add day
      </Button>
    </form>
  );
}

export function ItineraryTab({ tripId, canEdit }: { tripId: string; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [showAddDay, setShowAddDay] = useState(false);
  const [activityModal, setActivityModal] = useState<{ dayId: string; editing: ActivityResponse | null } | null>(null);

  const { data: days, isLoading } = useQuery({
    queryKey: queryKeys.itinerary(tripId),
    queryFn: () => itineraryApi.get(tripId),
  });

  const deleteDay = useMutation({
    mutationFn: (dayId: string) => itineraryApi.deleteDay(tripId, dayId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) }),
    onError: handleApiError,
  });

  const deleteActivity = useMutation({
    mutationFn: ({ dayId, activityId }: { dayId: string; activityId: string }) =>
      itineraryApi.deleteActivity(tripId, dayId, activityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) }),
    onError: handleApiError,
  });

  if (isLoading) return <PageSpinner label="Loading itinerary…" />;

  const totalCost = (days ?? [])
    .flatMap((d) => d.activities)
    .reduce((sum, a) => sum + (a.cost ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-500">
          {days?.length ?? 0} day{days?.length === 1 ? '' : 's'} planned
          {totalCost > 0 && (
            <>
              {' · '}
              <span className="font-medium text-gray-700">est. {formatCost(totalCost)}</span>
            </>
          )}
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setShowAddDay((s) => !s)}>
            <CalendarPlus className="h-4 w-4" /> Add day
          </Button>
        )}
      </div>

      {showAddDay && canEdit && <AddDayForm tripId={tripId} onDone={() => setShowAddDay(false)} />}

      {!days?.length ? (
        <EmptyState
          emoji="📅"
          title="Nothing planned yet"
          subtitle={canEdit ? 'Add your first day to start building the itinerary.' : 'The itinerary is still empty.'}
          action={canEdit ? <Button onClick={() => setShowAddDay(true)}>Add a day</Button> : undefined}
        />
      ) : (
        <ol className="relative space-y-6 border-l-2 border-brand-100 pl-6">
          {days.map((day: DayResponse, idx) => (
            <li key={day.id} className="relative">
              <span className="absolute -left-[31px] flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-4 ring-gray-50">
                {idx + 1}
              </span>
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <h3 className="font-semibold">{formatDate(day.date, { weekday: 'short' })}</h3>
                    {day.notes && <p className="text-sm text-gray-500">{day.notes}</p>}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setActivityModal({ dayId: day.id, editing: null })}>
                        + Activity
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Delete this day and all its activities?')) deleteDay.mutate(day.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  )}
                </div>

                {day.activities.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-400">No activities yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {day.activities.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                        <span className="mt-0.5 w-20 shrink-0 text-sm font-medium text-gray-500">
                          {formatTime(a.startTime)}
                          {a.endTime && (
                            <span className="block text-xs font-normal text-gray-400">
                              → {formatTime(a.endTime)}
                              {isOvernight(a.startTime, a.endTime) && ' +1d'}
                            </span>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{a.title}</span>
                            {a.category && (
                              <Badge className={CATEGORY_META[a.category].color}>
                                {CATEGORY_META[a.category].emoji} {CATEGORY_META[a.category].label}
                              </Badge>
                            )}
                            {a.endTime && (
                              <span className="text-xs font-medium text-gray-400">
                                ⏱ {formatDuration(a.startTime, a.endTime)}
                              </span>
                            )}
                            {a.cost != null && (
                              <span className="text-xs font-medium text-gray-500">{formatCost(a.cost)}</span>
                            )}
                            {a.category === 'TRANSPORT' && extractFlightCode(a.title) && (
                              <Link
                                to={`/flights?q=${extractFlightCode(a.title)}`}
                                className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                              >
                                <Plane className="h-3 w-3" /> Track live
                              </Link>
                            )}
                          </div>
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" /> {a.location}
                          </p>
                          {a.notes && <p className="mt-1 text-sm text-gray-600">{a.notes}</p>}
                          {a.bookingLink && (
                            <a
                              href={a.bookingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                            >
                              Booking <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex shrink-0 gap-0.5">
                            <button
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              onClick={() => setActivityModal({ dayId: day.id, editing: a })}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              onClick={() => {
                                if (confirm('Delete this activity?'))
                                  deleteActivity.mutate({ dayId: day.id, activityId: a.id });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {activityModal && (
        <ActivityFormModal
          open
          onClose={() => setActivityModal(null)}
          tripId={tripId}
          dayId={activityModal.dayId}
          editing={activityModal.editing}
        />
      )}
    </div>
  );
}
