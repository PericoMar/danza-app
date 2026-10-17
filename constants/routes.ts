// Rutas de la app que se construyen en más de un sitio.

export const LOGIN_ROUTE = "/login";
export const REGISTER_ROUTE = "/register";

// Destinos de la navegación del sitio (navbar y footer).
export const COMPANIES_ROUTE = "/companies";
export const NEWSLETTER_ROUTE = "/newsletter";
export const POLICIES_ROUTE = "/policies";
export const PRIVACY_POLICY_ROUTE = "/policies/privacy-policy";
export const TERMS_ROUTE = "/policies/terms";
export const SUPPORT_ROUTE = "/support";

// Configuración de la app (solo admins).
export const ADMIN_SETTINGS_ROUTE = "/admin/settings";

// Página de una compañía (insights).
export const COMPANY_ROUTE_PREFIX = "/insights";
export const companyPath = (companyId: string) => `${COMPANY_ROUTE_PREFIX}/${companyId}` as const;

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
