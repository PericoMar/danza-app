import { DB_ERROR_CODES } from '@/constants/tables';

const MISSING_TABLE_CODES: readonly string[] = [
  DB_ERROR_CODES.UNDEFINED_TABLE,
  DB_ERROR_CODES.TABLE_NOT_IN_SCHEMA_CACHE,
];

/** True when a Supabase query failed because its table doesn't exist yet (migration not applied). */
export function isMissingTableError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && MISSING_TABLE_CODES.includes(code);
}
