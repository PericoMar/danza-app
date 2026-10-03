#!/usr/bin/env node
/**
 * Custom status line for Claude Code.
 * Reads the session JSON on stdin and prints one line with:
 *   project dir · git branch + dirty state · model · context usage % ·
 *   session cost · wall-clock duration · lines changed · output style
 *
 * Registered via .claude/settings.local.json -> statusLine.
 */

const fs = require("fs");
const { execFileSync } = require("child_process");

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";
const BLUE = "\x1b[34m";

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function safe(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Read only the last `bytes` of a file (transcripts can be tens of MB). */
function tailFile(file, bytes = 262144) {
  const fd = fs.openSync(file, "r");
  try {
    const { size } = fs.fstatSync(fd);
    const start = Math.max(0, size - bytes);
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    return buf.toString("utf8");
  } finally {
    fs.closeSync(fd);
  }
}

/** Approximate current context window occupancy from the transcript. */
function contextTokens(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;
  const lines = tailFile(transcriptPath).split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const u = obj && obj.message && obj.message.usage;
    if (u && typeof u.input_tokens === "number") {
      return (
        (u.input_tokens || 0) +
        (u.cache_creation_input_tokens || 0) +
        (u.cache_read_input_tokens || 0)
      );
    }
  }
  return null;
}

function gitInfo(dir) {
  const opts = { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] };
  const branch = safe(
    () => execFileSync("git", ["branch", "--show-current"], opts).trim(),
    ""
  );
  if (!branch) return null;
  const porcelain = safe(
    () => execFileSync("git", ["status", "--porcelain"], opts),
    ""
  );
  const dirty = porcelain.split("\n").filter((l) => l.trim()).length;
  const ahead = safe(
    () =>
      execFileSync(
        "git",
        ["rev-list", "--count", "--left-right", "@{upstream}...HEAD"],
        opts
      ).trim(),
    ""
  );
  let sync = "";
  if (ahead) {
    const [behind, aheadN] = ahead.split(/\s+/).map(Number);
    if (aheadN) sync += ` ${GREEN}↑${aheadN}${RESET}`;
    if (behind) sync += ` ${RED}↓${behind}${RESET}`;
  }
  return { branch, dirty, sync };
}

function bar(fraction, width = 10) {
  const filled = Math.max(0, Math.min(width, Math.round(fraction * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function fmtDuration(ms) {
  if (!ms || ms < 0) return null;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h${m % 60}m`;
}

function basename(p) {
  if (!p) return "";
  return p.replace(/[\\/]+$/, "").split(/[\\/]/).pop();
}

function main() {
  const raw = readStdin();
  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    /* fall through with empty data */
  }

  const parts = [];

  // Project directory
  const dir =
    (data.workspace && (data.workspace.current_dir || data.workspace.project_dir)) ||
    data.cwd ||
    process.cwd();
  parts.push(`${CYAN}📁 ${basename(dir)}${RESET}`);

  // Git
  const git = gitInfo(dir);
  if (git) {
    const dirtyMark = git.dirty ? `${YELLOW}*${git.dirty}${RESET}` : `${GREEN}✓${RESET}`;
    parts.push(`${MAGENTA}🌿 ${git.branch}${RESET}${dirtyMark}${git.sync}`);
  }

  // Model
  const model =
    (data.model && (data.model.display_name || data.model.id)) || "model";
  parts.push(`${BLUE}🧠 ${model}${RESET}`);

  // Context usage
  const limit = data.exceeds_200k_tokens ? 1000000 : 200000;
  const used = contextTokens(data.transcript_path);
  if (used != null) {
    const frac = used / limit;
    const pct = Math.round(frac * 100);
    const color = pct >= 85 ? RED : pct >= 60 ? YELLOW : GREEN;
    const k = (n) => `${Math.round(n / 1000)}k`;
    parts.push(
      `${color}${bar(frac)} ${pct}%${RESET} ${DIM}(${k(used)}/${k(limit)})${RESET}`
    );
  }

  // Cost + duration
  const cost = data.cost || {};
  if (typeof cost.total_cost_usd === "number") {
    parts.push(`${GREEN}💲${cost.total_cost_usd.toFixed(2)}${RESET}`);
  }
  const dur = fmtDuration(cost.total_duration_ms);
  if (dur) parts.push(`${DIM}⏱ ${dur}${RESET}`);

  // Lines changed
  const added = cost.total_lines_added || 0;
  const removed = cost.total_lines_removed || 0;
  if (added || removed) {
    parts.push(`${GREEN}+${added}${RESET}${DIM}/${RESET}${RED}-${removed}${RESET}`);
  }

  // Output style (only when not the default)
  const style = data.output_style && data.output_style.name;
  if (style && style !== "default") parts.push(`${DIM}✨ ${style}${RESET}`);

  process.stdout.write(parts.join(`  ${DIM}│${RESET}  `));
}

main();
