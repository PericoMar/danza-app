// hooks/useCountryCompanies.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import { Audition } from "@/types/audition";

export interface CountryCompany {
  id: string;
  name: string;
  location: string | null;
  country: string | null;
  auditions: Audition[];
}

// Companies for a single country, used by the globe's country modal.
export function useCountryCompanies(isoCode: string | null) {
  return useQuery<CountryCompany[]>({
    queryKey: ["companies-by-country", isoCode],
    enabled: !!isoCode,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies_enriched")
        .select("id,name,location,country,country_iso_code,auditions")
        .eq("country_iso_code", isoCode)
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        ...row,
        auditions: Array.isArray(row.auditions) ? (row.auditions as Audition[]) : [],
      })) as CountryCompany[];
    },
  });
}
