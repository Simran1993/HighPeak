import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import type { TripResponse } from '@/types/api';

const schema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().optional(),
    destination: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type TripFormValues = z.infer<typeof schema>;

export function TripForm({
  initial,
  onSubmit,
  submitting,
  submitLabel,
}: {
  initial?: TripResponse;
  onSubmit: (values: TripFormValues) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const { register, handleSubmit, formState } = useForm<TripFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description ?? '',
          destination: initial.destination ?? '',
          startDate: initial.startDate ?? '',
          endDate: initial.endDate ??  '',
        }
      : undefined,
  });

  return (
    <form
      onSubmit={handleSubmit((v) =>
        onSubmit({
          ...v,
          description: v.description || undefined,
          destination: v.destination || undefined,
          startDate: v.startDate || undefined,
          endDate: v.endDate || undefined,
        }),
      )}
      className="space-y-4"
    >
      <Field label="Trip title" error={formState.errors.title?.message}>
        <Input placeholder="Japan, cherry blossom season" {...register('title')} />
      </Field>
      <Field label="Destination" error={formState.errors.destination?.message}>
        <Input placeholder="Tokyo, Japan" {...register('destination')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date" error={formState.errors.startDate?.message}>
          <Input type="date" {...register('startDate')} />
        </Field>
        <Field label="End date" error={formState.errors.endDate?.message}>
          <Input type="date" {...register('endDate')} />
        </Field>
      </div>
      <Field label="Description" error={formState.errors.description?.message}>
        <Textarea placeholder="What's this trip about?" {...register('description')} />
      </Field>
      <Button type="submit" loading={submitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
