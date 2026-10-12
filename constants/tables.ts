// Supabase table names. New code reads them from here instead of inlining
// the string; older call sites still use literals and can migrate over time.
export const TABLES = {
  USERS: 'users',
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
