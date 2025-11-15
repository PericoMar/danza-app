// hooks/useCompany.ts
import { useCallback, useEffect, useState } from "react";
import { CompanyMinimal } from "@/types/audition";
import { fetchCompanyMinimal } from "@/services/auditions";

export function useCompanyMinimal(companyId: string) {
  const [company, setCompany] = useState<CompanyMinimal | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const c = await fetchCompanyMinimal(companyId);
      setCompany(c);
    } catch (e: any) {
      setErrorMsg(e.message ?? "Error loading company");
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { company, loading, errorMsg, refresh };
}
