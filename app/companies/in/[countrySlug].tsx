import { useLocalSearchParams } from 'expo-router';

import CompaniesListing from '@/components/companies/CompaniesListing';
import { SEO_COMPANIES } from '@/constants/generated/companies';
import { slugify } from '@/utils/slug';

/**
 * One prerendered page per country the catalogue covers, so "dance companies in
 * Spain" has a page of its own to rank with instead of a query string on the
 * listing — a search engine reads `?country=Spain` as a variant of the same
 * page, not as a page.
 *
 * Server-only: expo-router calls this during the export.
 */
export async function generateStaticParams(): Promise<Record<string, string>[]> {
  const slugs = new Set(
    SEO_COMPANIES.map((company) => slugify(company.country ?? '')).filter(Boolean),
  );
  return [...slugs].map((countrySlug) => ({ countrySlug }));
}

export default function CompaniesInCountryScreen() {
  // Deliberately not named `country`: the listing mirrors its filters into the
  // query string, and a query param of that name would overwrite this segment.
  const { countrySlug } = useLocalSearchParams<{ countrySlug: string }>();
  return <CompaniesListing countrySlug={countrySlug} />;
}
