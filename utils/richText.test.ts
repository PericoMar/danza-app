import { RichTextBlockType } from "@/constants/richText";
import { parseRichText, richTextToPlainText } from "./richText";

const firstLine = (source: string) => {
  const [block] = parseRichText(source);
  if (block.type !== RichTextBlockType.PARAGRAPH) throw new Error(`expected a paragraph, got ${block.type}`);
  return block.lines[0];
};

describe("parseRichText — blocks", () => {
  it("reads ## and ### as headings, and a single # like ##", () => {
    expect(parseRichText("# Title\n## Section\n### Detail")).toEqual([
      { type: "heading", level: 2, spans: [{ text: "Title" }], spaced: false },
      { type: "heading", level: 2, spans: [{ text: "Section" }], spaced: false },
      { type: "heading", level: 3, spans: [{ text: "Detail" }], spaced: false },
    ]);
  });

  it("keeps every line break inside a paragraph and splits paragraphs on blank lines", () => {
    const blocks = parseRichText("WHERE:\nMilano, Italy\n\n\nWHEN:\nSoon");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: "paragraph", spaced: false });
    expect(blocks[1]).toMatchObject({ type: "paragraph", spaced: true });
    if (blocks[0].type !== RichTextBlockType.PARAGRAPH) throw new Error();
    expect(blocks[0].lines.map((line) => line[0].text)).toEqual(["WHERE:", "Milano, Italy"]);
  });

  it("reads -, * and the • already used in prod as bullets", () => {
    const [list] = parseRichText("- one\n* two\n• three");
    expect(list).toMatchObject({ type: "list", ordered: false });
    if (list.type !== RichTextBlockType.LIST) throw new Error();
    expect(list.items.map((item) => [item.marker, item.spans[0].text])).toEqual([
      ["•", "one"],
      ["•", "two"],
      ["•", "three"],
    ]);
  });

  it("keeps the numbers of an ordered list as written", () => {
    const [list] = parseRichText("1. Warm-up\n3) Repertoire\n24. Contemporary");
    if (list.type !== RichTextBlockType.LIST) throw new Error();
    expect(list.ordered).toBe(true);
    expect(list.items.map((item) => item.marker)).toEqual(["1.", "3)", "24."]);
  });

  it("reads a European date as text, not as a list: a new numbered list starts at 1", () => {
    const blocks = parseRichText("WHEN:\n24. may 2026\n\n1. First\n2. Second");
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "list"]);
    expect(parseRichText("### When\n24. may 2026").map((b) => b.type)).toEqual(["heading", "paragraph"]);
    expect(parseRichText("Steps:\n1. Apply\n2. Wait").map((b) => b.type)).toEqual(["paragraph", "list"]);
  });

  it("starts a new block when a line leaves the list", () => {
    const blocks = parseRichText("REQUIREMENTS:\n• CV\n• Photos\n+ 2-3 extra dates");
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "list", "paragraph"]);
    expect(blocks.every((b) => !b.spaced)).toBe(true);
  });

  it("does not take a hash or dash without a space for a marker", () => {
    expect(parseRichText("#01-54\n-5 °C")[0].type).toBe("paragraph");
  });

  it("treats the unicode line separators found in prod as line breaks", () => {
    const [block] = parseRichText("€ 9000*\u2028This includes training");
    if (block.type !== RichTextBlockType.PARAGRAPH) throw new Error();
    expect(block.lines.map((line) => line.map((s) => s.text).join(""))).toEqual([
      "€ 9000*",
      "This includes training",
    ]);
  });

  it("returns nothing for blank text", () => {
    expect(parseRichText(" \n\n ")).toEqual([]);
  });
});

describe("parseRichText — inline", () => {
  it("reads bold, italic and both", () => {
    expect(firstLine("a **b** *c* _d_ ***e***")).toEqual([
      { text: "a " },
      { text: "b", bold: true },
      { text: " " },
      { text: "c", italic: true },
      { text: " " },
      { text: "d", italic: true },
      { text: " " },
      { text: "e", bold: true, italic: true },
    ]);
  });

  it("nests italic inside bold", () => {
    expect(firstLine("**see *Giselle* now**")).toEqual([
      { text: "see ", bold: true },
      { text: "Giselle", bold: true, italic: true },
      { text: " now", bold: true },
    ]);
  });

  it("leaves footnote asterisks from prod alone", () => {
    const text = "applying as a Guest Artist* or for the Studio Company**";
    expect(firstLine(text)).toEqual([{ text }]);
    expect(firstLine("Audition fees* are only accepted via credit card")).toEqual([
      { text: "Audition fees* are only accepted via credit card" },
    ]);
  });

  it("does not italicise underscores inside words or handles", () => {
    const text = "Follow @bjc_academia and first_last@mail.com";
    expect(firstLine(text)).toEqual([{ text }]);
  });

  it("links bare URLs without the closing punctuation or their underscores", () => {
    expect(firstLine("Form: https://forms.gle/a_b_c. Thanks")).toEqual([
      { text: "Form: " },
      { text: "https://forms.gle/a_b_c", href: "https://forms.gle/a_b_c" },
      { text: ". Thanks" },
    ]);
  });

  it("keeps a closing parenthesis that belongs to the URL", () => {
    expect(firstLine("(see https://en.wikipedia.org/wiki/Swan_Lake_(ballet))")).toEqual([
      { text: "(see " },
      { text: "https://en.wikipedia.org/wiki/Swan_Lake_(ballet)", href: "https://en.wikipedia.org/wiki/Swan_Lake_(ballet)" },
      { text: ")" },
    ]);
  });

  it("reads [text](url) links, with formatting inside the text", () => {
    expect(firstLine("Apply [**here**](https://x.com/apply) today")).toEqual([
      { text: "Apply " },
      { text: "here", bold: true, href: "https://x.com/apply" },
      { text: " today" },
    ]);
  });

  it("leaves a link without a real URL as typed", () => {
    expect(firstLine("[link text](https://)")).toEqual([{ text: "[link text](https://)" }]);
    expect(firstLine("[x](javascript:alert(1))")).toEqual([{ text: "[x](javascript:alert(1))" }]);
  });

  it("unescapes backslashed punctuation", () => {
    expect(firstLine("\\*not italic\\*")).toEqual([{ text: "*not italic*" }]);
  });

  it("does not let emphasis run across lines", () => {
    const [block] = parseRichText("*one\ntwo*");
    if (block.type !== RichTextBlockType.PARAGRAPH) throw new Error();
    expect(block.lines).toEqual([[{ text: "*one" }], [{ text: "two*" }]]);
  });
});

describe("richTextToPlainText", () => {
  it("drops the syntax and keeps the structure", () => {
    const source = "## Requirements\n- **CV**\n- Photos\n\nApply [here](https://x.com) or https://y.com";
    expect(richTextToPlainText(source)).toBe(
      "Requirements\n• CV\n• Photos\n\nApply here (https://x.com) or https://y.com"
    );
  });

  it("returns old plain descriptions unchanged", () => {
    const source = "Requirements:\n• Age: 18–21\n• Height: 162–168 cm\n\nSend it to: info@ballet.it";
    expect(richTextToPlainText(source)).toBe(source);
  });
});
