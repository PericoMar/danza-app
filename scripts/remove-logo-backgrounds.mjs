#!/usr/bin/env node
/**
 * Removes the flat white background from company logos so they sit cleanly on
 * the card's grey logo panel instead of showing as a white rectangle.
 *
 * Only the white that is connected to the image border is removed, so white
 * shapes inside a logo (letters inside a black circle, etc.) survive. The
 * 1–2 px anti-aliased fringe around the logo is un-blended from white rather
 * than cut, which avoids a light halo.
 *
 * Three steps, each a separate run:
 *
 * 1. Dry run (default): downloads every logo, processes it locally and writes
 *    a before/after review page (index.html) plus manifest.json to --out.
 *    Nothing in Supabase is touched.
 *
 *      node scripts/remove-logo-backgrounds.mjs [--out <dir>] [--only <id,...>]
 *
 * 2. Apply: uploads the reviewed results from a dry run's manifest and points
 *    each company at its new logo. A company whose logo changed since the dry
 *    run is skipped. Old files stay in Storage so the run can be undone.
 *    Needs SUPABASE_SERVICE_ROLE_KEY.
 *
 *      node scripts/remove-logo-backgrounds.mjs --apply <dir> [--only <id,...>] [--exclude <id,...>]
 *
 * 3. Rollback: restores the previous logo URLs recorded by an apply run and
 *    removes the uploaded files.
 *
 *      node scripts/remove-logo-backgrounds.mjs --rollback <dir>
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const COMPANIES_TABLE = 'companies';
const STORAGE_BUCKET = 'media'; // STORAGE_BUCKETS.MEDIA
const LOGO_FOLDER = 'companies'; // same folder app/companies/form.tsx uploads logos to
const MANIFEST_FILE = 'manifest.json';
const APPLIED_FILE = 'applied.json';
const USER_AGENT = 'danza-app-logo-tool/1.0'; // some hosts (Wikimedia) reject requests without one
const PANEL_COLOR = '#f6f6f7'; // Colors.card, the logo panel behind every card logo
const DECODE_MAX_SIZE = 2048; // sources are processed at full resolution up to this, then trimmed
const MAX_SIZE = 512; // longest edge of the saved logo, same cap the upload path uses (compressImage maxSize)
// The card "contain"s the logo in 58% of its 160px panel: ~93px tall and, for
// cards ~300–380px wide, ~200px wide (CSS px).
const LOGO_BOX = { width: 200, height: 93 };
// Max CSS px per source pixel the card may stretch a logo to. 0.5 is crisp on
// retina but keeps small logos small; 1 is bigger but visibly soft.
const MAX_DISPLAY_SCALE = 0.75;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const LOSSLESS_MAX_BYTES = 64 * 1024; // above this (detailed emblems), use high-quality lossy instead
const LOSSY_QUALITY = 92;
const WHITE_TOLERANCE = 24; // max per-channel distance from pure white still treated as background
const EDGE_BAND = 2; // px around the background whose white fringe gets un-blended
const MIN_WHITE_BORDER = 0.6; // share of border pixels that must be white to call it a white background
const OPAQUE_ALPHA = 250; // below this a pixel counts as already transparent
const MIN_TRANSPARENT_SHARE = 0.02; // logos with this much transparency already are left alone
const WHITE_ON_TRANSPARENT = 0.8; // share of opaque pixels that are white: invisible on a light panel
const MOSTLY_EMPTY = 0.97; // background share above which the result is suspicious
const VISIBLE_ALPHA = 8; // alpha that counts as content when trimming
const TRIM_PADDING = 0.04; // padding kept around the trimmed logo, as a share of its longest edge
const CONCURRENCY = 8;
const FETCH_TIMEOUT_MS = 20_000;

const Status = {
  PROCESSED: 'processed',
  MOSTLY_EMPTY: 'mostly-empty',
  ALREADY_TRANSPARENT: 'already-transparent',
  WHITE_ON_TRANSPARENT: 'white-on-transparent',
  NOT_WHITE_BACKGROUND: 'not-white-background',
  SVG: 'svg',
  NO_LOGO: 'no-logo',
  ERROR: 'error',
};

const STATUS_LABELS = {
  [Status.PROCESSED]: 'Fondo blanco quitado',
  [Status.MOSTLY_EMPTY]: 'Revisar: casi todo era fondo',
  [Status.WHITE_ON_TRANSPARENT]: 'Logo blanco sobre transparente (invisible en panel claro)',
  [Status.ALREADY_TRANSPARENT]: 'Ya tenía transparencia',
  [Status.NOT_WHITE_BACKGROUND]: 'Fondo no blanco (foto o color)',
  [Status.SVG]: 'SVG (no se toca)',
  [Status.ERROR]: 'Error al descargar o leer',
  [Status.NO_LOGO]: 'Sin logo',
};

// Statuses whose result is worth uploading.
const APPLICABLE = new Set([Status.PROCESSED, Status.MOSTLY_EMPTY]);

const idList = (value) => new Set(value.split(','));

function parseArgs(argv) {
  const args = { out: path.join(os.tmpdir(), 'danza-logo-nobg'), only: null, exclude: new Set() };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') args.out = path.resolve(argv[++i]);
    else if (argv[i] === '--only') args.only = idList(argv[++i]);
    else if (argv[i] === '--exclude') args.exclude = idList(argv[++i]);
    else if (argv[i] === '--apply') args.apply = path.resolve(argv[++i]);
    else if (argv[i] === '--rollback') args.rollback = path.resolve(argv[++i]);
  }
  return args;
}

function supabaseClient({ admin = false } = {}) {
  const keyName = admin ? 'SUPABASE_SERVICE_ROLE_KEY' : 'EXPO_PUBLIC_SUPABASE_ANON_KEY';
  const key = process.env[keyName];
  if (!key) throw new Error(`${keyName} is missing from .env`);
  // Keys copied from the dashboard's truncated view end in "…" and fail later with a cryptic ByteString error.
  if (/[^\x21-\x7e]/.test(key)) throw new Error(`${keyName} in .env looks truncated or has stray characters; copy the full key again`);
  return createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
}

async function fetchCompanies(only) {
  const supabase = supabaseClient();
  const { data, error } = await supabase
    .from(COMPANIES_TABLE)
    .select('id, name, image')
    .order('name');
  if (error) throw error;
  return only ? data.filter((c) => only.has(c.id)) : data;
}

async function download(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return {
    bytes: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') ?? '',
  };
}

function isSvg({ bytes, contentType }) {
  if (contentType.includes('svg')) return true;
  const head = bytes.subarray(0, 512).toString('utf8').trimStart();
  return head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'));
}

// Per-channel distance from pure white: 0 for white, 255 when any channel is 0.
const distanceFromWhite = (px, i) => 255 - Math.min(px[i], px[i + 1], px[i + 2]);

function borderIndices(width, height) {
  const indices = [];
  for (let x = 0; x < width; x++) indices.push(x, (height - 1) * width + x);
  for (let y = 1; y < height - 1; y++) indices.push(y * width, y * width + width - 1);
  return indices;
}

// Background = every near-white pixel reachable from the border (4-connected).
function floodBackground(px, width, height, seeds) {
  const bg = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const visit = (p) => {
    if (bg[p] || distanceFromWhite(px, p * 4) > WHITE_TOLERANCE) return;
    bg[p] = 1;
    queue[tail++] = p;
  };
  seeds.forEach(visit);
  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    if (x > 0) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    if (p >= width) visit(p - width);
    if (p < width * (height - 1)) visit(p + width);
  }
  return { bg, count: tail };
}

// Marks the non-background pixels within EDGE_BAND steps of the background.
function edgeBand(bg, width, height) {
  const band = new Uint8Array(width * height);
  let frontier = [];
  for (let p = 0; p < bg.length; p++) if (bg[p]) frontier.push(p);
  for (let step = 0; step < EDGE_BAND; step++) {
    const next = [];
    for (const p of frontier) {
      const x = p % width;
      const neighbours = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        p >= width ? p - width : -1,
        p < width * (height - 1) ? p + width : -1,
      ];
      for (const q of neighbours) {
        if (q < 0 || bg[q] || band[q]) continue;
        band[q] = 1;
        next.push(q);
      }
    }
    frontier = next;
  }
  return band;
}

// "Colour to alpha" against white: the least transparent pixel that, laid over
// white, reproduces the original colour. Removes the white fringe of
// anti-aliased edges without eating the logo.
function unblendFromWhite(px, i) {
  const alpha = distanceFromWhite(px, i) / 255;
  if (alpha === 0) {
    px[i + 3] = 0;
    return;
  }
  for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.round(255 - (255 - px[i + c]) / alpha));
  px[i + 3] = Math.round(px[i + 3] * alpha);
}

function contentBox(px, width, height) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (px[(y * width + x) * 4 + 3] < VISIBLE_ALPHA) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < 0) return null;
  const pad = Math.round(Math.max(right - left, bottom - top) * TRIM_PADDING);
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  return {
    left,
    top,
    width: Math.min(width, right + pad + 1) - left,
    height: Math.min(height, bottom + pad + 1) - top,
  };
}

function transparencyStats(px) {
  let transparent = 0;
  let opaque = 0;
  let opaqueWhite = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < OPAQUE_ALPHA) transparent++;
    else {
      opaque++;
      if (distanceFromWhite(px, i) <= WHITE_TOLERANCE) opaqueWhite++;
    }
  }
  return {
    transparentShare: transparent / (px.length / 4),
    opaqueWhiteShare: opaque ? opaqueWhite / opaque : 0,
  };
}

// Transparent margin that stops the card from stretching a small logo past
// MAX_DISPLAY_SCALE; null when the logo already has enough pixels. Trimming the
// white margin makes a logo render bigger, which exposes low-resolution sources.
function upscalePadding(width, height) {
  const displayScale = Math.min(LOGO_BOX.width / width, LOGO_BOX.height / height);
  const factor = displayScale / MAX_DISPLAY_SCALE;
  if (factor <= 1) return null;
  const x = Math.round((width * factor - width) / 2);
  const y = Math.round((height * factor - height) / 2);
  return { left: x, right: x, top: y, bottom: y, background: TRANSPARENT };
}

async function removeWhiteBackground(bytes) {
  const { data: px, info } = await sharp(bytes, { animated: false })
    .rotate()
    .resize(DECODE_MAX_SIZE, DECODE_MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const { transparentShare, opaqueWhiteShare } = transparencyStats(px);
  if (transparentShare >= MIN_TRANSPARENT_SHARE) {
    return {
      status: opaqueWhiteShare >= WHITE_ON_TRANSPARENT
        ? Status.WHITE_ON_TRANSPARENT
        : Status.ALREADY_TRANSPARENT,
    };
  }

  const border = borderIndices(width, height);
  const whiteBorder = border.filter((p) => distanceFromWhite(px, p * 4) <= WHITE_TOLERANCE);
  if (whiteBorder.length / border.length < MIN_WHITE_BORDER) {
    return { status: Status.NOT_WHITE_BACKGROUND };
  }

  const { bg, count } = floodBackground(px, width, height, whiteBorder);
  const band = edgeBand(bg, width, height);
  for (let p = 0; p < bg.length; p++) {
    if (bg[p]) px[p * 4 + 3] = 0;
    else if (band[p]) unblendFromWhite(px, p * 4);
  }

  const backgroundShare = count / (width * height);
  const box = contentBox(px, width, height);
  if (!box) return { status: Status.MOSTLY_EMPTY, backgroundShare };

  const trimmed = await sharp(px, { raw: { width, height, channels: 4 } })
    .extract(box)
    .resize(MAX_SIZE, MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: trimmedWidth, height: trimmedHeight, channels } = trimmed.info;
  const padding = upscalePadding(trimmedWidth, trimmedHeight);
  let image = sharp(trimmed.data, { raw: { width: trimmedWidth, height: trimmedHeight, channels } });
  if (padding) image = image.extend(padding);
  // Lossless keeps flat logos sharp; detailed emblems compress badly that way,
  // and at their size lossy artefacts are invisible.
  let output = await image.clone().webp({ lossless: true }).toBuffer();
  if (output.length > LOSSLESS_MAX_BYTES) {
    output = await image.webp({ quality: LOSSY_QUALITY, alphaQuality: 100 }).toBuffer();
  }
  return {
    status: backgroundShare > MOSTLY_EMPTY ? Status.MOSTLY_EMPTY : Status.PROCESSED,
    backgroundShare,
    lowResolution: !!padding,
    output,
  };
}

async function processCompany(company, outDir) {
  const base = { id: company.id, name: company.name, originalUrl: company.image };
  if (!company.image) return { ...base, status: Status.NO_LOGO };
  try {
    const file = await download(company.image);
    if (isSvg(file)) return { ...base, status: Status.SVG };
    const { output, ...result } = await removeWhiteBackground(file.bytes);
    if (!output) return { ...base, ...result };
    const processedFile = `processed/${company.id}.webp`;
    await fs.writeFile(path.join(outDir, processedFile), output);
    return { ...base, ...result, processedFile };
  } catch (e) {
    return { ...base, status: Status.ERROR, error: e.message };
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
      process.stdout.write(`\r${++done}/${items.length}`);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  process.stdout.write('\n');
  return results;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function renderReview(results) {
  const order = Object.keys(STATUS_LABELS);
  const sections = order
    .map((status) => {
      const rows = results.filter((r) => r.status === status);
      if (!rows.length) return '';
      const cards = rows
        .map((r) => {
          const before = r.originalUrl
            ? `<div class="panel"><img src="${escapeHtml(r.originalUrl)}" loading="lazy"></div>`
            : '<div class="panel"></div>';
          const after = r.processedFile
            ? `<div class="panel"><img src="${r.processedFile}" loading="lazy"></div>
               <div class="panel checker"><img src="${r.processedFile}" loading="lazy"></div>`
            : '';
          const share = r.backgroundShare != null ? ` · fondo ${(r.backgroundShare * 100).toFixed(0)}%` : '';
          const lowRes = r.lowResolution ? ' · <b>baja resolución: conviene buscar un logo mejor</b>' : '';
          return `<figure><figcaption>${escapeHtml(r.name)}<small>${escapeHtml(r.id)}${share}${lowRes}${r.error ? ` · ${escapeHtml(r.error)}` : ''}</small></figcaption><div class="row">${before}${after}</div></figure>`;
        })
        .join('');
      return `<section><h2>${STATUS_LABELS[status]} (${rows.length})</h2><div class="grid">${cards}</div></section>`;
    })
    .join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Logos sin fondo</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; margin: 24px; background: #fff; color: #111; }
  h2 { margin-top: 40px; font-size: 18px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(560px, 1fr)); gap: 16px; }
  figure { margin: 0; border: 1px solid #e2e2e4; border-radius: 12px; padding: 12px; }
  figcaption { font-weight: 600; font-size: 14px; margin-bottom: 8px; }
  figcaption small { display: block; font-weight: 400; color: #888; font-size: 11px; }
  figcaption small b { color: #b45309; font-weight: 600; }
  .row { display: flex; gap: 8px; }
  .panel { flex: 1; height: 160px; background: ${PANEL_COLOR}; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
  .panel img { width: 58%; height: 58%; object-fit: contain; }
  .checker { background: repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 0 0 / 16px 16px; }
</style></head><body>
<h1>Logos: antes / después</h1>
<p>Cada fila: original en el panel de la tarjeta · resultado en el panel · resultado sobre cuadrícula (para ver halos).</p>
${sections}
</body></html>`;
}

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

async function readApplied(dir) {
  try {
    return await readJson(path.join(dir, APPLIED_FILE));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function applyLogo(supabase, dir, entry) {
  const base = { id: entry.id, name: entry.name };
  try {
    const bytes = await fs.readFile(path.join(dir, entry.processedFile));
    const storagePath = `${LOGO_FOLDER}/${entry.id}/${Date.now()}-logo-nobg.webp`;
    const bucket = supabase.storage.from(STORAGE_BUCKET);
    const { error: uploadError } = await bucket.upload(storagePath, bytes, { contentType: 'image/webp' });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = bucket.getPublicUrl(storagePath);

    // Only swap when the company still points at the logo we processed.
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .update({ image: publicUrl })
      .eq('id', entry.id)
      .eq('image', entry.originalUrl)
      .select('id');
    if (error || !data.length) {
      await bucket.remove([storagePath]);
      if (error) throw error;
      return { ...base, skipped: 'el logo cambió desde la prueba' };
    }
    return { ...base, previousUrl: entry.originalUrl, newUrl: publicUrl, storagePath };
  } catch (e) {
    return { ...base, error: e.message };
  }
}

async function rollbackLogo(supabase, record) {
  try {
    const { data, error } = await supabase
      .from(COMPANIES_TABLE)
      .update({ image: record.previousUrl })
      .eq('id', record.id)
      .eq('image', record.newUrl)
      .select('id');
    if (error) throw error;
    if (!data.length) return { ...record, error: 'el logo cambió después de aplicar; no se toca' };
    const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove([record.storagePath]);
    if (removeError) console.warn(`\n${record.name}: restaurado, pero no se pudo borrar ${record.storagePath}`);
    return { ...record, restored: true };
  } catch (e) {
    return { ...record, error: e.message };
  }
}

function reportFailures(results) {
  for (const r of results) {
    if (r.skipped) console.log(`  saltado  ${r.name}: ${r.skipped}`);
    if (r.error) console.log(`  error    ${r.name}: ${r.error}`);
  }
}

async function readManifest(dir) {
  try {
    return await readJson(path.join(dir, MANIFEST_FILE));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    throw new Error(`No hay ${MANIFEST_FILE} en ${dir}. Genera antes la prueba: node scripts/remove-logo-backgrounds.mjs --out ${dir}`);
  }
}

async function apply(dir, { only, exclude }) {
  const manifest = await readManifest(dir);
  const entries = manifest.filter(
    (r) => APPLICABLE.has(r.status) && r.processedFile && (!only || only.has(r.id)) && !exclude.has(r.id),
  );
  const supabase = supabaseClient({ admin: true });

  console.log(`Aplicando ${entries.length} logos…`);
  const results = await mapWithConcurrency(entries, CONCURRENCY, (e) => applyLogo(supabase, dir, e));
  const applied = results.filter((r) => r.newUrl);
  // Append so a second run never loses the rollback data of the first.
  const previous = await readApplied(dir);
  await fs.writeFile(path.join(dir, APPLIED_FILE), JSON.stringify([...previous, ...applied], null, 2));

  console.log(`${applied.length} actualizados.`);
  reportFailures(results);
  console.log(`\nPara deshacer: node scripts/remove-logo-backgrounds.mjs --rollback ${dir}`);
}

async function rollback(dir) {
  const records = await readApplied(dir);
  const supabase = supabaseClient({ admin: true });

  console.log(`Restaurando ${records.length} logos…`);
  const results = await mapWithConcurrency(records, CONCURRENCY, (r) => rollbackLogo(supabase, r));
  // Keep only what could not be restored, so the rollback can be retried.
  const pending = results.filter((r) => !r.restored).map(({ error, ...record }) => record);
  await fs.writeFile(path.join(dir, APPLIED_FILE), JSON.stringify(pending, null, 2));

  console.log(`${results.length - pending.length} restaurados.`);
  reportFailures(results);
}

async function dryRun(out, only) {
  await fs.mkdir(path.join(out, 'processed'), { recursive: true });

  const companies = await fetchCompanies(only);
  console.log(`Procesando ${companies.length} logos…`);
  const results = await mapWithConcurrency(companies, CONCURRENCY, (c) => processCompany(c, out));

  await fs.writeFile(path.join(out, MANIFEST_FILE), JSON.stringify(results, null, 2));
  await fs.writeFile(path.join(out, 'index.html'), renderReview(results));

  const counts = Object.groupBy(results, (r) => r.status);
  for (const status of Object.keys(STATUS_LABELS)) {
    if (counts[status]) console.log(`${String(counts[status].length).padStart(4)}  ${STATUS_LABELS[status]}`);
  }
  const lowResolution = results.filter((r) => r.lowResolution).length;
  if (lowResolution) console.log(`\n${lowResolution} con baja resolución: no se amplían; están marcados en la revisión.`);
  console.log(`\nRevisión: ${path.join(out, 'index.html')}`);
  console.log(`Para aplicar: node scripts/remove-logo-backgrounds.mjs --apply ${out} [--exclude <id,...>]`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.apply) await apply(args.apply, args);
  else if (args.rollback) await rollback(args.rollback);
  else await dryRun(args.out, args.only);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
