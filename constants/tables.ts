// Supabase table names. New code reads them from here instead of inlining
// the string; older call sites still use literals and can migrate over time.
export const TABLES = {
  USERS: 'users',
  COMPANIES: 'companies',
  AUDITIONS: 'auditions',
  AUDITION_HEIGHT_REQUIREMENTS: 'audition_height_requirements',
  AUDITION_PARTICIPATING_COMPANIES: 'audition_participating_companies',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

// Read models (Postgres views).
export const VIEWS = {
  AUDITIONS_ENRICHED: 'auditions_enriched',
  COMPANIES_ENRICHED: 'companies_enriched',
} as const;

export const RPC = {
  SAVE_AUDITION: 'save_audition',
} as const;

// FK hint for embedding the owning company from `auditions` / `auditions_enriched`.
// Keeps the embed unambiguous if `companies` ever points back at `auditions`
// again (until phase 3, `current_audition_id` did and PostgREST saw two relationships).
export const AUDITION_COMPANY_EMBED = 'companies!auditions_company_id_fkey';
