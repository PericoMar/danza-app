import { useEffect, useRef } from 'react';
import { useGlobalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import { FOCUS_PARAM } from '@/constants/routes';

export type CompaniesListingParams = {
  /** The country, on /companies/in/[countrySlug]. */
  countrySlug?: string;
  /** Legacy entry point: older links filter by `?country=` (a name or an ISO code). */
  country?: string;
  q?: string;
  upcoming?: string;
  fav?: string;
  types?: string;
  [FOCUS_PARAM]?: string;
};

/**
 * The companies listing's URL params: the country from the path, the filters
 * from the query string.
 *
 * Read from the global URL because the listing is rendered by a layout (see
 * app/(companies-listing)/_layout.tsx), and a layout's own params are the ones
 * it was opened with: they don't follow the moves between the routes below it.
 *
 * The global URL is only this listing's while its screen is focused. A company
 * page opened on top leaves it mounted underneath, and so can another listing
 * opened from there; their URLs aren't its own. So it keeps the last one that
 * was: reading /insights/… as "no country" would recalculate the hidden list,
 * and going back would land on its first page.
 */
export function useCompaniesListingParams(): CompaniesListingParams {
  // The same object until the URL changes, so it is safe as an effect dependency.
  const params = useGlobalSearchParams<CompaniesListingParams>();
  const isFocused = useIsFocused();
  // Updated after commit, never during render: a render React throws away
  // must not count as the listing's last URL.
  const kept = useRef(params);
  useEffect(() => {
    if (isFocused) kept.current = params;
  });
  return isFocused ? params : kept.current;
}
