import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { PageSpinner } from '@/components/ui/Spinner';

export function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      navigate('/explore', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [params, setTokens, navigate]);

  return <PageSpinner label="Signing you in…" />;
}
