import {
  DeadlineDraft,
  applyAsap,
  deadlinesFromAudition,
  emptyDate,
  emptyDeadline,
  heightDraftsFrom,
  heightsForPayload,
  isValidIsoDate,
  scheduleForPayload,
  validateHeights,
  validateSchedule,
  withFormat,
  withStartDate,
} from "./auditionForm";
import { audition, auditionDate, deadline } from "./__fixtures__/audition";
import { AuditionDateFormat } from "@/types/audition";

const COMPANY = { place: "Plaza Mayor 1, Madrid", country_iso_code: "ES" };

function draft(date: string, ranges: [string, string][]): DeadlineDraft {
  const d = emptyDeadline(COMPANY);
  return {
    ...d,
    date,
    dates: ranges.map(([start, end]) => ({ ...emptyDate(COMPANY), start_date: start, end_date: end })),
  };
}

describe("isValidIsoDate", () => {
  it("accepts real dates only", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-2-3")).toBe(false);
  });
});

describe("validateSchedule", () => {
  it("accepts a deadline inside its range (rolling call) and a 60-day range", () => {
    expect(validateSchedule([draft("2026-03-08", [["2026-02-02", "2026-03-08"]])])).toEqual({});
    expect(validateSchedule([draft("2026-01-01", [["2026-01-01", "2026-03-01"]])])).toEqual({});
  });

  it("rejects an empty schedule and a deadline without dates", () => {
    expect(validateSchedule([]).schedule).toBeDefined();

    const d = { ...draft("2026-11-01", []) };
    expect(validateSchedule([d])[`${d.key}.dates`]).toBeDefined();
  });

  it("rejects a deadline after the end of its dates", () => {
    const d = draft("2026-11-20", [["2026-11-10", "2026-11-12"]]);

    expect(validateSchedule([d])[`${d.key}.date`]).toMatch(/after the end/);
  });

  it("rejects ranges that end before they start or last over 60 days", () => {
    const backwards = draft("2026-11-01", [["2026-11-10", "2026-11-09"]]);
    const tooLong = draft("2026-11-01", [["2026-11-10", "2027-01-09"]]);

    expect(validateSchedule([backwards])[`${backwards.dates[0].key}.end_date`]).toMatch(/before the start/);
    expect(validateSchedule([tooLong])[`${tooLong.dates[0].key}.end_date`]).toMatch(/60 days/);
  });

  it("needs an ISO country for in-person dates only", () => {
    const d = draft("2026-11-01", [["2026-11-10", "2026-11-10"]]);
    const noCountry = { ...d, dates: [{ ...d.dates[0], country_iso_code: "" }] };
    const badCountry = { ...d, dates: [{ ...d.dates[0], country_iso_code: "Spain" }] };
    const online = { ...d, dates: [withFormat(d.dates[0], AuditionDateFormat.ONLINE, COMPANY)] };

    expect(validateSchedule([noCountry])[`${d.dates[0].key}.country_iso_code`]).toBeDefined();
    expect(validateSchedule([badCountry])[`${d.dates[0].key}.country_iso_code`]).toBeDefined();
    expect(validateSchedule([online])).toEqual({});
  });
});

describe("drafts", () => {
  it("start a new in-person date at the company's place", () => {
    expect(emptyDate(COMPANY)).toMatchObject({ format: "in_person", place: COMPANY.place, country_iso_code: "ES" });
  });

  it("move the end with the start while the date is a single day", () => {
    const single = withStartDate(emptyDate(COMPANY), "2026-11-10");
    expect(single.end_date).toBe("2026-11-10");

    const range = withStartDate({ ...single, end_date: "2026-11-12" }, "2026-11-11");
    expect(range.end_date).toBe("2026-11-12");
  });

  it("clear place and country when a date goes online, and restore the company's when back", () => {
    const online = withFormat(emptyDate(COMPANY), AuditionDateFormat.ONLINE, COMPANY);
    expect(online).toMatchObject({ place: "", country_iso_code: "" });

    expect(withFormat(online, AuditionDateFormat.IN_PERSON, COMPANY)).toMatchObject(COMPANY);
  });

  it("ASAP labels the deadline and dates it on its first audition", () => {
    const d = applyAsap(draft("", [["2026-12-05", "2026-12-05"], ["2026-11-13", "2026-11-14"]]));

    expect(d).toMatchObject({ date_label: "ASAP", date: "2026-11-13" });
  });

  it("round-trip an audition into drafts and back into the RPC payload, keeping ids", () => {
    const a = audition("a", {
      deadlines: [
        deadline("d1", "2026-11-01", [auditionDate("x1", "2026-11-10", { notes: "Men" })], { date_label: "ASAP" }),
      ],
    });

    expect(scheduleForPayload(deadlinesFromAudition(a))).toEqual([
      {
        id: "d1",
        date: "2026-11-01",
        date_label: "ASAP",
        notes: null,
        dates: [
          {
            id: "x1",
            start_date: "2026-11-10",
            end_date: "2026-11-10",
            format: "in_person",
            place: "Madrid, Spain",
            country_iso_code: "ES",
            date_label: null,
            notes: "Men",
          },
        ],
      },
    ]);
  });

  it("send blank texts as null and online dates without a country", () => {
    const d = draft("2026-11-01", [["2026-11-10", "2026-11-10"]]);
    const online = { ...withFormat(d.dates[0], AuditionDateFormat.ONLINE, COMPANY), notes: "  " };

    const [payload] = scheduleForPayload([{ ...d, date_label: " ", dates: [online] }]);

    expect(payload.date_label).toBeNull();
    expect(payload.dates[0]).toMatchObject({ place: null, country_iso_code: null, notes: null });
    expect(payload).not.toHaveProperty("id");
  });
});

describe("height drafts", () => {
  it("round-trip requirements and only send ticked genders", () => {
    const drafts = heightDraftsFrom([{ gender: "female", min_height_cm: 160, max_height_cm: null }]);

    expect(drafts.male.active).toBe(false);
    expect(heightsForPayload(drafts)).toEqual([{ gender: "female", min_height_cm: 160, max_height_cm: null }]);
  });

  it("reject a minimum above the maximum", () => {
    const drafts = heightDraftsFrom();
    drafts.male = { active: true, min: "190", max: "170" };

    expect(validateHeights(drafts)).toMatch(/Male/);
  });
});
