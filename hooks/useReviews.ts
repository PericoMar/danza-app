// src/hooks/useReviews.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export interface Review {
  id: string;
  user_id: string;
  created_at: string;
  rating: number;
  visibility_type: string;
  content: {
    salary?: string;
    repertoire?: string;
    staff?: string;
    schedule?: string;
    facilities?: string;
    colleagues?: string;
    city?: string;
    [key: string]: string | undefined;
  };
}

export function useReviews(companyId: string) {
  return useQuery<Review[]>({
    queryKey: ['reviews', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!companyId, // Solo ejecutar si tenemos un companyId
  });
}
