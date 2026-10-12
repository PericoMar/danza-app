import {
  buildCompanyListing,
  type CompanyListing,
  type CompanyListingFilters,
} from "./companyListing";
import { audition } from "./__fixtures__/audition";
import type { Company } from "@/hooks/useCompanies";
import { CompanyType } from "@/types/company";

const TODAY = new Date(2026, 9, 10);

// Una audición por cada estado del filtro "upcoming".
const GREEN = audition("green", { deadline_date: "2026-11-01" });
const YELLOW = audition("yellow", { deadline_date: "2026-09-01", audition_date: "2026-11-15" });
const RED = audition("red", { deadline_date: "2026-09-01" });

const NO_FILTERS: CompanyListingFilters = {
  query: "",
  country: null,
  types: [],
  favoritesFirst: false,
  upcomingFirst: false,
};

function company(id: string, overrides: Partial<Company> = {}): Company {
  return {
    id,
    name: id,
    description: null,
    image: null,
    location: null,
    review_count: null,
    rating_count: null,
    average_rating: null,
    website_url: null,
    instagram_url: null,
    meta_url: null,
    country: null,
    verified: null,
    last_reviewed_at: null,
    country_iso_code: null,
    type: CompanyType.COMPANY,
    is_favorite: false,
    auditions: [],
    ...overrides,
  };
}

function listing(companies: Company[], filters: Partial<CompanyListingFilters>): CompanyListing {
  return buildCompanyListing(companies, { ...NO_FILTERS, ...filters }, { today: TODAY });
}

const ids = (result: CompanyListing) => result.companies.map((c) => c.id);

describe("buildCompanyListing", () => {
  it("keeps the original order when no filter is active", () => {
    const result = listing([company("b"), company("a", { auditions: [GREEN] })], {});

    expect(ids(result)).toEqual(["b", "a"]);
    expect(result.hasMatchFilters).toBe(false);
  });

  describe("upcoming auditions", () => {
    const exactWithoutAuditions = company("exact", { name: "Ballet" });
    const partialWithOpenCall = company("partial", { name: "Ballet Nacional", auditions: [GREEN] });

    it("orders search matches by upcoming auditions before text relevance", () => {
      const result = listing([exactWithoutAuditions, partialWithOpenCall], {
        query: "ballet",
        upcomingFirst: true,
      });

      expect(ids(result)).toEqual(["partial", "exact"]);
    });

    it("breaks upcoming ties by text relevance", () => {
      const longer = company("longer", { name: "Ballet Nacional" });

      const result = listing([longer, exactWithoutAuditions], {
        query: "ballet",
        upcomingFirst: true,
      });

      expect(ids(result)).toEqual(["exact", "longer"]);
    });

    it("orders search matches by text relevance alone when off", () => {
      const result = listing([partialWithOpenCall, exactWithoutAuditions], { query: "ballet" });

      expect(ids(result)).toEqual(["exact", "partial"]);
    });
  });

  describe("favorites", () => {
    it("puts favorites first, each group ordered by upcoming auditions", () => {
      const result = listing(
        [
          company("open", { auditions: [GREEN] }),
          company("red-fav", { is_favorite: true, auditions: [RED] }),
          company("no-info"),
          company("yellow-fav", { is_favorite: true, auditions: [YELLOW] }),
        ],
        { favoritesFirst: true, upcomingFirst: true },
      );

      expect(ids(result)).toEqual(["yellow-fav", "red-fav", "open", "no-info"]);
    });

    it("reorders without splitting the list", () => {
      const result = listing([company("a"), company("b", { is_favorite: true })], {
        favoritesFirst: true,
      });

      expect(ids(result)).toEqual(["b", "a"]);
      expect(result.hasMatchFilters).toBe(false);
    });

    it("outranks text relevance among search matches", () => {
      const result = listing(
        [company("exact", { name: "Ballet" }), company("fav", { name: "Ballet Nacional", is_favorite: true })],
        { query: "ballet", favoritesFirst: true },
      );

      expect(ids(result)).toEqual(["fav", "exact"]);
    });
  });

  describe("matching filters", () => {
    it("keeps non-matching companies after the matches, both ordered by favorites and upcoming", () => {
      const result = listing(
        [
          company("es-red", { country: "Spain", auditions: [RED] }),
          company("fr-open", { country: "France", auditions: [GREEN] }),
          company("es-open", { country: "Spain", auditions: [GREEN] }),
          company("fr-fav", { country: "France", is_favorite: true, auditions: [RED] }),
        ],
        { country: "Spain", favoritesFirst: true, upcomingFirst: true },
      );

      expect(ids(result)).toEqual(["es-open", "es-red", "fr-fav", "fr-open"]);
      expect(result.matchCount).toBe(2);
      expect(result.hasMatchFilters).toBe(true);
    });

    it("matches by company type", () => {
      const result = listing(
        [
          company("event", { type: CompanyType.EVENTS }),
          company("school", { type: CompanyType.PROFESSIONAL_EDUCATION }),
        ],
        { types: [CompanyType.PROFESSIONAL_EDUCATION] },
      );

      expect(ids(result)).toEqual(["school", "event"]);
      expect(result.matchCount).toBe(1);
    });
  });
});
