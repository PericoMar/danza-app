import Fuse, { IFuseOptions } from "fuse.js";
import type { Company } from "@/hooks/useCompanies";
import type { CompanyType } from "@/types/company";
import { getUpcomingTimestampForCompany } from "@/utils/auditions";

// ---------------------------------------------------------------------------
// Listado de compañías. Los filtros tienen dos papeles:
//
//   - Texto, país y tipo SEPARAN: las compañías que los cumplen van arriba y
//     el resto debajo (la pantalla las divide con "Other companies").
//   - Favoritos y "upcoming" ORDENAN dentro de cada bloque, y siempre mandan:
//     favoritos > upcoming > relevancia del texto (esta solo desempata).
// ---------------------------------------------------------------------------

export type CompanyListingFilters = {
  query: string;
  country: string | null;
  types: readonly CompanyType[];
  favoritesFirst: boolean;
  upcomingFirst: boolean;
};

export type CompanyListing = {
  /** Las que cumplen texto/país/tipo, seguidas del resto. */
  companies: Company[];
  /** Cuántas de las primeras entradas de `companies` cumplen texto/país/tipo. */
  matchCount: number;
  /** Si hay algún filtro de texto, país o tipo activo. */
  hasMatchFilters: boolean;
};

type Comparator = (a: Company, b: Company) => number;

const FUSE_OPTIONS: IFuseOptions<Company> = {
  keys: [
    { name: "name", weight: 0.7, getFn: (c) => normalizeText(c.name) },
    { name: "description", weight: 0.3, getFn: (c) => normalizeText(c.description ?? "") },
  ],
  threshold: 0.3,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

// Los resultados de Fuse van siempre por detrás de cualquier nivel literal.
const FUZZY_RANK_OFFSET = 100;

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function createCompanySearchIndex(companies: Company[]): Fuse<Company> {
  return new Fuse(companies, FUSE_OPTIONS);
}

/**
 * Ranking por niveles: las coincidencias literales en el nombre ganan siempre,
 * y Fuse solo rellena lo que no casó de forma literal. Menor = más relevante;
 * una compañía ausente del mapa no coincide con la búsqueda.
 */
function rankBySearch(
  companies: Company[],
  query: string,
  searchIndex: Fuse<Company>
): Map<string, number> {
  const q = normalizeText(query);
  const rank = new Map<string, number>();

  for (const c of companies) {
    const name = normalizeText(c.name);
    let tier: number | null = null;
    if (name === q) tier = 0;
    else if (name.startsWith(q)) tier = 1;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) tier = 2;
    else if (name.includes(q)) tier = 3;
    if (tier !== null) rank.set(c.id, tier);
  }

  searchIndex.search(q).forEach((r, i) => {
    if (!rank.has(r.item.id)) rank.set(r.item.id, FUZZY_RANK_OFFSET + i);
  });

  return rank;
}

function sortBy(list: Company[], comparators: Comparator[]): Company[] {
  if (comparators.length === 0) return list;
  return [...list].sort((a, b) => {
    for (const compare of comparators) {
      const diff = compare(a, b);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

const byFavorite: Comparator = (a, b) =>
  Number(b.is_favorite === true) - Number(a.is_favorite === true);

export function buildCompanyListing(
  companies: Company[],
  filters: CompanyListingFilters,
  options: { searchIndex?: Fuse<Company>; today?: Date } = {}
): CompanyListing {
  const query = filters.query.trim();
  const searchRank = query
    ? rankBySearch(companies, query, options.searchIndex ?? createCompanySearchIndex(companies))
    : null;

  const isMatch = (c: Company) =>
    (!searchRank || searchRank.has(c.id)) &&
    (!filters.country || c.country === filters.country) &&
    (filters.types.length === 0 || filters.types.includes(c.type));

  const priority: Comparator[] = [];
  if (filters.favoritesFirst) priority.push(byFavorite);
  if (filters.upcomingFirst) {
    // Precalculado: el timestamp recorre todas las audiciones de la compañía.
    const upcomingTs = new Map(
      companies.map((c) => [c.id, getUpcomingTimestampForCompany(c, options.today)])
    );
    priority.push((a, b) => upcomingTs.get(a.id)! - upcomingTs.get(b.id)!);
  }

  const bySearch: Comparator = (a, b) =>
    // Mismo nivel: primero el nombre más corto ("UGC" antes que "UGC Danza ...").
    searchRank!.get(a.id)! - searchRank!.get(b.id)! || a.name.length - b.name.length;

  const matches = companies.filter(isMatch);
  const rest = companies.filter((c) => !isMatch(c));

  return {
    companies: [
      ...sortBy(matches, searchRank ? [...priority, bySearch] : priority),
      ...sortBy(rest, priority),
    ],
    matchCount: matches.length,
    hasMatchFilters: Boolean(query || filters.country || filters.types.length > 0),
  };
}
