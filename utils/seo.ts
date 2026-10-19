import {
  COMPANY_SUBTYPE_SCHEMA_TYPE,
  DEFAULT_COMPANY_SCHEMA_TYPE,
  GENERIC_COMPANY_SCHEMA_TYPE,
  SITE_ORIGIN,
} from "@/constants/seo";
import type { CompanySubtypeId } from "@/types/company";

/**
 * The schema.org `@type` of a company: one type per kind it is, so a junior
 * company that is also a school is both a DanceGroup and an
 * EducationalOrganization. A single type is returned as a string.
 */
export function companySchemaType(subtypes: readonly CompanySubtypeId[]): string | string[] {
  const types = [
    ...new Set(
      subtypes
        .map((subtype) => COMPANY_SUBTYPE_SCHEMA_TYPE[subtype])
        .filter((type): type is string => Boolean(type)),
    ),
  ];
  const specific = types.length > 1 ? types.filter((t) => t !== GENERIC_COMPANY_SCHEMA_TYPE) : types;

  if (specific.length === 0) return DEFAULT_COMPANY_SCHEMA_TYPE;
  return specific.length === 1 ? specific[0] : specific;
}

type CompanyJsonLdInput = {
  name: string;
  subtypes: readonly CompanySubtypeId[];
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
  subtypes,
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
    "@type": companySchemaType(subtypes),
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
