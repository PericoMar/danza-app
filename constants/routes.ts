// Rutas de la app que se construyen en más de un sitio.

// Página de una compañía (insights).
export const companyPath = (companyId: string) => `/insights/${companyId}` as const;

// Rutas que se pueden abrir sin sesión (el resto redirige a /login).
// /support tiene que estar aquí: es la Support URL de App Store Connect y Apple
// la abre sin iniciar sesión (Guideline 1.5).
export const PUBLIC_EXACT_ROUTES = ["/", "/login", "/register"] as const;
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
