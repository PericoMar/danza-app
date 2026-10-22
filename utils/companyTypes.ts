import type { CompanySubtypeGroup, CompanySubtypeId, CompanyTypeId } from "@/types/company";

/** The subtypes under the given types: a company matches the type filter with any of them. */
export function subtypeIdsOfTypes(
  groups: readonly CompanySubtypeGroup[],
  typeIds: readonly CompanyTypeId[]
): CompanySubtypeId[] {
  return groups
    .filter((group) => typeIds.includes(group.id))
    .flatMap((group) => group.subtypes.map((subtype) => subtype.id));
}

/**
 * The `?types=` ids that name a type of the catalogue, without repeats. A
 * subtype id (what the filter carried while it listed subtypes) stands for its
 * type; anything else is dropped, since nobody could see or untick it.
 */
export function resolveTypeFilter(
  groups: readonly CompanySubtypeGroup[],
  ids: readonly string[]
): CompanyTypeId[] {
  const typeOf = new Map<string, CompanyTypeId>();
  for (const group of groups) {
    for (const subtype of group.subtypes) typeOf.set(subtype.id, group.id);
  }
  for (const group of groups) typeOf.set(group.id, group.id);

  const resolved = ids.map((id) => typeOf.get(id)).filter((id): id is CompanyTypeId => !!id);
  return Array.from(new Set(resolved));
}
