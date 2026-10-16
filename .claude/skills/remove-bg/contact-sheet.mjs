#!/usr/bin/env node
/**
 * Renders the logos a dry run of scripts/remove-logo-backgrounds.mjs would
 * upload as PNG contact sheets, so an agent can review them by looking. One row
 * per logo: original · result on the card's logo panel · result on a
 * checkerboard (where halos and leftover background show).
 *
 *   node .claude/skills/remove-bg/contact-sheet.mjs <dry-run dir>
 *
 * Writes <dir>/sheets/sheet-N.png and prints each path followed by the name
 * and id of the logos on it.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const APPLICABLE = new Set(['processed', 'mostly-empty']); // statuses the apply step uploads
const MOSTLY_EMPTY = 'mostly-empty';
const MANIFEST_FILE = 'manifest.json';
const SHEETS_FOLDER = 'sheets';
const PANEL_COLOR = '#f6f6f7'; // Colors.card, the logo panel behind every card logo
const PAGE_COLOR = '#ffffff';
const USER_AGENT = 'danza-app-logo-tool/1.0'; // some hosts (Wikimedia) reject requests without one
const FETCH_TIMEOUT_MS = 20_000;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const CELL = { width: 240, height: 140 };
const LOGO_SHARE = 0.8; // share of the cell the logo is fitted into
const GAP = 6;
const LABEL_HEIGHT = 22;
const COLUMNS = 3;
const SHEET_WIDTH = COLUMNS * CELL.width + (COLUMNS - 1) * GAP;
const ROW_HEIGHT = LABEL_HEIGHT + CELL.height + GAP;
const ROWS_PER_SHEET = 8; // keeps each logo large enough to judge edges

const xmlEscape = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

const solid = (color) => sharp({ create: { ...CELL, channels: 4, background: color } }).png().toBuffer();

function checkerboard() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL.width}" height="${CELL.height}">
    <defs><pattern id="c" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#fff"/><rect width="8" height="8" fill="#ccc"/><rect x="8" y="8" width="8" height="8" fill="#ccc"/>
    </pattern></defs><rect width="100%" height="100%" fill="url(#c)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

const fitLogo = (input) =>
  sharp(input)
    .resize(Math.round(CELL.width * LOGO_SHARE), Math.round(CELL.height * LOGO_SHARE), { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();

// The original as the card showed it; null when it can no longer be downloaded.
async function original(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const flat = await sharp(Buffer.from(await res.arrayBuffer())).flatten({ background: PAGE_COLOR }).png().toBuffer();
    return fitLogo(flat);
  } catch {
    return null;
  }
}

const place = (backdrop, logo) =>
  logo ? sharp(backdrop).composite([{ input: logo, gravity: 'center' }]).png().toBuffer() : backdrop;

function label(entry) {
  const notes = [entry.status === MOSTLY_EMPTY && 'casi todo era fondo', entry.lowResolution && 'baja resolución'].filter(Boolean);
  const text = `${entry.name}${notes.length ? ` (${notes.join(', ')})` : ''}`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET_WIDTH}" height="${LABEL_HEIGHT}">
    <text x="4" y="16" font-family="sans-serif" font-size="14" fill="#111">${xmlEscape(text)}</text></svg>`);
}

async function renderRow(dir, entry, backdrops) {
  const result = await fitLogo(path.join(dir, entry.processedFile));
  const cells = [
    await place(backdrops.panel, await original(entry.originalUrl)),
    await place(backdrops.panel, result),
    await place(backdrops.checker, result),
  ];
  return sharp({ create: { width: SHEET_WIDTH, height: ROW_HEIGHT, channels: 4, background: PAGE_COLOR } })
    .composite([
      { input: label(entry), left: 0, top: 0 },
      ...cells.map((input, i) => ({ input, left: i * (CELL.width + GAP), top: LABEL_HEIGHT })),
    ])
    .png()
    .toBuffer();
}

async function main() {
  if (!process.argv[2]) throw new Error('Uso: node .claude/skills/remove-bg/contact-sheet.mjs <carpeta de la prueba>');
  const dir = path.resolve(process.argv[2]);
  const manifest = JSON.parse(await fs.readFile(path.join(dir, MANIFEST_FILE), 'utf8'));
  const entries = manifest.filter((r) => APPLICABLE.has(r.status) && r.processedFile);
  if (!entries.length) {
    console.log('Nada que revisar.');
    return;
  }

  const backdrops = { panel: await solid(PANEL_COLOR), checker: await checkerboard() };
  await fs.mkdir(path.join(dir, SHEETS_FOLDER), { recursive: true });
  for (let start = 0; start < entries.length; start += ROWS_PER_SHEET) {
    const chunk = entries.slice(start, start + ROWS_PER_SHEET);
    const rows = await Promise.all(chunk.map((entry) => renderRow(dir, entry, backdrops)));
    const file = path.join(dir, SHEETS_FOLDER, `sheet-${start / ROWS_PER_SHEET + 1}.png`);
    await sharp({ create: { width: SHEET_WIDTH, height: ROW_HEIGHT * rows.length, channels: 4, background: PAGE_COLOR } })
      .composite(rows.map((input, i) => ({ input, left: 0, top: i * ROW_HEIGHT })))
      .png()
      .toFile(file);
    console.log(file);
    for (const entry of chunk) console.log(`  ${entry.name}  ${entry.id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
