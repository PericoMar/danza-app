import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Company, companyKeys } from '@/hooks/useCompanies';
import { FavoritesBus } from '@/services/favorite-bus';
import { toggleFavorite } from '@/services/favorites';

/**
 * Toggles a company's favorite and writes the result into every cached copy of
 * that company.
 *
 * The listing's favorites counter and its favorites-first ordering both read
 * `is_favorite` off the companies query, so a write that only lived in the
 * heart's own state left the counter on whatever it was when the page loaded.
 * The cache is the single source of truth: patch it and everything that reads
 * it moves at once.
 */
export function useToggleCompanyFavorite(companyId: string) {
  const queryClient = useQueryClient();

  const writeToCache = (isFavorite: boolean) => {
    queryClient.setQueriesData<Company[]>(
      { queryKey: companyKeys.lists },
      (companies) =>
        companies?.map((company) =>
          company.id === companyId ? { ...company, is_favorite: isFavorite } : company,
        ),
    );
    queryClient.setQueriesData<Company>({ queryKey: companyKeys.details }, (company) =>
      company && company.id === companyId ? { ...company, is_favorite: isFavorite } : company,
    );
  };

  return useMutation({
    mutationFn: (current: boolean) => toggleFavorite(companyId, current),
    // The heart animates on press, so the counter next to it has to move in the
    // same frame — not a round-trip later.
    onMutate: (current: boolean) => {
      writeToCache(!current);
      return { previous: current };
    },
    onError: (_error, _current, context) => {
      if (context) writeToCache(context.previous);
    },
    onSuccess: (confirmed) => {
      writeToCache(confirmed);
      FavoritesBus.emit({ companyId, isFavorite: confirmed });
    },
  });
}
