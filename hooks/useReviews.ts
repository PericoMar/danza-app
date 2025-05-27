// src/hooks/useReviews.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export interface Review {
  id: string;
  created_at: string;
  content: string;
  rating: number;
  user_id: string;
  company_id: string;
  visibility_type: string;
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
