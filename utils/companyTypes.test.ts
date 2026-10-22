import { resolveTypeFilter, subtypeIdsOfTypes } from "./companyTypes";
import type { CompanySubtypeGroup } from "@/types/company";

const GROUPS: CompanySubtypeGroup[] = [
  { id: "companies", label: "Companies", subtypes: [{ id: "touring", label: "Touring" }] },
  {
    id: "junior_pre_professional",
    label: "Junior and pre-professional",
    subtypes: [
      { id: "junior", label: "Junior" },
      { id: "pre_professional", label: "Pre-professional" },
    ],
  },
  { id: "events", label: "Events", subtypes: [{ id: "events", label: "Events" }] },
];

describe("subtypeIdsOfTypes", () => {
  it("lists every subtype under the selected types", () => {
    expect(subtypeIdsOfTypes(GROUPS, ["junior_pre_professional", "events"])).toEqual([
      "junior",
      "pre_professional",
      "events",
    ]);
  });

  it("is empty with no type selected", () => {
    expect(subtypeIdsOfTypes(GROUPS, [])).toEqual([]);
  });
});

describe("resolveTypeFilter", () => {
  it("keeps the type ids it knows", () => {
    expect(resolveTypeFilter(GROUPS, ["events", "companies"])).toEqual(["events", "companies"]);
  });

  it("turns a subtype id from an older link into its type", () => {
    expect(resolveTypeFilter(GROUPS, ["junior", "touring"])).toEqual([
      "junior_pre_professional",
      "companies",
    ]);
  });

  it("keeps a type once when it is named twice", () => {
    expect(resolveTypeFilter(GROUPS, ["junior", "pre_professional", "junior_pre_professional"])).toEqual([
      "junior_pre_professional",
    ]);
  });

  it("drops ids the catalogue doesn't have", () => {
    expect(resolveTypeFilter(GROUPS, ["resident", "events"])).toEqual(["events"]);
  });
});
