// utils/richTextEditing.ts
// Lo que hace cada botón de la barra de formato sobre el texto y la selección.
// Los botones alternan: pulsar negrita sobre algo en negrita la quita.

import {
  RICH_TEXT_LINK_PLACEHOLDER,
  RICH_TEXT_MARKS,
  RichTextFormat,
} from "@/constants/richText";
import { BLOCK_PREFIX } from "@/utils/richText";

export type TextSelection = { start: number; end: number };
export type RichTextEdit = { value: string; selection: TextSelection };

/** Sustituye value[start, end) por `insert`. Siempre en coordenadas del texto original. */
type Change = { start: number; end: number; insert: string };

/** Con una inserción justo en la posición: ¿la posición queda antes o después? */
type Bias = "before" | "after";

type InlineMark = typeof RICH_TEXT_MARKS.BOLD | typeof RICH_TEXT_MARKS.ITALIC;

const LinePrefix = {
  HEADING_2: "heading2",
  HEADING_3: "heading3",
  BULLET: "bullet",
  ORDERED: "ordered",
  NONE: "none",
} as const;
type LinePrefix = (typeof LinePrefix)[keyof typeof LinePrefix];

const URL_ONLY = /^(?:https?:\/\/|mailto:)\S+$/i;

// ─── Cambios y selección ─────────────────────────────────────────────────────

function applyChanges(value: string, changes: Change[]): string {
  let out = "";
  let cursor = 0;
  for (const change of changes) {
    out += value.slice(cursor, change.start) + change.insert;
    cursor = change.end;
  }
  return out + value.slice(cursor);
}

function mapPosition(position: number, changes: Change[], bias: Bias): number {
  let mapped = position;
  for (const change of changes) {
    const delta = change.insert.length - (change.end - change.start);
    const isInsertion = change.start === change.end;
    if (isInsertion ? position > change.start || (position === change.start && bias === "after") : position >= change.end) {
      mapped += delta;
    } else if (!isInsertion && (position > change.start || (position === change.start && bias === "after"))) {
      // Dentro de un trozo sustituido: al final de lo que lo sustituye.
      mapped += change.start + change.insert.length - position;
    }
  }
  return mapped;
}

/** `changes` ordenados y sin solaparse. */
function edit(value: string, changes: Change[], selection: TextSelection, startBias: Bias, endBias: Bias): RichTextEdit {
  const sorted = [...changes].sort((a, b) => a.start - b.start);
  return {
    value: applyChanges(value, sorted),
    selection: {
      start: mapPosition(selection.start, sorted, startBias),
      end: mapPosition(selection.end, sorted, endBias),
    },
  };
}

// ─── Líneas ──────────────────────────────────────────────────────────────────

type Line = { start: number; end: number; prefixLength: number; prefix: LinePrefix };

function classifyPrefix(prefix: string): LinePrefix {
  const marker = prefix.trim();
  if (!marker) return LinePrefix.NONE;
  if (marker.startsWith("#")) return marker.length <= 2 ? LinePrefix.HEADING_2 : LinePrefix.HEADING_3;
  return /\d/.test(marker) ? LinePrefix.ORDERED : LinePrefix.BULLET;
}

/** Las líneas que toca la selección. Una selección que acaba al principio de una línea no la toca. */
function selectedLines(value: string, selection: TextSelection): Line[] {
  const lines: Line[] = [];
  let start = value.lastIndexOf("\n", selection.start - 1) + 1;
  while (true) {
    const newline = value.indexOf("\n", start);
    const end = newline === -1 ? value.length : newline;
    const prefix = BLOCK_PREFIX.exec(value.slice(start, end))?.[0] ?? "";
    lines.push({ start, end, prefixLength: prefix.length, prefix: classifyPrefix(prefix) });
    if (newline === -1 || newline + 1 >= selection.end) break;
    start = newline + 1;
  }
  return lines;
}

function isBlank(value: string, line: Line): boolean {
  return !value.slice(line.start + line.prefixLength, line.end).trim();
}

// ─── Negrita y cursiva ───────────────────────────────────────────────────────

function asteriskRun(value: string, from: number, step: 1 | -1): number {
  let run = 0;
  for (let i = from; value[i] === "*"; i += step) run++;
  return run;
}

// "***" es negrita y cursiva a la vez: la negrita se ve en 2 o más, la cursiva en un número impar.
function runHasMark(run: number, mark: InlineMark): boolean {
  return mark === RICH_TEXT_MARKS.BOLD ? run >= 2 : run % 2 === 1;
}

type Segment = { start: number; end: number };

/** Por cada línea, lo seleccionado sin la marca de bloque ni los espacios de los bordes. */
function selectedSegments(value: string, selection: TextSelection): Segment[] {
  return selectedLines(value, selection).flatMap((line) => {
    let start = Math.max(selection.start, line.start + line.prefixLength);
    let end = Math.min(selection.end, line.end);
    while (start < end && /\s/.test(value[start])) start++;
    while (end > start && /\s/.test(value[end - 1])) end--;
    return start < end ? [{ start, end }] : [];
  });
}

/** Dónde está ya la marca: rodeando la selección, dentro de ella, o en ninguna parte. */
function markPlacement(value: string, segment: Segment, mark: InlineMark): "outside" | "inside" | null {
  const before = asteriskRun(value, segment.start - 1, -1);
  const after = asteriskRun(value, segment.end, 1);
  if (runHasMark(before, mark) && runHasMark(after, mark)) return "outside";
  const leading = asteriskRun(value, segment.start, 1);
  const trailing = asteriskRun(value, segment.end - 1, -1);
  const hasContent = segment.end - segment.start > leading + trailing;
  if (hasContent && runHasMark(leading, mark) && runHasMark(trailing, mark)) return "inside";
  return null;
}

function toggleInlineMark(value: string, selection: TextSelection, mark: InlineMark): RichTextEdit {
  // Sin selección: las dos marcas con el cursor en medio, para escribir dentro.
  if (selection.start === selection.end) {
    const at = selection.start;
    const inside = at + mark.length;
    return { value: value.slice(0, at) + mark + mark + value.slice(at), selection: { start: inside, end: inside } };
  }

  const segments = selectedSegments(value, selection);
  if (!segments.length) return { value, selection };
  const placements = segments.map((segment) => markPlacement(value, segment, mark));
  const remove = placements.every(Boolean);
  const size = mark.length;

  const changes = segments.flatMap((segment, i): Change[] => {
    if (!remove) {
      return placements[i]
        ? []
        : [
            { start: segment.start, end: segment.start, insert: mark },
            { start: segment.end, end: segment.end, insert: mark },
          ];
    }
    return placements[i] === "outside"
      ? [
          { start: segment.start - size, end: segment.start, insert: "" },
          { start: segment.end, end: segment.end + size, insert: "" },
        ]
      : [
          { start: segment.start, end: segment.start + size, insert: "" },
          { start: segment.end - size, end: segment.end, insert: "" },
        ];
  });

  const content = { start: segments[0].start, end: segments[segments.length - 1].end };
  return edit(value, changes, content, "after", "before");
}

// ─── Títulos y listas ────────────────────────────────────────────────────────

const PREFIX_FOR_FORMAT = {
  [RichTextFormat.HEADING_2]: LinePrefix.HEADING_2,
  [RichTextFormat.HEADING_3]: LinePrefix.HEADING_3,
  [RichTextFormat.BULLET_LIST]: LinePrefix.BULLET,
  [RichTextFormat.NUMBERED_LIST]: LinePrefix.ORDERED,
} as const;
type LineFormat = keyof typeof PREFIX_FOR_FORMAT;

function prefixText(prefix: LinePrefix, index: number): string {
  switch (prefix) {
    case LinePrefix.HEADING_2:
      return RICH_TEXT_MARKS.HEADING_2;
    case LinePrefix.HEADING_3:
      return RICH_TEXT_MARKS.HEADING_3;
    case LinePrefix.BULLET:
      return RICH_TEXT_MARKS.BULLET;
    case LinePrefix.ORDERED:
      return `${index + 1}. `;
    case LinePrefix.NONE:
      return "";
  }
}

function toggleLinePrefix(value: string, selection: TextSelection, format: LineFormat): RichTextEdit {
  const wanted = PREFIX_FOR_FORMAT[format];
  const lines = selectedLines(value, selection);
  // Con varias líneas, las vacías se quedan como están (separan párrafos).
  const targets = lines.length > 1 ? lines.filter((line) => !isBlank(value, line)) : lines;
  if (!targets.length) return { value, selection };
  const remove = targets.every((line) => line.prefix === wanted);

  const changes = targets.flatMap((line, i): Change[] => {
    // Una viñeta "•" o un título ya puestos se respetan; los números se rehacen.
    if (!remove && line.prefix === wanted && wanted !== LinePrefix.ORDERED) return [];
    const insert = remove ? "" : prefixText(wanted, i);
    return [{ start: line.start, end: line.start + line.prefixLength, insert }];
  });
  return edit(value, changes, selection, "after", "after");
}

// ─── Enlaces ─────────────────────────────────────────────────────────────────

function insertLink(value: string, selection: TextSelection): RichTextEdit {
  const raw = value.slice(selection.start, selection.end);
  // Un enlace no cruza líneas: con varias seleccionadas se añade uno vacío al final.
  const multiline = raw.includes("\n");
  const start = multiline ? selection.end : selection.start + (raw.length - raw.trimStart().length);
  const end = multiline ? selection.end : selection.end - (raw.length - raw.trimEnd().length);
  const selected = value.slice(start, end);

  const { LABEL, URL } = RICH_TEXT_LINK_PLACEHOLDER;
  const isUrl = URL_ONLY.test(selected);
  const label = selected && !isUrl ? selected : LABEL;
  const url = isUrl ? selected : URL;
  const link = `[${label}](${url})`;

  // Queda seleccionado lo que falta por escribir: la URL si ya hay texto, si no el texto.
  const urlStart = start + label.length + 3;
  const next = selected && !isUrl
    ? { start: urlStart, end: urlStart + url.length }
    : { start: start + 1, end: start + 1 + label.length };
  return { value: value.slice(0, start) + link + value.slice(end), selection: next };
}

// ─── Entrada ─────────────────────────────────────────────────────────────────

export function applyRichTextFormat(value: string, selection: TextSelection, format: RichTextFormat): RichTextEdit {
  const clamp = (n: number) => Math.min(Math.max(n, 0), value.length);
  const range = {
    start: clamp(Math.min(selection.start, selection.end)),
    end: clamp(Math.max(selection.start, selection.end)),
  };
  switch (format) {
    case RichTextFormat.BOLD:
      return toggleInlineMark(value, range, RICH_TEXT_MARKS.BOLD);
    case RichTextFormat.ITALIC:
      return toggleInlineMark(value, range, RICH_TEXT_MARKS.ITALIC);
    case RichTextFormat.LINK:
      return insertLink(value, range);
    default:
      return toggleLinePrefix(value, range, format);
  }
}
