// Subtype catalogue (tables `company_types` / `company_subtypes`). It lives in
// the database, not here, so its ids are plain strings: the catalogue can grow
// without an app release.

/** Id of a row in `company_subtypes` ('touring', 'junior', 'school_pro'…). */
export type CompanySubtypeId = string;

/** Id of a row in `company_types` ('companies', 'events'…). */
export type CompanyTypeId = string;

/** A type as the companies filter lists it. */
export type CompanyTypeOption = {
  id: CompanyTypeId;
  label: string;
};

/** Something that can be ticked on a company. */
export type CompanySubtypeOption = {
  id: CompanySubtypeId;
  label: string;
};

/** A type: only a heading over its subtypes, never assigned to a company. */
export type CompanySubtypeGroup = {
  id: CompanyTypeId;
  label: string;
  subtypes: CompanySubtypeOption[];
};

/**
 * The subtypes the code knows by id: events has behaviour of its own, and each
 * one has a schema.org type for SEO. Rows of the catalogue like any other, so
 * their ids must not change there. A subtype added to the catalogue but not
 * here works everywhere; SEO just describes it with the default type.
 */
export const CompanySubtype = {
  TOURING: 'touring',
  JUNIOR: 'junior',
  PRE_PROFESSIONAL: 'pre_professional',
  SCHOOL_PRO: 'school_pro',
  UNIVERSITY: 'university',
  /** Organises auditions other companies take part in (see GLOSSARY.md). */
  EVENTS: 'events',
} as const;

/** What the admin form edits about a company. */
export type CompanyFormValues = {
  name: string;
  description: string;
  image: string;
  location: string;
  website_url: string;
  instagram_url: string;
  meta_url: string;
  country: string;
  country_iso_code: string;
  verified: boolean;
  /** In catalogue order. */
  subtype_ids: CompanySubtypeId[];
};

/** Payload of the `save_company` RPC: `id` null creates the company. */
export type SaveCompanyPayload = CompanyFormValues & { id: string | null };

// Events company with a live audition that a company takes part in
// (`companies_enriched.participating_in_events`). Only what the banner shows.
export type ParticipatingEvent = {
  id: string;
  name: string;
};
