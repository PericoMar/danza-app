// Supabase table names. New code reads them from here instead of inlining
// the string; older call sites still use literals and can migrate over time.
export const TABLES = {
  USERS: 'users',
  COMPANIES: 'companies',
  COMPANY_TYPES: 'company_types',
  COMPANY_SUBTYPES: 'company_subtypes',
  AUDITIONS: 'auditions',
  AUDITION_HEIGHT_REQUIREMENTS: 'audition_height_requirements',
  AUDITION_PARTICIPATING_COMPANIES: 'audition_participating_companies',
  HERO_RING_IMAGES: 'hero_ring_images',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

// Read models (Postgres views).
export const VIEWS = {
  AUDITIONS_ENRICHED: 'auditions_enriched',
  COMPANIES_ENRICHED: 'companies_enriched',
} as const;

export const RPC = {
  SAVE_AUDITION: 'save_audition',
  SAVE_COMPANY: 'save_company',
  REORDER_HERO_RING_IMAGES: 'reorder_hero_ring_images',
} as const;

// FK hint for embedding the owning company from `auditions` / `auditions_enriched`.
// Keeps the embed unambiguous if `companies` ever points back at `auditions`
// again (until phase 3, `current_audition_id` did and PostgREST saw two relationships).
export const AUDITION_COMPANY_EMBED = 'companies!auditions_company_id_fkey';

// Error codes from Postgres / PostgREST that the app reacts to.
export const DB_ERROR_CODES = {
  UNDEFINED_TABLE: '42P01', // Postgres: the table doesn't exist (migration not applied)
  TABLE_NOT_IN_SCHEMA_CACHE: 'PGRST205', // PostgREST: same, as reported by newer versions
} as const;
