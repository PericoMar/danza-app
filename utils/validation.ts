import { COMMON_EMAIL_DOMAINS, TLD_TYPOS } from "@/constants/emailDomains";

/**
 * Forma válida de una dirección: algo, una arroba, un dominio con punto y una
 * extensión de al menos dos letras. No admite puntos pegados ni al principio ni
 * al final, que es por donde se colaban direcciones que luego rebotan.
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+$/.test(trimmed)) return false;
  const [local, domain] = trimmed.split("@");
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  return /^(?!-)[a-zA-Z0-9-]+(?<!-)(\.(?!-)[a-zA-Z0-9-]+(?<!-))*\.[a-zA-Z]{2,}$/.test(domain);
}

/**
 * Distancia de edición contando el intercambio de dos letras seguidas como un
 * solo error ("gmial" → "gmail"), que es el desliz más común al teclear. Se
 * corta en cuanto pasa de `max`: solo nos interesa si cae dentro o no.
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    if (Math.min(...d[i]) > max) return max + 1;
  }

  return d[a.length][b.length];
}

/**
 * Devuelve la dirección corregida cuando el dominio es, casi con seguridad, un
 * error de tecleo ("…@gmail.con" → "…@gmail.com"), o `null` si no hay nada que
 * corregir. Pensado para avisar antes de llamar a la API: una suscripción a una
 * dirección inexistente no da error, simplemente no llega nunca.
 */
export function suggestEmailFix(email: string): string | null {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) return null;

  const at = trimmed.lastIndexOf("@");
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();

  // 1. La extensión no existe en ningún dominio.
  const lastDot = domain.lastIndexOf(".");
  const tld = domain.slice(lastDot + 1);
  if (TLD_TYPOS[tld]) {
    return `${local}@${domain.slice(0, lastDot + 1)}${TLD_TYPOS[tld]}`;
  }

  // 2. El dominio se parece demasiado a uno de los grandes.
  if (COMMON_EMAIL_DOMAINS.includes(domain as (typeof COMMON_EMAIL_DOMAINS)[number])) {
    return null;
  }
  for (const known of COMMON_EMAIL_DOMAINS) {
    if (editDistance(domain, known, 1) <= 1) return `${local}@${known}`;
  }

  return null;
}
