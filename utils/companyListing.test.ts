import {
  buildCompanyListing,
  type CompanyListing,
  type CompanyListingFilters,
} from "./companyListing";
import { openCall, past, postDeadline } from "./__fixtures__/audition";
import type { Company } from "@/hooks/useCompanies";

// Una audición por cada estado.
const GREEN = openCall("green", "2026-11-01");
const YELLOW = postDeadline("yellow", "2026-11-15");
const RED = past("red", "2026-09-01");

const NO_FILTERS: CompanyListingFilters = {
  query: "",
  country: null,
  subtypes: [],
  favoritesFirst: false,
  upcomingFirst: false,
};

function company(id: string, overrides: Partial<Company> = {}): Company {
  return {
    id,
    slug: id,
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
    is_favorite: false,
    auditions: [],
    has_live_audition: false,
    participating_in_events: [],
    subtypes: [],
    ...overrides,
  };
}

function listing(companies: Company[], filters: Partial<CompanyListingFilters>): CompanyListing {
  return buildCompanyListing(companies, { ...NO_FILTERS, ...filters });
}

const ids = (result: CompanyListing) => result.companies.map((c) => c.id);

describe("buildCompanyListing", () => {
  it("keeps the original order when no filter is active", () => {
    const result = listing([company("b"), company("a", { auditions: [GREEN] })], {});

    expect(ids(result)).toEqual(["b", "a"]);
    expect(result.hasMatchFilters).toBe(false);
  });

  describe("search", () => {
    const named = company("named", { name: "National Youth Ballet" });
    const describedFavoriteWithOpenCall = company("described", {
      name: "Royal Opera",
      description: "Many of our dancers trained at the National Youth Ballet",
      is_favorite: true,
      auditions: [GREEN],
    });
    const allPriorities = { favoritesFirst: true, upcomingFirst: true };

    it("puts name matches before description matches, over favorites and upcoming", () => {
      const result = listing([describedFavoriteWithOpenCall, named], {
        query: "National Youth Ballet",
        ...allPriorities,
      });

      expect(ids(result)).toEqual(["named", "described"]);
      expect(result.matchCount).toBe(2);
    });

    it("puts misspelled name matches before description matches", () => {
      const result = listing([describedFavoriteWithOpenCall, named], {
        query: "natonal youth balet",
        ...allPriorities,
      });

      expect(ids(result)).toEqual(["named", "described"]);
    });

    describe("by place", () => {
      const vienna = company("vienna", { name: "Staatsoper", location: "Opernring 2, 1010 Wien", country: "Austria" });
      const krakow = company("krakow", { name: "Balet", location: "Lubicz 48, 31-512 Kraków", country: "Poland" });
      const innsbruck = company("innsbruck", { name: "Landestheater", location: "Rennweg 2, 6020 Innsbruck" });

      it("matches the city in the address and the country", () => {
        expect(ids(listing([krakow, vienna], { query: "wien" }))[0]).toBe("vienna");
        expect(ids(listing([krakow, vienna], { query: "austria" }))[0]).toBe("vienna");
        expect(listing([krakow, vienna], { query: "wien" }).matchCount).toBe(1);
      });

      it("ignores accents but only matches from the start of a word", () => {
        expect(listing([krakow], { query: "krakow" }).matchCount).toBe(1);
        expect(listing([innsbruck], { query: "bruck" }).matchCount).toBe(0);
      });

      it("puts place matches after name matches and before description matches", () => {
        const result = listing(
          [
            company("described", { name: "Laterna", description: "Founded in Prague in 1958", is_favorite: true }),
            company("placed", { name: "420 People", location: "Maiselova 25/4, 110 00 Prague 1" }),
            company("named", { name: "Prague Chamber Ballet" }),
          ],
          { query: "prague", ...allPriorities },
        );

        expect(ids(result)).toEqual(["named", "placed", "described"]);
      });
    });
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

    it("matches a company that has any of the selected subtypes", () => {
      const result = listing(
        [
          company("unclassified"),
          company("event", { subtypes: ["events"] }),
          company("school", { subtypes: ["school_pro"] }),
          company("everything", {
            subtypes: ["touring", "junior", "pre_professional", "school_pro", "university", "events"],
          }),
          company("junior-touring", { subtypes: ["touring", "junior"] }),
        ],
        { subtypes: ["junior", "school_pro"] },
      );

      expect(ids(result)).toEqual(["school", "everything", "junior-touring", "unclassified", "event"]);
      expect(result.matchCount).toBe(3);
      expect(result.hasMatchFilters).toBe(true);
    });
  });
});
