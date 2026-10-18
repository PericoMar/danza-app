// Datos para detectar una dirección mal tecleada antes de mandarla al proveedor
// de la newsletter. Una lista cerrada y no una heurística: lo que se bloquea
// tiene que ser algo que nunca existe, no algo que nos parece raro.

/**
 * Terminaciones que solo salen de un resbalón sobre ".com" — ninguna existe en
 * la raíz de IANA. ".co" no está: es Colombia y se usa de verdad.
 */
export const TLD_TYPOS: Record<string, string> = {
  con: "com",
  cmo: "com",
  comm: "com",
  cpm: "com",
  vom: "com",
  xom: "com",
  ocm: "com",
  cim: "com",
  ney: "net",
  nte: "net",
  ogr: "org",
};

/**
 * Dominios de correo masivos. Una distancia de edición de 1 contra uno de estos
 * es un error de tecleo con práctica seguridad ("gmial.com", "gmail.co",
 * "hotmai.com"); un dominio propio queda lejos de todos y no se toca.
 */
export const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.es",
  "outlook.com",
  "outlook.es",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.es",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "mail.com",
  "telefonica.net",
] as const;
