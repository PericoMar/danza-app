// Supabase table names. New code reads them from here instead of inlining
// the string; older call sites still use literals and can migrate over time.
export const TABLES = {
  USERS: 'users',
  COMPANIES: 'companies',
  AUDITIONS: 'auditions',
  AUDITION_HEIGHT_REQUIREMENTS: 'audition_height_requirements',
  AUDITION_PARTICIPATING_COMPANIES: 'audition_participating_companies',
  HERO_RING_IMAGES: 'hero_ring_images',
  // Resources: the directory of services, professionals and schools.
  RESOURCES: 'resources',
  RESOURCE_REGIONS: 'resource_regions',
  RESOURCE_EMAILS: 'resource_emails',
  RESOURCE_IMAGES: 'resource_images',
  RESOURCE_DISCIPLINES: 'resource_disciplines',
  RESOURCE_STUDENT_GOALS: 'resource_student_goals',
  RESOURCE_PHOTOGRAPHY_WORK_TYPES: 'resource_photography_work_types',
  RESOURCE_SKIPPED_FIELDS: 'resource_skipped_fields',
  RESOURCE_TYPE_FIELDS: 'resource_type_fields',
  // Catalogues we curate.
  COUNTRIES: 'countries',
  REGIONS: 'regions',
  DISCIPLINES: 'disciplines',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

// Read models (Postgres views).
export const VIEWS = {
  AUDITIONS_ENRICHED: 'auditions_enriched',
  COMPANIES_ENRICHED: 'companies_enriched',
  RESOURCES_ENRICHED: 'resources_enriched',
  // Published resources by region, already ranked: a nationwide one has a row
  // for every region of its country.
  RESOURCE_REGION_PLACEMENTS: 'resource_region_placements',
} as const;

export const RPC = {
  SAVE_AUDITION: 'save_audition',
  REORDER_HERO_RING_IMAGES: 'reorder_hero_ring_images',
  SAVE_RESOURCE: 'save_resource',
  RESOURCES_IN_REGION: 'resources_in_region',
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
