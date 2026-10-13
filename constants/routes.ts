// Rutas de la app que se construyen en más de un sitio.

export const LOGIN_ROUTE = "/login";
export const REGISTER_ROUTE = "/register";

// Configuración de la app (solo admins).
export const ADMIN_SETTINGS_ROUTE = "/admin/settings";

// Página de una compañía (insights).
export const companyPath = (companyId: string) => `/insights/${companyId}` as const;

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
] as const;
