// Rutas de la app que se construyen en más de un sitio.

export const LOGIN_ROUTE = "/login";
export const REGISTER_ROUTE = "/register";
export const RESET_PASSWORD_ROUTE = "/reset-password";

// Destinos de la navegación del sitio (navbar y footer).
export const COMPANIES_ROUTE = "/companies";
export const NEWSLETTER_ROUTE = "/newsletter";
export const POLICIES_ROUTE = "/policies";
export const PRIVACY_POLICY_ROUTE = "/policies/privacy-policy";
export const TERMS_ROUTE = "/policies/terms";
export const SUPPORT_ROUTE = "/support";

// Listado filtrado por país. Una ruta propia y no `?country=…` porque es una
// página que debe poder posicionarse por sí misma ("compañías de danza en
// España"), y un buscador trata un parámetro como una variante de la misma.
export const COUNTRY_ROUTE_PREFIX = `${COMPANIES_ROUTE}/in`;
export const countryPath = (countrySlug: string) => `${COUNTRY_ROUTE_PREFIX}/${countrySlug}` as const;
/** The slug countryPath() put in a pathname, or undefined for any other page. */
export const countrySlugFromPath = (pathname: string): string | undefined =>
  pathname.startsWith(`${COUNTRY_ROUTE_PREFIX}/`)
    ? pathname.slice(COUNTRY_ROUTE_PREFIX.length + 1) || undefined
    : undefined;
/** For router.replace(), which fills the segment and leaves the rest as query. */
export const COUNTRY_ROUTE_PATTERN = `${COUNTRY_ROUTE_PREFIX}/[countrySlug]` as const;

// El icono de lupa del header lleva al listado y deja el cursor en el buscador.
// Va como query param y no como handler para que el enlace sea una URL de
// verdad: se puede compartir, y un crawler puede seguirla.
export const FOCUS_PARAM = "focus";
export const FOCUS_SEARCH_VALUE = "search";
export const COMPANIES_SEARCH_ROUTE =
  `${COMPANIES_ROUTE}?${FOCUS_PARAM}=${FOCUS_SEARCH_VALUE}` as const;

// Configuración de la app (solo admins).
export const ADMIN_SETTINGS_ROUTE = "/admin/settings";

// Página de una compañía (insights). Acepta el slug (lo normal) o el id, que
// es lo que llevan los enlaces compartidos antes de que existieran los slugs.
export const COMPANY_ROUTE_PREFIX = "/insights";
export const companyPath = (slugOrId: string) => `${COMPANY_ROUTE_PREFIX}/${slugOrId}` as const;

// Rutas que se pueden abrir sin sesión (el resto redirige a /login).
// /support tiene que estar aquí: es la Support URL de App Store Connect y Apple
// la abre sin iniciar sesión (Guideline 1.5).
export const PUBLIC_EXACT_ROUTES = ["/", LOGIN_ROUTE, REGISTER_ROUTE] as const;
export const PUBLIC_ROUTE_PREFIXES = [
  COMPANIES_ROUTE,
  COMPANY_ROUTE_PREFIX,
  "/home",
  "/reset-password",
  NEWSLETTER_ROUTE,
  POLICIES_ROUTE,
  "/ads",
  "/landing",
  SUPPORT_ROUTE,
] as const;
