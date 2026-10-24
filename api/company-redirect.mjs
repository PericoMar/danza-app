// api/company-redirect.mjs
// /insights/<uuid> lands here (see the rewrite in vercel.json) and leaves with
// a 308 to /insights/<slug>, where the company page lives since companies are
// addressed by name. Links shared before then keep working, and Google moves
// whatever it learnt about the uuid URL to the slug one without rendering JS.

import { handledAsPreflightOrWrongMethod } from "../server/http.mjs";
import { TABLES, createServiceRoleClient, missingSupabaseEnv } from "../server/supabase.mjs";
import { isUuid } from "../server/slug.mjs";

/** Where a uuid that names no company, or a failed lookup, is sent instead. */
const FALLBACK_PATH = "/companies";

/** A slug can change if a company is renamed, so browsers don't keep it forever. */
const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400";

async function findSlug(id) {
  const missing = missingSupabaseEnv();
  if (missing.length > 0) {
    console.error("[CompanyRedirect] Missing environment variables:", missing);
    return null;
  }

  const { data, error } = await createServiceRoleClient()
    .from(TABLES.COMPANIES)
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[CompanyRedirect] DB error:", error);
    return null;
  }
  return data?.slug ?? null;
}

export default async function handler(req, res) {
  if (handledAsPreflightOrWrongMethod(req, res, "GET")) return;

  const id = String(req.query?.id ?? "");
  const slug = isUuid(id) ? await findSlug(id) : null;

  if (!slug) {
    res.setHeader("Location", FALLBACK_PATH);
    return res.status(307).end();
  }

  res.setHeader("Location", `/insights/${encodeURIComponent(slug)}`);
  res.setHeader("Cache-Control", CACHE_CONTROL);
  return res.status(308).end();
}
