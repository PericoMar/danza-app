// Writes constants/generated/companies.ts, the snapshot of the company list
// that the web export needs at build time.
//
// The screens fetch companies in the browser, which is too late for a crawler:
// the title, description and structured data of every company page have to be
// in the HTML the server sends. This module is what puts them there, so it
// holds the SEO fields only — never the whole row, which would ship to every
// visitor in the JS bundle.
//
// Runs as part of `pnpm build`. A failure here is not fatal: the committed file
// stays in place and the build goes on with the previous snapshot.

import { writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const OUTPUT = "constants/generated/companies.ts";
const REQUIRED_ENV = ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY"];

function fail(reason) {
  console.warn(`[seo:data] ${reason} — keeping the committed ${OUTPUT}`);
  process.exit(0);
}

const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length > 0) fail(`missing env: ${missing.join(", ")}`);

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await supabase
  .from("companies")
  .select("id,name,location,country,type")
  .order("name", { ascending: true });

if (error) fail(`query failed: ${error.message}`);
if (!data?.length) fail("the query returned no companies");

const companies = data
  .filter((company) => company.id && company.name)
  .map((company) => ({
    id: company.id,
    name: company.name,
    location: company.location ?? null,
    country: company.country ?? null,
    type: company.type ?? "company",
  }));

const file = `// GENERATED FILE — do not edit by hand.
// Rebuild it with \`pnpm seo:data\` (and it refreshes on every \`pnpm build\`).
//
// Snapshot of the companies the static export needs in order to describe each
// company page to a crawler. SEO fields only: this ships in the JS bundle.

import type { CompanyType } from "@/types/company";

export type SeoCompany = {
  id: string;
  name: string;
  location: string | null;
  country: string | null;
  type: CompanyType;
};

export const SEO_COMPANIES: readonly SeoCompany[] = ${JSON.stringify(companies, null, 2)};
`;

await writeFile(OUTPUT, file, "utf8");
console.log(`[seo:data] wrote ${companies.length} companies to ${OUTPUT}`);
