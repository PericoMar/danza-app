// hooks/useAuditions.ts
import { useEffect, useState } from "react";
import type { AuditionWithCompany } from "@/types/audition";
import { fetchLiveAuditions } from "@/services/auditions";
import { sortAuditionsByRelevance } from "@/utils/auditions";

/**
 * Las `limit` audiciones vivas (activas y no pasadas) más relevantes, con
 * nombre de compañía, en el mismo orden que el resto de la app.
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
        const rows = await fetchLiveAuditions();
        if (!cancelled) setData(sortAuditionsByRelevance(rows).slice(0, limit));
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
