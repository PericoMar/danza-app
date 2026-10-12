// hooks/useAuditions.ts
import { useEffect, useState } from "react";
import type { AuditionWithCompany } from "@/types/audition";
import { fetchUpcomingAuditions } from "@/services/auditions";

/**
 * Próximas audiciones (activas y no pasadas) con nombre de compañía, de la
 * fecha de audición más cercana a la más lejana.
 */
export function useAuditions(limit = 5) {
  const [data, setData] = useState<AuditionWithCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (limit <= 0) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const rows = await fetchUpcomingAuditions(limit);
        if (!cancelled) setData(rows);
      } catch (e: any) {
        console.warn("useAuditions:", e?.message || e);
        if (!cancelled) {
          setError(e?.message || "Failed to load auditions");
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { data, loading, error };
}
