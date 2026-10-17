// Renders scripts/og-image.html into public/og-default.png — the image that
// shows when someone pastes a danza-app.com link into WhatsApp, Instagram or X.
//
// Rendered in a browser rather than composed with an image library because the
// card is the Companies hero: it needs Inter and a gradient clipped to the text,
// and a browser is the thing that already knows how to draw both.
//
// Needs Google Chrome on the machine. Run it after editing the HTML:
//   pnpm og:image

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Facebook, X, WhatsApp and LinkedIn all crop towards 1.91:1.
const WIDTH = 1200;
const HEIGHT = 630;
const OUTPUT = resolve("public/og-default.png");
const SOURCE = resolve("scripts/og-image.html");
const CHROME = process.env.CHROME_PATH ?? "google-chrome";

const profile = mkdtempSync(join(tmpdir(), "og-"));
try {
  const result = spawnSync(CHROME, [
    "--headless=new",
    "--no-sandbox",
    "--hide-scrollbars",
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    // The webfont is fetched over the network; without the wait it renders in a
    // fallback family and the headline's metrics are wrong.
    "--virtual-time-budget=6000",
    `--screenshot=${OUTPUT}`,
    `file://${SOURCE}`,
  ], { encoding: "utf8" });

  if (result.error) {
    throw new Error(`could not run ${CHROME}: ${result.error.message}. Set CHROME_PATH.`);
  }
  if (result.status !== 0) {
    throw new Error(`${CHROME} exited with ${result.status}: ${result.stderr?.trim()}`);
  }
} finally {
  rmSync(profile, { recursive: true, force: true });
}

console.log(`Wrote ${OUTPUT} (${WIDTH}x${HEIGHT})`);
