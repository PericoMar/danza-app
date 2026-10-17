import Seo from "@/components/common/Seo";
import { companyPath } from "@/constants/routes";
import { companySeo } from "@/constants/seo";
import type { Company } from "@/hooks/useCompanies";
import { companyJsonLd } from "@/utils/seo";

type CompanySeoProps = {
  companyId: string;
  /** Undefined while the company loads. */
  company?: Company;
};

/**
 * The live page's own description, replacing what <RouteSeo/> put in the static
 * HTML. It knows more than the build-time snapshot — the logo, the rating, the
 * company's own words — and it is right about companies added since the deploy.
 */
export default function CompanySeo({ companyId, company }: CompanySeoProps) {
  // Nothing to add until the company arrives: <RouteSeo/> already describes the
  // page from the build-time snapshot, which is more than this knows. Rendering
  // a placeholder here would overwrite it — these tags resolve last-one-wins.
  if (!company) return null;

  const path = companyPath(companyId);

  return (
    <Seo
      {...companySeo(company.name, company.country)}
      path={path}
      image={company.image}
      jsonLd={companyJsonLd({
        name: company.name,
        type: company.type,
        path,
        location: company.location,
        country: company.country,
        description: company.description,
        image: company.image,
        sameAs: [company.website_url, company.instagram_url, company.meta_url],
        rating:
          company.average_rating && company.rating_count
            ? { value: company.average_rating, count: company.rating_count }
            : null,
      })}
    />
  );
}
