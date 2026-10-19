// Runs after `expo export --platform web`, preparing dist/ for how Vercel
// serves it. Expo names files after its own routing conventions; these
// fixes bridge the gap. Keep in step with the rewrites in vercel.json.

import { copyFile, rm, access } from "node:fs/promises";

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
