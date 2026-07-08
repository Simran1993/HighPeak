import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { usersApi } from '@/api/users';
import { queryKeys } from '@/lib/queryKeys';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const location = useLocation();

  const { data: me } = useQuery({
    queryKey: queryKeys.me(),
    queryFn: usersApi.me,
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (me) setUser(me);
  }, [me, setUser]);

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}
