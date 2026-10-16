import { RichTextFormat } from "@/constants/richText";
import { applyRichTextFormat } from "./richTextEditing";

/**
 * Escribe la selección con corchetes ("a [b] c") para leer los casos de un vistazo:
 * `run("a [b] c", BOLD)` devuelve "a **[b]** c".
 */
function run(marked: string, format: RichTextFormat): string {
  const start = marked.indexOf("[");
  const end = marked.indexOf("]") - 1;
  const value = marked.replace("[", "").replace("]", "");
  const result = applyRichTextFormat(value, { start, end }, format);
  const { start: s, end: e } = result.selection;
  return result.value.slice(0, s) + "[" + result.value.slice(s, e) + "]" + result.value.slice(e);
}

describe("applyRichTextFormat — bold and italic", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(run("a [word] b", RichTextFormat.BOLD)).toBe("a **[word]** b");
    expect(run("a [word] b", RichTextFormat.ITALIC)).toBe("a *[word]* b");
  });

  it("leaves the spaces at the edges out of the marks", () => {
    expect(run("a[ word ]b", RichTextFormat.BOLD)).toBe("a **[word]** b");
  });

  it("puts the cursor between two marks when nothing is selected", () => {
    expect(run("a [] b", RichTextFormat.BOLD)).toBe("a **[]** b");
  });

  it("toggles off marks around or inside the selection", () => {
    expect(run("a **[word]** b", RichTextFormat.BOLD)).toBe("a [word] b");
    expect(run("a [**word**] b", RichTextFormat.BOLD)).toBe("a [word] b");
    expect(run("a *[word]* b", RichTextFormat.ITALIC)).toBe("a [word] b");
  });

  it("tells bold and italic apart", () => {
    expect(run("**[word]**", RichTextFormat.ITALIC)).toBe("***[word]***");
    expect(run("***[word]***", RichTextFormat.ITALIC)).toBe("**[word]**");
    expect(run("***[word]***", RichTextFormat.BOLD)).toBe("*[word]*");
  });

  it("wraps each line on its own and skips list markers", () => {
    expect(run("[- one\n- two]", RichTextFormat.BOLD)).toBe("- **[one**\n- **two]**");
  });
});

describe("applyRichTextFormat — headings and lists", () => {
  it("prefixes the current line, wherever the cursor is", () => {
    expect(run("intro\nRequi[]rements\nend", RichTextFormat.HEADING_2)).toBe("intro\n## Requi[]rements\nend");
  });

  it("switches heading level and toggles it off", () => {
    expect(run("## [Title]", RichTextFormat.HEADING_3)).toBe("### [Title]");
    expect(run("## [Title]", RichTextFormat.HEADING_2)).toBe("[Title]");
  });

  it("starts a heading on an empty line", () => {
    expect(run("[]", RichTextFormat.HEADING_2)).toBe("## []");
  });

  it("turns every selected line into a bullet, skipping blank ones", () => {
    expect(run("[one\n\ntwo]", RichTextFormat.BULLET_LIST)).toBe("- [one\n\n- two]");
  });

  it("keeps existing • bullets when completing a list, and removes them all on a second press", () => {
    expect(run("[• one\ntwo]", RichTextFormat.BULLET_LIST)).toBe("[• one\n- two]");
    expect(run("[• one\n- two]", RichTextFormat.BULLET_LIST)).toBe("[one\ntwo]");
  });

  it("numbers the lines in order, replacing bullets", () => {
    expect(run("[- one\n- two\nthree]", RichTextFormat.NUMBERED_LIST)).toBe("1. [one\n2. two\n3. three]");
  });

  it("ignores the next line when the selection ends at its start", () => {
    expect(run("[one\n]two", RichTextFormat.BULLET_LIST)).toBe("- [one\n]two");
  });
});

describe("applyRichTextFormat — links", () => {
  it("uses the selected text as the label and selects the URL to type", () => {
    expect(run("Apply [here] now", RichTextFormat.LINK)).toBe("Apply [here]([https://]) now");
  });

  it("uses a selected URL as the target and selects the label", () => {
    expect(run("[https://x.com]", RichTextFormat.LINK)).toBe("[[link text]](https://x.com)");
  });

  it("inserts a placeholder link when nothing is selected", () => {
    expect(run("Go []", RichTextFormat.LINK)).toBe("Go [[link text]](https://)");
  });
});
