import {
  formatDateRange,
  getAuditionDateRows,
  getDeadlineRows,
  getHeadlineAuditionDate,
  getHeadlineDeadline,
  getPlacesSummary,
  parseIsoDate,
} from "./auditionDisplay";
import { audition, auditionDate, deadline } from "./__fixtures__/audition";
import { AuditionDateFormat } from "@/types/audition";

describe("parseIsoDate", () => {
  it("reads a date as that local day, not UTC midnight", () => {
    const d = parseIsoDate("2026-11-17");

    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 17]);
  });
});

describe("formatDateRange", () => {
  it("shows one day, a range in a month, across months and across years", () => {
    expect(formatDateRange("2026-11-17", "2026-11-17")).toBe("17 Nov 2026");
    expect(formatDateRange("2026-11-17", "2026-11-20")).toBe("17–20 Nov 2026");
    expect(formatDateRange("2026-09-30", "2026-10-02")).toBe("30 Sept – 2 Oct 2026");
    expect(formatDateRange("2026-12-28", "2027-01-03")).toBe("28 Dec 2026 – 3 Jan 2027");
  });
});

describe("getDeadlineRows", () => {
  it("shows a label instead of the date and offers no date for it", () => {
    const rows = getDeadlineRows(
      audition("a", { deadlines: [deadline("d1", "2026-11-01", [], { date_label: "ASAP" })] })
    );

    expect(rows).toEqual([{ key: "label:ASAP", text: "ASAP", date: null, notes: null }]);
  });

  it("shows one ASAP for several ASAP deadlines, keeping dated ones apart", () => {
    const rows = getDeadlineRows(
      audition("a", {
        deadlines: [
          deadline("d1", "2026-11-01", [], { date_label: "ASAP" }),
          deadline("d2", "2026-11-10", []),
          deadline("d3", "2026-12-01", [], { date_label: "ASAP", notes: "Send a video" }),
        ],
      })
    );

    expect(rows.map((r) => [r.text, r.notes])).toEqual([
      ["ASAP", "Send a video"],
      ["10 Nov 2026", null],
    ]);
  });
});

describe("getAuditionDateRows", () => {
  it("lists every date in order with its place, label or range, and notes", () => {
    const a = audition("a", {
      deadlines: [
        deadline("d1", "2026-11-01", [
          auditionDate("x2", "2026-12-05", { place: "London, UK", notes: "Men" }),
          auditionDate("x1", "2026-11-13", { end_date: "2026-11-14", place: "Leeds, UK" }),
        ]),
        deadline("d2", "2026-12-20", [
          auditionDate("x3", "2027-01-10", {
            date_label: "To be arranged upon invitation",
            format: AuditionDateFormat.ONLINE,
            place: "Online",
            country_iso_code: null,
          }),
        ]),
      ],
    });

    expect(getAuditionDateRows(a).map((r) => [r.when, r.place, r.notes, r.start !== null])).toEqual([
      ["13–14 Nov 2026", "Leeds, UK", null, true],
      ["5 Dec 2026", "London, UK", "Men", true],
      ["To be arranged upon invitation", "Online", null, false],
    ]);
  });
});

describe("getPlacesSummary", () => {
  it("joins distinct places in date order", () => {
    const a = audition("a", {
      deadlines: [
        deadline("d1", "2026-11-01", [
          auditionDate("x1", "2026-11-13", { place: "Bradford" }),
          auditionDate("x2", "2026-11-14", { place: "Birmingham" }),
          auditionDate("x3", "2026-11-20", { place: "Bradford" }),
        ]),
      ],
    });

    expect(getPlacesSummary(a)).toBe("Bradford · Birmingham");
    expect(getPlacesSummary(audition("empty"))).toBeNull();
  });
});

describe("headline deadline and date", () => {
  const a = audition("a", {
    next_deadline_date: "2026-12-01",
    next_audition_date: "2026-12-10",
    deadlines: [
      deadline("d1", "2026-09-01", [auditionDate("x1", "2026-09-10")]),
      deadline("d2", "2026-12-01", [auditionDate("x2", "2026-12-10")]),
    ],
  });

  it("is the next one while it is coming", () => {
    expect(getHeadlineDeadline(a)?.id).toBe("d2");
    expect(getHeadlineAuditionDate(a)?.id).toBe("x2");
  });

  it("falls back to the last one when everything has passed", () => {
    const passed = { ...a, next_deadline_date: null, next_audition_date: null };

    expect(getHeadlineDeadline(passed)?.id).toBe("d2");
    expect(getHeadlineAuditionDate(passed)?.id).toBe("x2");
  });
});
