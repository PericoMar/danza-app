import {
  DeadlineDraft,
  ageRangeDraftFrom,
  ageRangeForPayload,
  applicationLinkDraftsFrom,
  applicationLinksForPayload,
  applyOpenDeadline,
  emptyApplicationLink,
  auditionDateCardHint,
  deadlineCardHint,
  deadlinesFromAudition,
  emailDraftsFrom,
  emailsForPayload,
  emptyDate,
  emptyDeadline,
  emptyEmail,
  heightDraftsFrom,
  heightsForPayload,
  isValidIsoDate,
  scheduleForPayload,
  validateAgeRange,
  validateApplicationLinks,
  validateEmails,
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

  it("drag a half-typed end, or one the new start has passed, but keep it while the start is half-typed", () => {
    const date = { ...emptyDate(COMPANY), start_date: "2026-11-10", end_date: "2026-11-12" };

    expect(withStartDate({ ...date, end_date: "2026-1" }, "2026-11-20").end_date).toBe("2026-11-20");
    expect(withStartDate(date, "2026-11-20").end_date).toBe("2026-11-20");
    expect(withStartDate(date, "2026-11-2").end_date).toBe("2026-11-12");
  });

  it("clear place and country when a date goes online, and restore the company's when back", () => {
    const online = withFormat(emptyDate(COMPANY), AuditionDateFormat.ONLINE, COMPANY);
    expect(online).toMatchObject({ place: "", country_iso_code: "" });

    expect(withFormat(online, AuditionDateFormat.IN_PERSON, COMPANY)).toMatchObject(COMPANY);
  });

  it("ASAP and Always open label the deadline and date it on its first audition", () => {
    const d = draft("", [["2026-12-05", "2026-12-05"], ["2026-11-13", "2026-11-14"]]);

    expect(applyOpenDeadline(d, "ASAP")).toMatchObject({ date_label: "ASAP", date: "2026-11-13" });
    expect(applyOpenDeadline(d, "Always open")).toMatchObject({ date_label: "Always open", date: "2026-11-13" });
  });

  it("keep the typed deadline date when no audition date is valid yet", () => {
    expect(applyOpenDeadline(draft("2026-11-01", [["", ""]]), "ASAP").date).toBe("2026-11-01");
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

describe("age range draft", () => {
  it("round-trips a range and sends empty bounds as null", () => {
    expect(ageRangeForPayload(ageRangeDraftFrom({ min_age: 18, max_age: null }))).toEqual({
      min_age: 18,
      max_age: null,
    });
    expect(ageRangeForPayload({ min: " ", max: "" })).toEqual({ min_age: null, max_age: null });
  });

  it("accepts no range, one bound or both", () => {
    expect(validateAgeRange({ min: "", max: "" })).toEqual({});
    expect(validateAgeRange({ min: "", max: "25" })).toEqual({});
    expect(validateAgeRange({ min: "18", max: "18" })).toEqual({});
  });

  it("rejects ages that are not whole years above 0 and a minimum above the maximum", () => {
    expect(validateAgeRange({ min: "0", max: "" })).toHaveProperty("min_age");
    expect(validateAgeRange({ min: "", max: "25.5" })).toHaveProperty("max_age");
    expect(validateAgeRange({ min: "-3", max: "" })).toHaveProperty("min_age");
    expect(validateAgeRange({ min: "30", max: "20" })).toEqual({ max_age: expect.any(String) });
  });
});

describe("listing card hints", () => {
  const single = { hasScheduleLabel: false, auditionDateCount: 1 };
  const withScheduleLabel = { hasScheduleLabel: true, auditionDateCount: 1 };

  it("says nothing for an empty label", () => {
    expect(deadlineCardHint("  ", single)).toBeUndefined();
    expect(auditionDateCardHint("", single)).toBeUndefined();
  });

  it("shows a short label as is and a long one as TBA", () => {
    expect(deadlineCardHint("Always open", single)).toBe('Listing card shows "Always open".');
    expect(auditionDateCardHint("To be arranged between October 12 and 20", single)).toMatch(/^Listing card shows "TBA"/);
  });

  it("points to the schedule label, which replaces the deadline and the audition dates on the card", () => {
    expect(deadlineCardHint("ASAP", withScheduleLabel)).toMatch(/Schedule label/);
    expect(auditionDateCardHint("ASAP", withScheduleLabel)).toMatch(/Schedule label/);
  });

  it("points to Multiple Audition when there are several audition dates", () => {
    expect(auditionDateCardHint("ASAP", { hasScheduleLabel: false, auditionDateCount: 3 })).toMatch(/"Multiple Audition"/);
  });
});

describe("application links", () => {
  const link = (url: string, label = "") => ({ ...emptyApplicationLink(), url, label });

  it("loads the saved links in order, a missing label as empty text", () => {
    const drafts = applicationLinkDraftsFrom(
      audition("a", {
        application_links: [
          { id: "l1", url: "https://form.test", label: "Apply online" },
          { id: "l2", url: "https://video.test", label: null },
        ],
      })
    );

    expect(drafts.map(({ url, label }) => ({ url, label }))).toEqual([
      { url: "https://form.test", label: "Apply online" },
      { url: "https://video.test", label: "" },
    ]);
  });

  it("drops blank rows and trims what it sends, empty labels as null", () => {
    expect(
      applicationLinksForPayload([link(" https://form.test "), link("", ""), link("https://video.test", " Upload ")])
    ).toEqual([
      { url: "https://form.test", label: null },
      { url: "https://video.test", label: "Upload" },
    ]);
  });

  it("accepts full http(s) URLs and ignores blank rows", () => {
    expect(validateApplicationLinks([link("https://form.test/apply?x=1"), link("http://old.test"), link("")])).toEqual({});
  });

  it("asks for a full URL like the database does", () => {
    const missingScheme = link("forms.test/apply");
    const withSpace = link("https://form.test/a b");
    const labelOnly = link("", "Apply online");

    const errors = validateApplicationLinks([missingScheme, withSpace, labelOnly]);

    expect(errors[`${missingScheme.key}.url`]).toMatch(/https:\/\//);
    expect(errors[`${withSpace.key}.url`]).toMatch(/https:\/\//);
    expect(errors[`${labelOnly.key}.url`]).toMatch(/URL/);
  });

  it("flags the same URL twice, on the repeated row", () => {
    const first = link("https://form.test");
    const again = link(" https://form.test ");

    expect(validateApplicationLinks([first, again])).toEqual({ [`${again.key}.url`]: expect.any(String) });
  });
});

describe("contact emails", () => {
  const email = (address: string, label = "") => ({ ...emptyEmail(), email: address, label });

  it("loads the saved emails in order, a missing label as empty text", () => {
    const drafts = emailDraftsFrom(
      audition("a", {
        emails: [
          { id: "e1", email: "women@co.test", label: "Women" },
          { id: "e2", email: "men@co.test", label: null },
        ],
      })
    );

    expect(drafts.map(({ email, label }) => ({ email, label }))).toEqual([
      { email: "women@co.test", label: "Women" },
      { email: "men@co.test", label: "" },
    ]);
  });

  it("drops blank rows and trims what it sends, empty labels as null", () => {
    expect(emailsForPayload([email(" casting@co.test "), email(""), email("info@co.test", " Questions ")])).toEqual([
      { email: "casting@co.test", label: null },
      { email: "info@co.test", label: "Questions" },
    ]);
  });

  it("asks for a full address like the database does", () => {
    const noDomain = email("casting@co");
    const withSpace = email("cast ing@co.test");
    const labelOnly = email("", "Applications");

    const errors = validateEmails([email("casting@co.test"), noDomain, withSpace, labelOnly, email("")]);

    expect(Object.keys(errors).sort()).toEqual(
      [`${noDomain.key}.email`, `${withSpace.key}.email`, `${labelOnly.key}.email`].sort()
    );
    expect(errors[`${labelOnly.key}.email`]).toMatch(/address/);
  });

  it("flags the same address twice whatever its case, on the repeated row", () => {
    const first = email("Casting@Co.test");
    const again = email(" casting@co.test ");

    expect(validateEmails([first, again])).toEqual({ [`${again.key}.email`]: expect.any(String) });
  });
});
