import { usePathname } from "expo-router";

import Seo from "./Seo";
import {
  COMPANY_PAGE_FALLBACK,
  COUNTRY_PAGE_FALLBACK,
  PAGE_SEO,
  SITE_NAME,
  companySeo,
  countrySeo,
  isCompanyPath,
  isCountryPath,
  seoCompanyForPath,
  seoCountryForPath,
  type PageSeo,
} from "@/constants/seo";
import { companyPath } from "@/constants/routes";
import { companyJsonLd } from "@/utils/seo";

/** Private and transactional screens share one title; none of them is indexed. */
const PRIVATE_PAGE: PageSeo = {
  title: SITE_NAME,
  description: PAGE_SEO["/home"].description,
};

/**
 * Describes the current page to crawlers. Mounted once, above the auth gate, so
 * the prerendered HTML of every route carries its tags — during the static
 * export the session is always still resolving, so anything rendered below the
 * gate (every screen included) is absent from the generated HTML. That is also
 * why company copy is read from the build-time snapshot here rather than left
 * to the screen, which only gets to speak once the browser has hydrated.
 *
 * A path matching nothing is noindex on purpose: new private screens stay out
 * of the index until someone writes copy for them.
 */
export default function RouteSeo() {
  const pathname = usePathname();

  // Empty until the router resolves the location. Emitting nothing is the safe
  // default: no robots tag at all reads as indexable, a premature one wouldn't.
  if (!pathname) return null;

  // On a dynamic route the export also renders the template path
  // ("/insights/[companyId]"), whose canonical URL would resolve to nothing.
  const isTemplatePath = pathname.includes("[");
  const path = isTemplatePath ? null : pathname;

  if (isCompanyPath(pathname)) {
    const company = seoCompanyForPath(pathname);

    if (!company) {
      // Added since the last build, or an id that matches nothing.
      return <Seo {...COMPANY_PAGE_FALLBACK} path={path} />;
    }

    return (
      <Seo
        {...companySeo(company.name, company.country)}
        // The slug, not whatever the URL carried: a uuid page must point at
        // the canonical address instead of competing with it.
        path={isTemplatePath ? null : companyPath(company.slug)}
        jsonLd={companyJsonLd({
          name: company.name,
          type: company.type,
          path: companyPath(company.slug),
          location: company.location,
          country: company.country,
        })}
      />
    );
  }

  if (isCountryPath(pathname)) {
    const country = seoCountryForPath(pathname);
    return <Seo {...(country ? countrySeo(country) : COUNTRY_PAGE_FALLBACK)} path={path} />;
  }

  const page = PAGE_SEO[pathname as keyof typeof PAGE_SEO];

  return (
    <Seo
      title={page?.title ?? PRIVATE_PAGE.title}
      description={page?.description ?? PRIVATE_PAGE.description}
      path={path}
      noindex={!page}
    />
  );
}
