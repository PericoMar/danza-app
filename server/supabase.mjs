// server/supabase.mjs
// The service-role Supabase client the functions under /api use. It bypasses RLS
// on purpose: a newsletter consent belongs to no authenticated user, so there is
// no policy that could let the caller write its own row.

import { createClient } from "@supabase/supabase-js";

// Mirrors constants/tables.ts, which the app-side TypeScript imports. The two
// can't share a module across the .ts / .mjs boundary, so keep them in step.
export const TABLES = {
  NEWSLETTER_CONSENTS: "newsletter_consents",
  COMPANIES: "companies",
};

const REQUIRED_ENV = ["EXPO_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

/** The Supabase env vars a function needs and that aren't set. Empty when fine. */
export function missingSupabaseEnv() {
  return REQUIRED_ENV.filter((name) => !process.env[name]);
}

export function createServiceRoleClient() {
  return createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
