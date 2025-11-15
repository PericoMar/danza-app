// src/hooks/useCompanies.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export interface Audition {
  id: string;
  company_id: string;
  deadline_date: string | null;
  audition_date: string | null;
  email: string | null;
  summary: string | null;
  website_url: string | null;
  location: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  location: string | null;
  review_count: number | null;
  rating_count: number | null;
  average_rating: number | null;
  website_url: string | null;
  instagram_url: string | null;
  meta_url: string | null;
  country: string | null;
  verified: boolean | null;
  last_reviewed_at: string | null;
  country_iso_code: string | null;

  // añadidos
  is_favorite: boolean;
  auditions: Audition[]; // la primera es la más cercana
}

// Todas las compañías (con favorito + audiciones)
export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: ['companies', 'last_reviewed_at_desc'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies_enriched')
        .select(`
          id,name,description,image,location,review_count,rating_count,average_rating,
          website_url,instagram_url,meta_url,country,verified,last_reviewed_at,country_iso_code,
          is_favorite,
          auditions
        `)
        .order('last_reviewed_at', { ascending: false, nullsFirst: false })
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      // Supabase tipa jsonb como any; normalizamos a Audition[].
      return (data ?? []).map(row => ({
        ...row,
        auditions: Array.isArray(row.auditions) ? row.auditions as Audition[] : [],
      })) as Company[];
    },
  });
}

// Una compañía por id (con favorito + audiciones)
export function useCompany(id?: string) {
  return useQuery<Company>({
    queryKey: ['company', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies_enriched')
        .select(`
          id,name,description,image,location,review_count,rating_count,average_rating,
          website_url,instagram_url,meta_url,country,verified,last_reviewed_at,country_iso_code,
          is_favorite,
          auditions
        `)
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);

      const company = {
        ...data!,
        auditions: Array.isArray(data?.auditions) ? (data!.auditions as Audition[]) : [],
      } as Company;

      return company;
    },
  });
}

// Delete compañía (ver nota de cascadas abajo)
export async function deleteCompany(companyId: string) {
  // Si tienes CASCADE en todas (recomendado), basta con borrar la compañía:
  // return await supabase.from('companies').delete().eq('id', companyId);

  // Fallback seguro si no hay CASCADE en reviews:
  // 1) borrar dependientes conocidos y luego la compañía
  const delReviews = supabase.from('reviews').delete().eq('company_id', companyId);
  const delFavs = supabase.from('favorite_companies').delete().eq('company_id', companyId);
  const delAud  = supabase.from('auditions').delete().eq('company_id', companyId);

  const [r1, r2, r3] = await Promise.all([delReviews, delFavs, delAud]);
  if (r1.error) throw r1.error;
  if (r2.error) throw r2.error;
  if (r3.error) throw r3.error;

  return await supabase.from('companies').delete().eq('id', companyId);
}
