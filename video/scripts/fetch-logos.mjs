// Downloads a sample of company logos into public/logos and writes the list the
// composition reads (src/generated/logos.json). Both outputs are gitignored:
// the logos are other companies' marks, fetched fresh from the catalogue each
// time the video is rendered.
//
// Reads the public Supabase URL and anon key from the app's ../.env, the same
// pair (and the same view) `pnpm seo:data` uses.

import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_FILE = resolve(ROOT, "../.env");
const LOGOS_DIR = join(ROOT, "public/logos");
const MANIFEST = join(ROOT, "src/generated/logos.json");

const VIEW = "companies_enriched";
// Enough for the rows to never show the same logo twice side by side.
const SAMPLE_SIZE = 48;
const CONCURRENCY = 8;
const USER_AGENT = "danza-app-video/1.0"; // some hosts (Wikimedia) reject requests without one

const EXTENSION_BY_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

function readEnv() {
  process.loadEnvFile(ENV_FILE);
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(`EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in ${ENV_FILE}`);
  }
  return { url, key };
}

async function fetchCompanies({ url, key }) {
  const query = new URLSearchParams({ select: "slug,name,image", image: "not.is.null", order: "name" });
  const res = await fetch(`${url}/rest/v1/${VIEW}?${query}`, { headers: { apikey: key } });
  if (!res.ok) throw new Error(`${VIEW} query failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Every nth company, so the sample spans the whole alphabet and stays stable between runs. */
function sampleEvenly(companies, size) {
  if (companies.length <= size) return companies;
  const step = companies.length / size;
  return Array.from({ length: size }, (_, i) => companies[Math.floor(i * step)]);
}

/** Returns the saved logo, or null when the URL is broken or isn't an image. */
async function downloadLogo(company) {
  try {
    const res = await fetch(company.image, { headers: { "User-Agent": USER_AGENT } });
    const type = res.headers.get("content-type")?.split(";")[0].trim();
    const extension = EXTENSION_BY_TYPE[type];
    if (!res.ok || !extension) {
      console.warn(`[logos] skipped ${company.slug}: ${res.status} ${type ?? "no content-type"}`);
      return null;
    }
    const file = `${company.slug}.${extension}`;
    await writeFile(join(LOGOS_DIR, file), Buffer.from(await res.arrayBuffer()));
    return { slug: company.slug, name: company.name, file };
  } catch (error) {
    console.warn(`[logos] skipped ${company.slug}: ${error.message}`);
    return null;
  }
}

async function downloadAll(companies) {
  const results = new Array(companies.length);
  let next = 0;
  const worker = async () => {
    while (next < companies.length) {
      const index = next++;
      results[index] = await downloadLogo(companies[index]);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results.filter(Boolean);
}

const companies = await fetchCompanies(readEnv());
await rm(LOGOS_DIR, { recursive: true, force: true });
await mkdir(LOGOS_DIR, { recursive: true });
await mkdir(dirname(MANIFEST), { recursive: true });

const logos = await downloadAll(sampleEvenly(companies, SAMPLE_SIZE));
if (logos.length === 0) throw new Error("no logo could be downloaded");

await writeFile(MANIFEST, `${JSON.stringify(logos, null, 2)}\n`, "utf8");
console.log(`[logos] saved ${logos.length} of ${companies.length} logos to ${LOGOS_DIR}`);
