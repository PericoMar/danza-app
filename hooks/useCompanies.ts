// src/hooks/useCompanies.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

// Definimos el tipo de Company (puedes extenderlo luego)
export interface Company {
  id: string;
  name: string;
  description: string;
  image: string;
  location: string;
  review_count: number;
  rating_count: number;
  average_rating: number;
  website_url: string;
  instagram_url: string;
  meta_url: string;
  country: string;
  verified: boolean;
}

// Hook para traer compañías
export function useCompanies() {
  return useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}

export function useCompany(companyId: string) {
    return useQuery<Company>({
        queryKey: ['company', companyId],
        queryFn: async () => {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();
    
        if (error) {
            throw new Error(error.message);
        }
    
        return data || null;
        },
    });
}
