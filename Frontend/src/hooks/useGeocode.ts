import { useQuery } from '@tanstack/react-query';
import { geocode } from '@/lib/geocode';
import { queryKeys } from '@/lib/queryKeys';

export function useGeocode(query: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.geocode(query ?? ''),
    queryFn: () => geocode(query!),
    enabled: !!query,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}
