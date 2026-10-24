// Runs after `expo export --platform web`, preparing dist/ for how Vercel
// serves it. Expo names files after its own routing conventions; these
// fixes bridge the gap. Keep in step with the rewrites in vercel.json.

import { copyFile, rm, access, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIST = "dist";

/** Vercel serves this for any path that matches no file, with a 404 status. */
const NOT_FOUND_SOURCE = `${DIST}/+not-found.html`;
const NOT_FOUND_TARGET = `${DIST}/404.html`;

/**
 * A rewrite destination can't carry Expo's [param] brackets, so the shell for
 * unknown company ids gets a plain name. Companies known at build time have
 * their own file and are served before any rewrite is considered.
 */
const DYNAMIC_SHELLS = [
  { from: `${DIST}/insights/[company].html`, to: `${DIST}/insights/_dynamic.html` },
  { from: `${DIST}/companies/in/[countrySlug].html`, to: `${DIST}/companies/in/_dynamic.html` },
];

/** Expo Router's development route listing. Nothing to publish. */
const DEV_ONLY = [`${DIST}/_sitemap.html`];

/**
 * A route group only organises app/, but the export also writes every page
 * under the group's own folder: /(companies-listing)/companies/in/spain would
 * be served as a second address for /companies/in/spain. Nothing links there.
 */
const GROUP_COPIES = [`${DIST}/(companies-listing)`];

/**
 * Expo marks every page to be hydrated: React adopts the prerendered DOM as if
 * it had rendered it itself. It hasn't quite — layouts here are picked from the
 * window width, which is 0 during the export, so the HTML and the browser's
 * first render disagree. React 18 doesn't repair mismatched attributes (a
 * `max-width:0px` would stay), and a mismatched element makes it throw the
 * whole tree away anyway. Without the marker the prerendered page is still
 * what the visitor and the crawler see first; once the bundle runs, React
 * replaces it with its own render in a single commit.
 */
const HYDRATE_MARKER = "<script type=\"module\">globalThis.__EXPO_ROUTER_HYDRATE__=true;</script>";

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith(".html")) yield path;
  }
}

async function removeHydrateMarker() {
  let pages = 0;
  for await (const path of htmlFiles(DIST)) {
    const html = await readFile(path, "utf8");
    if (!html.includes(HYDRATE_MARKER)) continue;
    await writeFile(path, html.replace(HYDRATE_MARKER, ""));
    pages++;
  }
  if (pages === 0) {
    throw new Error("postbuild: no page carried Expo's hydrate marker. Did Expo change how it writes it?");
  }
  console.log(`postbuild: client render instead of hydration on ${pages} pages`);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function copyRequired(from, to) {
  if (!(await exists(from))) {
    throw new Error(`postbuild: expected ${from} in the export. Did a route get renamed?`);
  }
  await copyFile(from, to);
  console.log(`postbuild: ${from} -> ${to}`);
}

await copyRequired(NOT_FOUND_SOURCE, NOT_FOUND_TARGET);

for (const { from, to } of DYNAMIC_SHELLS) {
  await copyRequired(from, to);
}

for (const path of DEV_ONLY) {
  await rm(path, { force: true });
  console.log(`postbuild: removed ${path}`);
}

for (const path of GROUP_COPIES) {
  await rm(path, { recursive: true, force: true });
  console.log(`postbuild: removed ${path}`);
}

await removeHydrateMarker();
