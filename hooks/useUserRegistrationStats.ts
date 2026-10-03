import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserRegistrationDates } from '@/services/userStats';
import { buildRegistrationStats } from '@/utils/registrationStats';
import { RegistrationGranularity, RegistrationStats } from '@/types/adminStats';

/**
 * Fetches every user's `created_at` once (cheap: one column, cached 5 min)
 * and re-buckets it client-side whenever `granularity` changes, so switching
 * Day/Week/Month never re-hits the network.
 */
export function useUserRegistrationStats(granularity: RegistrationGranularity) {
  const query = useQuery<string[]>({
    queryKey: ['admin', 'user-registration-dates'],
    staleTime: 5 * 60 * 1000,
    queryFn: getUserRegistrationDates,
  });

  const stats = useMemo<RegistrationStats | undefined>(() => {
    if (!query.data) return undefined;
    return buildRegistrationStats(query.data, granularity);
  }, [query.data, granularity]);

  return { ...query, stats };
}
