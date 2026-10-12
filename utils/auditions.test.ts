import {
  compareByPrimaryAudition,
  getActiveAuditionsByRelevance,
  getPrimaryAudition,
  getStatusBadge,
  isLiveAudition,
  sortAuditionsByRelevance,
} from "./auditions";
import { audition, openCall, past, postDeadline } from "./__fixtures__/audition";
import type { Audition } from "@/types/audition";

const ids = (auditions: Audition[]) => auditions.map((a) => a.id);

describe("sortAuditionsByRelevance", () => {
  it("lists open calls, then post-deadline, then past auditions", () => {
    const sorted = sortAuditionsByRelevance([
      past("past", "2026-09-01"),
      postDeadline("post", "2026-11-15"),
      openCall("open", "2026-12-01"),
    ]);

    expect(ids(sorted)).toEqual(["open", "post", "past"]);
  });

  it("orders open calls by the nearest deadline", () => {
    const sorted = sortAuditionsByRelevance([openCall("later", "2026-12-01"), openCall("sooner", "2026-11-01")]);

    expect(ids(sorted)).toEqual(["sooner", "later"]);
  });

  it("orders post-deadline auditions by the nearest audition date", () => {
    const sorted = sortAuditionsByRelevance([
      postDeadline("later", "2026-12-20"),
      postDeadline("sooner", "2026-11-15"),
    ]);

    expect(ids(sorted)).toEqual(["sooner", "later"]);
  });

  it("orders past auditions by the most recent end", () => {
    const sorted = sortAuditionsByRelevance([past("older", "2026-03-01"), past("recent", "2026-09-01")]);

    expect(ids(sorted)).toEqual(["recent", "older"]);
  });

  it("breaks ties by the most recently created, whatever the input order", () => {
    const older = openCall("older", "2026-11-01", { created_at: "2026-01-01T00:00:00Z" });
    const newer = openCall("newer", "2026-11-01", { created_at: "2026-03-01T00:00:00Z" });

    expect(ids(sortAuditionsByRelevance([older, newer]))).toEqual(["newer", "older"]);
    expect(ids(sortAuditionsByRelevance([newer, older]))).toEqual(["newer", "older"]);
  });

  it("does not modify the list it receives", () => {
    const input = [past("past", "2026-09-01"), openCall("open", "2026-12-01")];

    sortAuditionsByRelevance(input);

    expect(ids(input)).toEqual(["past", "open"]);
  });
});

describe("getActiveAuditionsByRelevance", () => {
  it("drops inactive auditions and keeps the rest in relevance order", () => {
    const later = openCall("later", "2026-12-01");
    const inactive = openCall("inactive", "2026-10-20", { is_active: false });
    const sooner = openCall("sooner", "2026-11-01");

    expect(ids(getActiveAuditionsByRelevance({ auditions: [later, inactive, sooner] }))).toEqual([
      "sooner",
      "later",
    ]);
  });

  it("returns an empty list when every audition is inactive", () => {
    expect(getActiveAuditionsByRelevance({ auditions: [openCall("off", "2026-12-01", { is_active: false })] })).toEqual(
      []
    );
  });
});

describe("getPrimaryAudition", () => {
  it("is the most relevant active audition", () => {
    const auditions = [past("past", "2026-09-01"), openCall("open", "2026-12-01"), postDeadline("post", "2026-11-15")];

    expect(getPrimaryAudition({ auditions })?.id).toBe("open");
  });

  it("skips an inactive audition even when it would rank first", () => {
    const auditions = [openCall("hidden", "2026-11-01", { is_active: false }), past("past", "2026-09-01")];

    expect(getPrimaryAudition({ auditions })?.id).toBe("past");
  });

  it("is null when the company has no active auditions", () => {
    expect(getPrimaryAudition({ auditions: [] })).toBeNull();
  });
});

describe("compareByPrimaryAudition", () => {
  it("puts companies without an audition last", () => {
    expect(compareByPrimaryAudition(null, past("past", "2026-09-01"))).toBeGreaterThan(0);
    expect(compareByPrimaryAudition(past("past", "2026-09-01"), null)).toBeLessThan(0);
    expect(compareByPrimaryAudition(null, null)).toBe(0);
  });
});

describe("isLiveAudition", () => {
  it("is an active audition that has not passed", () => {
    expect(isLiveAudition(openCall("open", "2026-12-01"))).toBe(true);
    expect(isLiveAudition(postDeadline("post", "2026-11-15"))).toBe(true);
    expect(isLiveAudition(past("past", "2026-09-01"))).toBe(false);
    expect(isLiveAudition(openCall("off", "2026-12-01", { is_active: false }))).toBe(false);
  });
});

describe("getStatusBadge", () => {
  it("labels each status and nothing without an audition", () => {
    expect(getStatusBadge(openCall("open", "2026-12-01"))?.label).toBe("Open call");
    expect(getStatusBadge(postDeadline("post", "2026-11-15"))?.label).toBe("Post-deadline");
    expect(getStatusBadge(audition("past"))?.label).toBe("Past audition");
    expect(getStatusBadge(null)).toBeNull();
  });
});
