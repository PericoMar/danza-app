import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { Review } from '@/hooks/useReviews'; // Reuse the existing Review interface

export function useUserReviews(userId: string | undefined) {
  return useQuery<Review[]>({
    queryKey: ['user-reviews', userId],
    queryFn: async () => {
      if (!userId) return []; // Return empty array if userId is not provided

      const { data, error } = await supabase
        .from('reviews')
        .select('*') // Select all review fields
        .eq('user_id', userId) // Filter by the user_id
        .order('created_at', { ascending: false }); // Order by creation date

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!userId, // Only run the query if userId is available
  });
}
