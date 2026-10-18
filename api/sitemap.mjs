// api/sitemap.mjs
// https://danza-app.com/sitemap.xml (see the rewrite in vercel.json).
//
// A function rather than a file in public/ because the company pages change
// whenever someone adds a company, and waiting for the next deploy to tell
// Google about it would mean days of delay.

import { handledAsPreflightOrWrongMethod, PRODUCTION_ORIGIN } from "../server/http.mjs";
import { TABLES, createServiceRoleClient, missingSupabaseEnv } from "../server/supabase.mjs";
import { slugify } from "../server/slug.mjs";

/**
 * Indexable static pages. Mirrors PAGE_SEO in constants/seo.ts, which the
 * app-side TypeScript owns; the two can't share a module across the .ts / .mjs
 * boundary, so keep them in step.
 */
const STATIC_PATHS = [
  "/companies",
  "/home",
  "/newsletter",
  "/support",
  "/policies",
  "/policies/privacy-policy",
  "/policies/terms",
];

/** Sitemaps cap at 50.000 URLs; well above that we'd need an index file. */
const MAX_COMPANIES = 45000;

/** An hour at the edge, serving the old copy while it refreshes. */
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry({ path, lastmod }) {
  const loc = `    <loc>${escapeXml(`${PRODUCTION_ORIGIN}${path}`)}</loc>`;
  const modified = lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : "";
  return `  <url>\n${loc}${modified}\n  </url>`;
}

async function databaseEntries() {
  const missing = missingSupabaseEnv();
  if (missing.length > 0) {
    console.error("[Sitemap] Missing environment variables:", missing);
    return [];
  }

  const { data, error } = await createServiceRoleClient()
    .from(TABLES.COMPANIES)
    .select("slug,country,last_reviewed_at,created_at")
    .order("last_reviewed_at", { ascending: false, nullsFirst: false })
    .limit(MAX_COMPANIES);

  if (error) {
    console.error("[Sitemap] DB error:", error);
    return [];
  }

  const companies = (data ?? []).map((company) => ({
    path: `/insights/${company.slug}`,
    lastmod: company.last_reviewed_at ?? company.created_at ?? null,
  }));

  // One entry per country the catalogue covers. Derived here rather than listed
  // by hand so a country appears the day its first company does.
  const countries = [
    ...new Set((data ?? []).map((company) => slugify(company.country ?? "")).filter(Boolean)),
  ]
    .sort()
    .map((country) => ({ path: `/companies/in/${country}`, lastmod: null }));

  return [...companies, ...countries];
}

export default async function handler(req, res) {
  if (handledAsPreflightOrWrongMethod(req, res, "GET")) return;

  // A partial sitemap beats a 500: the static pages are always worth serving.
  const entries = [
    ...STATIC_PATHS.map((path) => ({ path, lastmod: null })),
    ...(await databaseEntries()),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(urlEntry),
    "</urlset>",
  ].join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", CACHE_CONTROL);
  return res.status(200).send(xml);
}
