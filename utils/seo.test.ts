import { companyJsonLd, companySchemaType } from "./seo";
import { CompanySubtype } from "@/types/company";

describe("companySchemaType", () => {
  it("describes a company with no subtype as a dance group", () => {
    expect(companySchemaType([])).toBe("DanceGroup");
  });

  it("gives one type per kind of company, without repeating it", () => {
    expect(companySchemaType([CompanySubtype.TOURING, CompanySubtype.JUNIOR])).toBe("DanceGroup");
    expect(companySchemaType([CompanySubtype.JUNIOR, CompanySubtype.SCHOOL_PRO])).toEqual([
      "DanceGroup",
      "EducationalOrganization",
    ]);
  });

  it("keeps Organization only when nothing more specific applies", () => {
    expect(companySchemaType([CompanySubtype.EVENTS])).toBe("Organization");
    expect(companySchemaType([CompanySubtype.UNIVERSITY, CompanySubtype.EVENTS])).toBe("CollegeOrUniversity");
  });

  it("ignores subtypes the code doesn't know yet", () => {
    expect(companySchemaType(["resident"])).toBe("DanceGroup");
    expect(companySchemaType(["resident", CompanySubtype.EVENTS])).toBe("Organization");
  });
});

describe("companyJsonLd", () => {
  it("takes its @type from the subtypes", () => {
    const jsonLd = companyJsonLd({
      name: "Academy",
      subtypes: [CompanySubtype.PRE_PROFESSIONAL, CompanySubtype.SCHOOL_PRO],
      path: "/companies/academy",
    });

    expect(jsonLd["@type"]).toBe("EducationalOrganization");
  });
});
