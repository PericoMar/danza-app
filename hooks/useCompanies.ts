// src/hooks/useCompanies.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { Audition } from '@/types/audition';
import { CompanyType } from '@/types/company';
import { deleteImage, extractStoragePath } from '@/services/storage';
import { STORAGE_BUCKETS } from '@/constants/storage';
import { VIEWS } from '@/constants/tables';

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
  type: CompanyType;

  // añadidos
  is_favorite: boolean;
  auditions: Audition[]; // sin orden: usa sortAuditionsByRelevance
  has_live_audition: boolean; // alguna audición activa que no ha pasado
}

const COMPANY_COLUMNS = `
  id,name,description,image,location,review_count,rating_count,average_rating,
  website_url,instagram_url,meta_url,country,verified,last_reviewed_at,country_iso_code,
  type,is_favorite,has_live_audition,
  auditions
`;

// Todas las compañías (con favorito + audiciones)
export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: ['companies', 'last_reviewed_at_desc'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(VIEWS.COMPANIES_ENRICHED)
        .select(COMPANY_COLUMNS)
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
        .from(VIEWS.COMPANIES_ENRICHED)
        .select(COMPANY_COLUMNS)
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);

      // Cada audición de la vista trae todos sus campos (calendario, alturas, estado).
      return {
        ...data!,
        auditions: Array.isArray(data?.auditions) ? (data!.auditions as Audition[]) : [],
      } as Company;
    },
  });
}

// Delete compañía (ver nota de cascadas abajo)
export async function deleteCompany(companyId: string) {
  // Read the logo URL before the row is gone so we can clean it up from Storage after.
  const { data: company } = await supabase
    .from('companies')
    .select('image')
    .eq('id', companyId)
    .maybeSingle();

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

  const result = await supabase.from('companies').delete().eq('id', companyId);
  if (result.error) throw result.error;

  // Best-effort: the row is gone, now drop its logo from Storage too.
  if (company?.image) {
    const path = extractStoragePath(company.image, STORAGE_BUCKETS.MEDIA);
    if (path) {
      try { await deleteImage(STORAGE_BUCKETS.MEDIA, path); } catch { /* non-fatal */ }
    }
  }

  return result;
}
