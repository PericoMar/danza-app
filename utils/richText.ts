// utils/richText.ts
// Lee el texto con formato de las descripciones (un subconjunto de Markdown) en
// bloques para pintarlo, o lo pasa a texto plano (calendario).
// Hecho a medida del texto que ya había en prod: cada salto de línea cuenta,
// "•" es viñeta y los "*" o "_" sueltos (notas al pie, URLs) se ven tal cual.

import { RICH_TEXT_BULLET, RichTextBlockType } from "@/constants/richText";

export type RichTextSpan = { text: string; bold?: boolean; italic?: boolean; href?: string };
export type RichTextListItem = { marker: string; spans: RichTextSpan[] };

/** `spaced`: una línea en blanco lo separa del bloque anterior. */
export type RichTextBlock =
  | { type: typeof RichTextBlockType.HEADING; level: 2 | 3; spans: RichTextSpan[]; spaced: boolean }
  | { type: typeof RichTextBlockType.PARAGRAPH; lines: RichTextSpan[][]; spaced: boolean }
  | { type: typeof RichTextBlockType.LIST; ordered: boolean; items: RichTextListItem[]; spaced: boolean };

type SpanStyle = Omit<RichTextSpan, "text">;

const LINE_BREAK = /\r\n?|[\u2028\u2029]/g;
// "#" y "##" se ven igual: la página ya tiene su propio título.
const HEADING_LINE = /^ {0,3}(#{1,6})[ \t]+(\S.*)$/;
const BULLET_LINE = /^[ \t]*[-*•][ \t]+(.*)$/;
const ORDERED_LINE = /^[ \t]*(\d{1,3}[.)])[ \t]+(.*)$/;
/** Marca de bloque al principio de una línea (título o lista), con sus espacios. */
export const BLOCK_PREFIX = /^[ \t]*(?:#{1,6}[ \t]+|[-*•][ \t]+|\d{1,3}[.)][ \t]+)/;

// Sticky: se prueban solo en la posición `lastIndex`.
const LINK = /\[([^\]]+)\]\(\s*((?:https?:\/\/|mailto:)[^\s)]+)\s*\)/y;
const URL = /https?:\/\/[^\s<>"]+/y;
const BOLD = /\*\*(?=\S)(.*?\S)\*\*(?!\*)/y;
const ITALIC_STAR = /\*(?=[^\s*])([^*]*?[^\s*])\*(?!\*)/y;
const ITALIC_UNDERSCORE = /_(?=[^\s_])([^_]*?[^\s_])_(?![A-Za-z0-9À-ɏ])/y;
// Un "_" dentro de una palabra (snake_case, @usuario_x) no abre cursiva.
const WORD_CHAR = /[A-Za-z0-9À-ɏ]/;
// "\*" escribe un asterisco: vale para cualquier signo de puntuación ASCII y "•".
const ESCAPABLE = /[!-\/:-@\[-`{-~•]/;
// Puntuación que cierra la frase, no la URL: "visit https://x.com."
const URL_TRAILING = ".,;:!?'\"*_]";

function execAt(pattern: RegExp, text: string, index: number): RegExpExecArray | null {
  pattern.lastIndex = index;
  return pattern.exec(text);
}

function count(text: string, char: string): number {
  return text.split(char).length - 1;
}

function trimUrl(url: string): string {
  let end = url.length;
  while (end > 0) {
    const last = url[end - 1];
    const unbalancedParen = last === ")" && count(url.slice(0, end), "(") < count(url.slice(0, end), ")");
    if (!URL_TRAILING.includes(last) && !unbalancedParen) break;
    end--;
  }
  return url.slice(0, end);
}

function parseInline(text: string, style: SpanStyle = {}): RichTextSpan[] {
  const spans: RichTextSpan[] = [];
  let plain = "";
  const flush = () => {
    if (plain) spans.push({ ...style, text: plain });
    plain = "";
  };
  const nest = (inner: string, extra: SpanStyle) => {
    flush();
    spans.push(...parseInline(inner, { ...style, ...extra }));
  };

  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const prev = text[i - 1] ?? "";

    if (char === "\\" && ESCAPABLE.test(text[i + 1] ?? "")) {
      plain += text[i + 1];
      i += 2;
      continue;
    }
    if (char === "[" && !style.href) {
      const link = execAt(LINK, text, i);
      if (link) {
        nest(link[1], { href: link[2] });
        i += link[0].length;
        continue;
      }
    }
    if (char === "h" && !style.href && !WORD_CHAR.test(prev)) {
      const match = execAt(URL, text, i);
      const url = match ? trimUrl(match[0]) : "";
      if (url.length > url.indexOf("//") + 2) {
        flush();
        spans.push({ ...style, text: url, href: url });
        i += url.length;
        continue;
      }
    }
    if (char === "*") {
      const bold = execAt(BOLD, text, i);
      if (bold) {
        nest(bold[1], { bold: true });
        i += bold[0].length;
        continue;
      }
      const italic = execAt(ITALIC_STAR, text, i);
      if (italic) {
        nest(italic[1], { italic: true });
        i += italic[0].length;
        continue;
      }
    }
    if (char === "_" && !WORD_CHAR.test(prev)) {
      const italic = execAt(ITALIC_UNDERSCORE, text, i);
      if (italic) {
        nest(italic[1], { italic: true });
        i += italic[0].length;
        continue;
      }
    }
    plain += char;
    i++;
  }
  flush();
  return spans;
}

function parseListItem(line: string): { ordered: boolean; item: RichTextListItem } | null {
  const bullet = BULLET_LINE.exec(line);
  if (bullet) return { ordered: false, item: { marker: RICH_TEXT_BULLET, spans: parseInline(bullet[1]) } };
  const ordered = ORDERED_LINE.exec(line);
  if (ordered) return { ordered: true, item: { marker: ordered[1], spans: parseInline(ordered[2]) } };
  return null;
}

export function parseRichText(source: string): RichTextBlock[] {
  const blocks: RichTextBlock[] = [];
  // Bloque al que se suman las líneas siguientes (párrafo o lista). El `as`
  // evita que TS lo deje fijo en `null` dentro del bucle.
  let open = null as RichTextBlock | null;
  let spaced = false;

  for (const raw of source.replace(LINE_BREAK, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      spaced = blocks.length > 0;
      open = null;
      continue;
    }

    const heading = HEADING_LINE.exec(line);
    let listItem = heading ? null : parseListItem(line);
    // Una lista numerada nueva empieza por 1: "WHEN:\n24. may 2026" es una fecha, no una lista.
    const continuesList = open?.type === RichTextBlockType.LIST && open.ordered;
    if (listItem?.ordered && !continuesList && parseInt(listItem.item.marker, 10) !== 1) {
      listItem = null;
    }
    if (heading) {
      const level = heading[1].length <= 2 ? 2 : 3;
      blocks.push({ type: RichTextBlockType.HEADING, level, spans: parseInline(heading[2]), spaced });
      open = null;
    } else if (listItem) {
      if (open?.type === RichTextBlockType.LIST && open.ordered === listItem.ordered) {
        open.items.push(listItem.item);
      } else {
        open = { type: RichTextBlockType.LIST, ordered: listItem.ordered, items: [listItem.item], spaced };
        blocks.push(open);
      }
    } else if (open?.type === RichTextBlockType.PARAGRAPH) {
      open.lines.push(parseInline(line));
    } else {
      open = { type: RichTextBlockType.PARAGRAPH, lines: [parseInline(line)], spaced };
      blocks.push(open);
    }
    spaced = false;
  }
  return blocks;
}

// Un enlace con texto propio se exporta como "texto (url)".
function spansToPlainText(spans: RichTextSpan[]): string {
  let out = "";
  let label = "";
  spans.forEach((span, i) => {
    out += span.text;
    if (!span.href) return;
    label += span.text;
    if (spans[i + 1]?.href !== span.href) {
      if (label !== span.href) out += ` (${span.href})`;
      label = "";
    }
  });
  return out;
}

function blockToPlainText(block: RichTextBlock): string {
  switch (block.type) {
    case RichTextBlockType.HEADING:
      return spansToPlainText(block.spans);
    case RichTextBlockType.PARAGRAPH:
      return block.lines.map(spansToPlainText).join("\n");
    case RichTextBlockType.LIST:
      return block.items.map((item) => `${item.marker} ${spansToPlainText(item.spans)}`).join("\n");
  }
}

/** El mismo texto sin la sintaxis: para sitios que no pintan formato (calendario). */
export function richTextToPlainText(source: string): string {
  return parseRichText(source)
    .map((block, i) => (i > 0 && block.spaced ? "\n" : "") + blockToPlainText(block))
    .join("\n");
}
