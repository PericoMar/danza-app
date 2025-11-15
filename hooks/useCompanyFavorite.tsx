// hooks/useCompanyFavorite.ts
import { useEffect, useState, useCallback } from "react";
import { isCompanyFavorite } from "@/services/favorites";

export function useCompanyFavorite(companyId?: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const fav = await isCompanyFavorite(companyId);
      setIsFavorite(fav);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo cargar favorito");
      setIsFavorite(false);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    refresh();
  }, [companyId, refresh]);

  return { isFavorite, loading, errorMsg, refresh, setIsFavorite };
}
