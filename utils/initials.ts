// Connector words skipped when picking initials ("Compañía de la Danza" → "CD",
// "María de la Cruz" → "MC").
const NAME_STOPWORDS = new Set(["the", "de", "del", "la", "le", "du", "of", "compañía", "company"]);

/** Up to two uppercase initials for a monogram. Falls back to every word if all are stopwords. */
export function getInitials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w && !NAME_STOPWORDS.has(w.toLowerCase()));
  const source = words.length ? words : name.split(/\s+/).filter(Boolean);
  return source
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
