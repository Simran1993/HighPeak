import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { itineraryApi } from '@/api/itinerary';
import { queryKeys } from '@/lib/queryKeys';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/stores/toastStore';
import type { ActivityCategory, DayResponse } from '@/types/api';

const schema = z.object({
  category: z.enum(['ACCOMMODATION', 'TRANSPORT']),
  title: z.string().min(1, 'Required — e.g. "Airbnb in Shibuya" or "Flight AI302"'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Time is required'),
  endTime: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  cost: z.string().optional(),
  bookingLink: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const hms = (t: string) => (t.length === 5 ? `${t}:00` : t);

/**
 * Add a booking you've already made (hotel, flight, train…) straight into the
 * itinerary. Creates the day if it doesn't exist yet, then the activity —
 * it shows up in both the itinerary timeline and the "Booked so far" tracker.
 */
export function AddBookingModal({
  open,
  onClose,
  tripId,
  days,
}: {
  open: boolean;
  onClose: () => void;
  tripId: string;
  days: DayResponse[];
}) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'ACCOMMODATION' },
  });
  const category = watch('category');

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      // find (or create) the day for this booking's date
      let day = days.find((d) => d.date === v.date);
      if (!day) {
        day = await itineraryApi.addDay(tripId, { date: v.date });
      }
      return itineraryApi.addActivity(tripId, day.id, {
        title: v.title,
        startTime: hms(v.startTime),
        endTime: v.endTime ? hms(v.endTime) : null,
        location: v.location,
        notes: v.notes?.trim() || 'Confirmed booking',
        cost: v.cost ? Number(v.cost) : null,
        category: v.category as ActivityCategory,
        bookingLink: v.bookingLink?.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itinerary(tripId) });
      toast.success('Booking added to your itinerary');
      reset();
      onClose();
    },
    onError: handleApiError,
  });

  const isStay = category === 'ACCOMMODATION';

  return (
    <Modal open={open} onClose={onClose} title="Add an existing booking" wide>
      <p className="mb-4 text-sm text-gray-500">
        Already booked something? Add it here — it lands in the itinerary and the booking tracker.
      </p>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select {...register('category')}>
              <option value="ACCOMMODATION">🏨 Stay (hotel, Airbnb…)</option>
              <option value="TRANSPORT">🚆 Transport (flight, train, car…)</option>
            </Select>
          </Field>
          <Field label="Title" error={formState.errors.title?.message}>
            <Input placeholder={isStay ? 'Airbnb in Shibuya' : 'Flight AI302 to Tokyo'} {...register('title')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={isStay ? 'Check-in date' : 'Departure date'} error={formState.errors.date?.message}>
            <Input type="date" {...register('date')} />
          </Field>
          <Field label={isStay ? 'Check-in time' : 'Departure time'} error={formState.errors.startTime?.message}>
            <Input type="time" {...register('startTime')} />
          </Field>
          <Field label={isStay ? 'Check-out time (optional)' : 'Arrival time (optional)'}>
            <Input type="time" {...register('endTime')} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location" error={formState.errors.location?.message}>
            <Input placeholder={isStay ? 'Shibuya, Tokyo' : 'DEL → NRT'} {...register('location')} />
          </Field>
          <Field label="Cost (USD, optional)">
            <Input type="number" step="0.01" min="0" placeholder="0.00" {...register('cost')} />
          </Field>
        </div>
        <Field label="Confirmation link (optional)">
          <Input placeholder="https://airbnb.com/trips/… or booking confirmation URL" {...register('bookingLink')} />
        </Field>
        <Field label="Notes (optional)">
          <Input placeholder="Confirmation #ABC123, check-in after 3pm" {...register('notes')} />
        </Field>
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Add to itinerary
        </Button>
      </form>
    </Modal>
  );
}
