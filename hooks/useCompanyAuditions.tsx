// hooks/useCompanyAuditions.ts
import { useCallback, useEffect, useState } from "react";
import { Audition, HeightReq } from "@/types/audition";
import { fetchAuditionsByCompany, fetchHeightsForAuditions } from "@/services/auditions";

export function useCompanyAuditions(companyId: string) {
  const [auditions, setAuditions] = useState<Audition[]>([]);
  const [heightsMap, setHeightsMap] = useState<Record<string, HeightReq[]>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const items = await fetchAuditionsByCompany(companyId);
      setAuditions(items);

      const ids = items.map((a) => a.id);
      const hm = await fetchHeightsForAuditions(ids);
      setHeightsMap(hm);
    } catch (e: any) {
      setErrorMsg(e.message ?? "Error loading auditions");
      setAuditions([]);
      setHeightsMap({});
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { auditions, heightsMap, loading, errorMsg, refresh };
}
