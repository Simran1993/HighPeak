import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { AuthShell, GoogleButton } from '@/features/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { handleApiError } from '@/lib/errors';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuthStore((s) => s.setTokens);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      navigate((location.state as { from?: string })?.from ?? '/explore', { replace: true });
    },
    onError: handleApiError,
  });

  return (
    <AuthShell title="Welcome back" subtitle="Log in to keep planning your adventures.">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Field label="Email" error={formState.errors.email?.message}>
          <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          <Input type="password" placeholder="••••••••" autoComplete="current-password" {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          Log in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
        <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
      </div>
      <GoogleButton />

      <p className="mt-6 text-center text-sm text-gray-500">
        New here?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
