// Everything that ends up in a <title>, a <meta> tag or the sitemap.
//
// Screens don't inline SEO copy. Static pages are described by the map below
// and rendered by <RouteSeo/> from the root layout; a screen only mounts its
// own <Seo/> when the copy depends on fetched data (see the company page).

import { PRODUCTION_API_ORIGIN } from "@/constants/api";
import { COMPANY_ROUTE_PREFIX } from "@/constants/routes";
import { SEO_COMPANIES, type SeoCompany } from "@/constants/generated/companies";
import { CompanyType } from "@/types/company";

/** Canonical origin of the public site — the same host that serves /api. */
export const SITE_ORIGIN = PRODUCTION_API_ORIGIN;

export const SITE_NAME = "Danza App";

/** Falls back on every page that doesn't carry an image of its own. */
export const DEFAULT_OG_IMAGE_URL = `${SITE_ORIGIN}/og-default.png`;

/** Open Graph needs absolute URLs; screens hold app-relative paths. */
export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_ORIGIN}${path}`;
}

export type PageSeo = {
  title: string;
  description: string;
  /**
   * Whether to append " | Danza App". Off for pages whose title is already long
   * enough to be truncated — see companySeo.
   */
  appendSiteName?: boolean;
};

/** Static pages, keyed by pathname. Anything absent here is treated as noindex. */
export const PAGE_SEO = {
  "/companies": {
    title: "Dance companies and open auditions",
    description:
      "Browse dance companies worldwide, see which ones have open auditions right now, and filter by country, type and deadline.",
  },
  "/home": {
    title: "Find your next dance audition",
    description:
      "Danza App gathers dance auditions from companies around the world in one place, with deadlines, requirements and how to apply.",
  },
  "/newsletter": {
    title: "Audition alerts by email",
    description:
      "Get an email when dance companies you follow open a new audition. No noise, just the calls that matter.",
  },
  "/support": {
    title: "Support",
    description:
      "Need help with Danza App? Contact us by email or Instagram and we'll get back to you.",
  },
  "/policies": {
    title: "Policies",
    description: "Privacy policy, terms of service and account deletion for Danza App.",
  },
  "/policies/privacy-policy": {
    title: "Privacy policy",
    description: "How Danza App collects, stores and uses your personal data.",
  },
  "/policies/terms": {
    title: "Terms of service",
    description: "The terms that govern your use of Danza App.",
  },
  "/policies/delete-account": {
    title: "Delete your account",
    description: "How to permanently delete your Danza App account and the data attached to it.",
  },
} as const satisfies Record<string, PageSeo>;

export type IndexablePath = keyof typeof PAGE_SEO;

/**
 * Fallback for a company page the build doesn't know about — one added since
 * the last deploy. Generic but honest beats an empty <title>.
 */
export const COMPANY_PAGE_FALLBACK: PageSeo = {
  title: "Dance company auditions and reviews",
  description:
    "Open auditions, requirements and dancer reviews for dance companies worldwide.",
};

// Keyed by both because the segment is normally a slug, but a link shared
// before slugs existed carries a uuid and still has to describe its page.
const COMPANY_BY_SEGMENT = new Map(
  SEO_COMPANIES.flatMap((company) => [
    [company.slug, company] as const,
    [company.id, company] as const,
  ]),
);

/** The company a pathname points at, when the build captured it. */
export function seoCompanyForPath(pathname: string): SeoCompany | undefined {
  if (!pathname.startsWith(`${COMPANY_ROUTE_PREFIX}/`)) return undefined;
  return COMPANY_BY_SEGMENT.get(pathname.slice(COMPANY_ROUTE_PREFIX.length + 1));
}

export function isCompanyPath(pathname: string): boolean {
  return pathname.startsWith(`${COMPANY_ROUTE_PREFIX}/`);
}

/** schema.org type per kind of company. DanceGroup is a PerformingGroup. */
export const COMPANY_SCHEMA_TYPE: Record<CompanyType, string> = {
  [CompanyType.COMPANY]: "DanceGroup",
  [CompanyType.PROFESSIONAL_EDUCATION]: "EducationalOrganization",
  [CompanyType.EVENTS]: "Organization",
};

/**
 * Copy for a company page. `country` and not `location`: location holds a street
 * address, which reads as noise in a result title and eats the ~60 characters
 * Google shows before truncating.
 */
export function companySeo(name: string, country: string | null): PageSeo {
  return {
    // No site-name suffix: with it, two thirds of the company titles ran past
    // the ~60 characters a result shows and got cut off. The company's own name
    // leads the title anyway, and Google appends the site name itself.
    appendSiteName: false,
    title: country ? `${name} — dance auditions in ${country}` : `${name} — dance auditions and reviews`,
    description: country
      ? `Open auditions, requirements and dancer reviews for ${name} in ${country}.`
      : `Open auditions, requirements and dancer reviews for ${name}.`,
  };
}
