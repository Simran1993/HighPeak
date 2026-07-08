import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { AuthShell, GoogleButton } from '@/features/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { handleApiError } from '@/lib/errors';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      navigate('/explore', { replace: true });
    },
    onError: handleApiError,
  });

  return (
    <AuthShell title="Create your account" subtitle="Free forever. Invite friends and start planning.">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Field label="Name" error={formState.errors.name?.message}>
          <Input placeholder="Jane Doe" autoComplete="name" {...register('name')} />
        </Field>
        <Field label="Email" error={formState.errors.email?.message}>
          <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          <Input type="password" placeholder="At least 8 characters" autoComplete="new-password" {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Create account
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
      </div>
      <GoogleButton />

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
