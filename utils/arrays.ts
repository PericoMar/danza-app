// utils/arrays.ts
// Helpers for plain arrays shared across features.

/** Moves the item at `from` one step towards `direction`; out-of-range moves return the same order. */
export function moveItem<T>(items: T[], from: number, direction: -1 | 1): T[] {
  const to = from + direction;
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) return items;
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
