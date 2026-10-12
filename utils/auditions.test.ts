import {
  getActiveAuditionsByRelevance,
  getPrimaryAudition,
  sortAuditionsByRelevance,
} from "./auditions";
import { audition } from "./__fixtures__/audition";
import type { Audition } from "@/types/audition";

const TODAY = new Date(2026, 9, 10);

function primaryId(auditions: Audition[]) {
  return getPrimaryAudition({ auditions }, TODAY)?.id ?? null;
}

describe("getPrimaryAudition", () => {
  it("prefers an open call over an older closed one listed first", () => {
    const closed = audition("closed", { deadline_date: "2026-03-01" });
    const open = audition("open", { deadline_date: "2026-12-01" });

    expect(primaryId([closed, open])).toBe("open");
  });

  it("picks the nearest deadline among open calls", () => {
    const later = audition("later", { deadline_date: "2026-12-01" });
    const sooner = audition("sooner", { deadline_date: "2026-11-01" });

    expect(primaryId([later, sooner])).toBe("sooner");
  });

  it("prefers an always-open call with a future date over a post-deadline one", () => {
    const postDeadline = audition("post-deadline", {
      deadline_date: "2026-09-01",
      audition_date: "2026-11-15",
    });
    const alwaysOpen = audition("always-open", {
      deadline_mode: "always_open",
      audition_date: "2026-12-20",
    });

    expect(primaryId([postDeadline, alwaysOpen])).toBe("always-open");
  });

  it("falls back to the most recently created when none carries ranking info", () => {
    const older = audition("older", {
      audition_date: "2026-02-15",
      created_at: "2026-01-01T00:00:00Z",
    });
    const newer = audition("newer", {
      audition_date: "2026-01-15",
      created_at: "2026-02-01T00:00:00Z",
    });

    expect(primaryId([older, newer])).toBe("newer");
    expect(primaryId([newer, older])).toBe("newer");
  });

  it("breaks ties on the same deadline by the most recently created", () => {
    const older = audition("older", {
      deadline_date: "2026-11-01",
      created_at: "2026-01-01T00:00:00Z",
    });
    const newer = audition("newer", {
      deadline_date: "2026-11-01",
      created_at: "2026-03-01T00:00:00Z",
    });

    expect(primaryId([older, newer])).toBe("newer");
    expect(primaryId([newer, older])).toBe("newer");
  });

  it("returns null when the company has no auditions", () => {
    expect(primaryId([])).toBeNull();
  });
});

describe("sortAuditionsByRelevance", () => {
  it("lists open calls first and auditions without ranking info last", () => {
    const noInfo = audition("no-info", { audition_date: "2026-01-15" });
    const closed = audition("closed", { deadline_date: "2026-03-01" });
    const open = audition("open", { deadline_date: "2026-12-01" });

    const sorted = sortAuditionsByRelevance([noInfo, closed, open], TODAY);

    expect(sorted.map((a) => a.id)).toEqual(["open", "closed", "no-info"]);
  });

  it("starts with the audition getPrimaryAudition picks", () => {
    const auditions = [
      audition("a", { deadline_date: "2026-09-01", audition_date: "2026-11-15" }),
      audition("b", { deadline_mode: "always_open", audition_date: "2026-12-20" }),
      audition("c", { deadline_date: "2026-12-01" }),
    ];

    expect(sortAuditionsByRelevance(auditions, TODAY)[0].id).toBe(primaryId(auditions));
  });
});

describe("getActiveAuditionsByRelevance", () => {
  it("drops inactive auditions and keeps the rest in relevance order", () => {
    const later = audition("later", { deadline_date: "2026-12-01" });
    const inactive = audition("inactive", { deadline_date: "2026-10-20", is_active: false });
    const sooner = audition("sooner", { deadline_date: "2026-11-01" });

    const active = getActiveAuditionsByRelevance({ auditions: [later, inactive, sooner] }, TODAY);

    expect(active.map((a) => a.id)).toEqual(["sooner", "later"]);
  });

  it("treats a missing is_active (rows from companies_enriched) as active", () => {
    const { is_active: _omit, ...fromView } = audition("from-view", { deadline_date: "2026-12-01" });

    const active = getActiveAuditionsByRelevance({ auditions: [fromView as Audition] }, TODAY);

    expect(active.map((a) => a.id)).toEqual(["from-view"]);
  });

  it("returns an empty list when every audition is inactive", () => {
    const off = audition("off", { deadline_date: "2026-12-01", is_active: false });

    expect(getActiveAuditionsByRelevance({ auditions: [off] }, TODAY)).toEqual([]);
  });
});
