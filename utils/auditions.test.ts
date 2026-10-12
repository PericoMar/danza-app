import {
  compareByPrimaryAudition,
  getActiveAuditionsByRelevance,
  getPrimaryAudition,
  getStatusBadge,
  isLiveAudition,
  sortAuditionsByRelevance,
} from "./auditions";
import { audition, auditionDate, deadline, openCall, past, postDeadline } from "./__fixtures__/audition";
import { AuditionStatus } from "@/types/audition";
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

  it("orders past auditions by their last deadline, whether the audition date is real or TBA", () => {
    const sorted = sortAuditionsByRelevance([
      past("older", "2026-03-01"),
      audition("recent-tba", {
        status: AuditionStatus.PAST,
        deadlines: [deadline("d", "2026-08-01", [auditionDate("x", "2026-09-01", { date_label: TBA })])],
      }),
    ]);

    expect(ids(sorted)).toEqual(["recent-tba", "older"]);
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

// Real dates (no label) go before label-only ones within each status.
const TBA = "To be arranged upon invitation";

/** Open call whose deadline is a label dated on its first audition, as the ASAP / Always open chips leave it. */
const openWithLabel = (
  id: string,
  label: string,
  start: string,
  dateLabel: string | null = null,
  content_updated_at: string | null = null
) =>
  openCall(id, start, {
    content_updated_at,
    deadlines: [deadline(`${id}-d`, start, [auditionDate(`${id}-x`, start, { date_label: dateLabel })], { date_label: label })],
  });

describe("sortAuditionsByRelevance with labels", () => {
  const asap = (id: string, start: string, dateLabel: string | null = null, updatedAt: string | null = null) =>
    openWithLabel(id, "ASAP", start, dateLabel, updatedAt);

  it("open calls: real deadline, then ASAP + real date, then ASAP / Always open + TBA", () => {
    const sorted = sortAuditionsByRelevance([
      asap("asap-tba", "2026-10-20", TBA),
      asap("asap-date", "2026-10-25"),
      openCall("real-deadline", "2026-12-01"),
    ]);

    expect(ids(sorted)).toEqual(["real-deadline", "asap-date", "asap-tba"]);
  });

  it("orders ASAP + real date by the nearest audition date", () => {
    const sorted = sortAuditionsByRelevance([asap("later", "2026-11-20"), asap("sooner", "2026-11-02")]);

    expect(ids(sorted)).toEqual(["sooner", "later"]);
  });

  it("orders label-only open calls by the most recent content update", () => {
    const sorted = sortAuditionsByRelevance([
      asap("stale", "2026-10-15", TBA, "2026-08-01T00:00:00Z"),
      openWithLabel("fresh", "Always open", "2026-12-30", TBA, "2026-10-01T00:00:00Z"),
    ]);

    expect(ids(sorted)).toEqual(["fresh", "stale"]);
  });

  it("post-deadline: a real audition date to come, then TBA after a real deadline, then labels only", () => {
    const tbaAfter = (id: string, deadlineDate: string, deadlineLabel: string | null) =>
      postDeadline(id, "2026-11-30", {
        deadlines: [
          deadline(`${id}-d`, deadlineDate, [auditionDate(`${id}-x`, "2026-11-30", { date_label: TBA })], {
            date_label: deadlineLabel,
          }),
        ],
      });

    const sorted = sortAuditionsByRelevance([
      tbaAfter("asap-tba", "2026-10-01", "ASAP"),
      tbaAfter("tba-old-deadline", "2026-09-01", null),
      tbaAfter("tba-recent-deadline", "2026-10-05", null),
      postDeadline("real-date", "2026-12-15"),
    ]);

    expect(ids(sorted)).toEqual(["real-date", "tba-recent-deadline", "tba-old-deadline", "asap-tba"]);
  });

  it("past: real deadline, then ASAP + real date by the most recent audition, then labels only", () => {
    const pastAsap = (id: string, date: string, dateLabel: string | null) =>
      audition(id, {
        status: AuditionStatus.PAST,
        deadlines: [deadline(`${id}-d`, date, [auditionDate(`${id}-x`, date, { date_label: dateLabel })], { date_label: "ASAP" })],
      });

    const sorted = sortAuditionsByRelevance([
      pastAsap("asap-tba", "2026-09-30", TBA),
      pastAsap("asap-old", "2026-05-01", null),
      pastAsap("asap-recent", "2026-09-01", null),
      past("real-deadline", "2026-02-01"),
    ]);

    expect(ids(sorted)).toEqual(["real-deadline", "asap-recent", "asap-old", "asap-tba"]);
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
