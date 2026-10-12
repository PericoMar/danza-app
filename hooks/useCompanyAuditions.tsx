// hooks/useCompanyAuditions.ts
import { useCallback, useEffect, useState } from "react";
import { Audition } from "@/types/audition";
import { fetchAuditionsByCompany } from "@/services/auditions";

// Audiciones de una compañía (panel de admin), ya con calendario y alturas.
export function useCompanyAuditions(companyId: string) {
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setAuditions(await fetchAuditionsByCompany(companyId));
    } catch (e: any) {
      setErrorMsg(e.message ?? "Error loading auditions");
      setAuditions([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { auditions, loading, errorMsg, refresh };
}
