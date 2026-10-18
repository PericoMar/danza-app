// server/slug.mjs
// Mirrors utils/slug.ts, which mirrors public.slugify in the database. Three
// copies because the same rule has to run in Postgres, in the app bundle and in
// the functions under /api, and none of those can import the others. Change
// one, change all three.

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/ß/g, "ss")
    .replace(/['’]/g, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ø/g, "o")
    .replace(/ł/g, "l")
    .replace(/đ/g, "d")
    .replace(/ŧ/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
