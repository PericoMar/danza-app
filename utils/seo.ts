import { COMPANY_SCHEMA_TYPE, SITE_ORIGIN } from "@/constants/seo";
import type { CompanyType } from "@/types/company";

type CompanyJsonLdInput = {
  name: string;
  type: CompanyType;
  /** App-relative path of the company page. */
  path: string;
  location?: string | null;
  country?: string | null;
  description?: string | null;
  /** Absolute URL of the company logo. */
  image?: string | null;
  /** Website, Instagram, Meta — whichever the company has. */
  sameAs?: readonly (string | null)[];
  rating?: { value: number; count: number } | null;
};

/**
 * Structured data for a company page. Built in two places with different
 * amounts of detail — the static export knows only what the build captured,
 * the live screen has the whole row — so the shape lives here once.
 */
export function companyJsonLd({
  name,
  type,
  path,
  location,
  country,
  description,
  image,
  sameAs,
  rating,
}: CompanyJsonLdInput): Record<string, unknown> {
  const profiles = (sameAs ?? []).filter((url): url is string => Boolean(url));

  return {
    "@context": "https://schema.org",
    "@type": COMPANY_SCHEMA_TYPE[type] ?? "Organization",
    name,
    url: `${SITE_ORIGIN}${path}`,
    ...(description ? { description } : {}),
    ...(image ? { logo: image } : {}),
    ...(location || country
      ? {
          address: {
            "@type": "PostalAddress",
            ...(location ? { streetAddress: location } : {}),
            ...(country ? { addressCountry: country } : {}),
          },
        }
      : {}),
    ...(profiles.length > 0 ? { sameAs: profiles } : {}),
    // Only with real ratings behind it: an empty aggregate is a structured-data error.
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.value,
            ratingCount: rating.count,
          },
        }
      : {}),
  };
}
