/**
 * The URL form of a text: ascii, lowercase, hyphenated.
 *
 * Mirrors `public.slugify` in the database, which is what actually assigns a
 * company its slug. This copy exists because the web build has to turn a
 * country name into a URL segment without asking Postgres. The two must agree:
 * change one, change the other.
 *
 * Accents are dropped rather than transliterated — Skånes becomes skanes — and
 * apostrophes close up rather than break a word.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/ß/g, "ss")
    .replace(/['’]/g, "")
    // Splits a letter from its accent so the accent can be dropped.
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // The letters NFD leaves whole.
    .replace(/ø/g, "o")
    .replace(/ł/g, "l")
    .replace(/đ/g, "d")
    .replace(/ŧ/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** A uuid, as opposed to a slug. Both can arrive in the same URL segment. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}
