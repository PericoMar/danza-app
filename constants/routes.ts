// Rutas de la app que se construyen en más de un sitio.

// Página de una compañía (insights).
export const companyPath = (companyId: string) => `/insights/${companyId}` as const;
