import Fuse, { IFuseOptions } from "fuse.js";
import type { Company } from "@/hooks/useCompanies";
import type { CompanyType } from "@/types/company";
import { compareByPrimaryAudition, getPrimaryAudition } from "@/utils/auditions";

// ---------------------------------------------------------------------------
// Listado de compañías. Los filtros tienen dos papeles:
//
//   - Texto, país y tipo SEPARAN: las compañías que los cumplen van arriba y
//     el resto debajo (la pantalla las divide con "Other companies").
//   - Dentro de las que cumplen la búsqueda, el campo que casó manda: primero
//     las que casan por nombre, luego por lugar (dirección o país) y al final
//     las que solo casan por descripción.
//   - Favoritos y "upcoming" ORDENAN dentro de cada bloque (o grupo de
//     búsqueda): favoritos > upcoming > relevancia del texto (desempata).
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

const SearchKey = { NAME: "name", DESCRIPTION: "description" } as const;

const FUSE_OPTIONS: IFuseOptions<Company> = {
  keys: [
    { name: SearchKey.NAME, weight: 0.7, getFn: (c) => normalizeText(c.name) },
    { name: SearchKey.DESCRIPTION, weight: 0.3, getFn: (c) => normalizeText(c.description ?? "") },
  ],
  threshold: 0.3,
  minMatchCharLength: 2,
  ignoreLocation: true,
  // Para saber si un resultado aproximado casó en el nombre o solo en la descripción.
  includeMatches: true,
};

/** Grupos de la búsqueda, de más a menos relevante. Mandan sobre favoritos y upcoming. */
const SearchGroup = {
  /** El nombre contiene la búsqueda literalmente. */
  LITERAL_NAME: 0,
  /** El nombre se parece a la búsqueda (erratas). */
  FUZZY_NAME: 1,
  /** La dirección (`location`) o el país contienen la búsqueda al inicio de una palabra. */
  PLACE: 2,
  /** Solo la descripción casa. */
  DESCRIPTION: 3,
} as const;
type SearchGroup = (typeof SearchGroup)[keyof typeof SearchGroup];

/** Menor = más relevante en ambos campos. */
type SearchRank = { group: SearchGroup; position: number };

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Lo que separa palabras en una dirección ("Pl. de l'Horloge, 84000 Avignon"). */
const WORD_SEPARATOR = /[\s.,;:/()'-]/;

/** Si `q` aparece en `text` empezando una palabra: "wien" en "1010 wien", pero no "bruck" en "innsbruck". */
function includesAtWordStart(text: string, q: string): boolean {
  for (let i = text.indexOf(q); i !== -1; i = text.indexOf(q, i + 1)) {
    if (i === 0 || WORD_SEPARATOR.test(text[i - 1])) return true;
  }
  return false;
}

/**
 * Sin búsqueda aproximada: `location` es una dirección completa y las erratas
 * casarían con nombres de calles.
 */
function matchesPlace(c: Company, q: string): boolean {
  return [c.location, c.country].some((place) => !!place && includesAtWordStart(normalizeText(place), q));
}

export function createCompanySearchIndex(companies: Company[]): Fuse<Company> {
  return new Fuse(companies, FUSE_OPTIONS);
}

/**
 * Las coincidencias literales en el nombre van primero, ordenadas por niveles
 * (exacta > empieza por > alguna palabra empieza por > contiene). Fuse solo
 * rellena lo que no casó de forma literal, separando nombre de descripción.
 * Una compañía ausente del mapa no coincide con la búsqueda.
 */
function rankBySearch(
  companies: Company[],
  query: string,
  searchIndex: Fuse<Company>
): Map<string, SearchRank> {
  const q = normalizeText(query);
  const rank = new Map<string, SearchRank>();
  // Una compañía puede casar por varios campos: se queda con el grupo más relevante.
  const offer = (id: string, candidate: SearchRank) => {
    const current = rank.get(id);
    if (!current || candidate.group < current.group) rank.set(id, candidate);
  };

  for (const c of companies) {
    const name = normalizeText(c.name);
    let position: number | null = null;
    if (name === q) position = 0;
    else if (name.startsWith(q)) position = 1;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) position = 2;
    else if (name.includes(q)) position = 3;
    if (position !== null) offer(c.id, { group: SearchGroup.LITERAL_NAME, position });
    else if (matchesPlace(c, q)) offer(c.id, { group: SearchGroup.PLACE, position: 0 });
  }

  searchIndex.search(q).forEach((r, position) => {
    const matchesName = r.matches?.some((m) => m.key === SearchKey.NAME) ?? false;
    const group = matchesName ? SearchGroup.FUZZY_NAME : SearchGroup.DESCRIPTION;
    offer(r.item.id, { group, position });
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
  options: { searchIndex?: Fuse<Company> } = {}
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
    // Precalculado: elegir la audición principal recorre todas las de la compañía.
    const primary = new Map(companies.map((c) => [c.id, getPrimaryAudition(c)]));
    priority.push((a, b) => compareByPrimaryAudition(primary.get(a.id)!, primary.get(b.id)!));
  }

  const bySearchGroup: Comparator = (a, b) =>
    searchRank!.get(a.id)!.group - searchRank!.get(b.id)!.group;
  const bySearchPosition: Comparator = (a, b) =>
    // Mismo nivel: primero el nombre más corto ("UGC" antes que "UGC Danza ...").
    searchRank!.get(a.id)!.position - searchRank!.get(b.id)!.position ||
    a.name.length - b.name.length;

  const matches = companies.filter(isMatch);
  const rest = companies.filter((c) => !isMatch(c));

  return {
    companies: [
      ...sortBy(matches, searchRank ? [bySearchGroup, ...priority, bySearchPosition] : priority),
      ...sortBy(rest, priority),
    ],
    matchCount: matches.length,
    hasMatchFilters: Boolean(query || filters.country || filters.types.length > 0),
  };
}
