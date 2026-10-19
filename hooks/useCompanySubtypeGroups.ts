import { useQuery } from '@tanstack/react-query';
import { getCompanySubtypeGroups } from '@/services/companySubtypes';
import { COMPANY_SUBTYPE_GROUPS_STALE_TIME_MS } from '@/constants/companySubtypes';

export const companySubtypeKeys = {
  groups: ['company-subtype-groups'] as const,
};

/** The subtype catalogue grouped by type, for the type filter and the admin form. */
export function useCompanySubtypeGroups() {
  return useQuery({
    queryKey: companySubtypeKeys.groups,
    queryFn: getCompanySubtypeGroups,
    staleTime: COMPANY_SUBTYPE_GROUPS_STALE_TIME_MS,
  });
}
