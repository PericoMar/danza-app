// hooks/useStats.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";

export interface PlatformStats {
  companies: number;
  auditions: number;
  countries: number;
  reviews: number;
}

export function useStats() {
  return useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [companiesRes, auditionsRes, countriesRes, reviewsRes] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("auditions").select("id", { count: "exact", head: true }),
        supabase
          .from("companies")
          .select("country_iso_code")
          .not("country_iso_code", "is", null),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ]);

      const companies = companiesRes.count ?? 0;
      const auditions = auditionsRes.count ?? 0;
      const countries = new Set(
        (countriesRes.data ?? []).map((r: any) => r.country_iso_code as string)
      ).size;
      const reviews = reviewsRes.count ?? 0;

      return { companies, auditions, countries, reviews };
    },
  });
}
