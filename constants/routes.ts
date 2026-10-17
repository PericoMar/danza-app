// Rutas de la app que se construyen en más de un sitio.

export const LOGIN_ROUTE = "/login";
export const REGISTER_ROUTE = "/register";

// Configuración de la app (solo admins).
export const ADMIN_SETTINGS_ROUTE = "/admin/settings";

// Página de una compañía (insights).
export const companyPath = (companyId: string) => `/insights/${companyId}` as const;

// Directorio de servicios, profesionales y escuelas.
export const RESOURCES_ROUTE = "/resources";
export const resourcePath = (slug: string) => `/resources/${slug}` as const;

// Alta de un profesional. Sus dos primeras pantallas corren sin sesión: la
// cuenta se pide en la tercera, cuando ya ha construido algo que perder.
export const ONBOARDING_ROUTE = "/onboarding";

// Cola de revisión de fichas (solo admins).
export const ADMIN_RESOURCES_ROUTE = "/admin/resources";

// Rutas que se pueden abrir sin sesión (el resto redirige a /login).
// /support tiene que estar aquí: es la Support URL de App Store Connect y Apple
// la abre sin iniciar sesión (Guideline 1.5).
export const PUBLIC_EXACT_ROUTES = ["/", LOGIN_ROUTE, REGISTER_ROUTE] as const;
export const PUBLIC_ROUTE_PREFIXES = [
  "/companies",
  "/insights",
  "/home",
  "/reset-password",
  "/newsletter",
  "/policies",
  "/ads",
  "/landing",
  "/support",
  RESOURCES_ROUTE,
  ONBOARDING_ROUTE,
] as const;
