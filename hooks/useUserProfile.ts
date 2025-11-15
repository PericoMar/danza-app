import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { User } from '@/types/user';

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
  });
}

export function useReviewUsers(userIds: string[]) {
  return useQuery<User[]>({
    queryKey: ['review-users', userIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('user_id', userIds);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: userIds.length > 0, // Solo si hay userIds
  });
}
