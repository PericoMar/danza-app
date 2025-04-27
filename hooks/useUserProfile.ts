import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export interface User {
  user_id: string;
  name: string;
  bio?: string;
  company?: string;
  location?: string;
  gender?: 'male' | 'female' | 'other'; // Puedes dejarlo como string si prefieres más abierto
  display_local_time?: boolean;
  profile_img: string | null;
  instagram_url?: string;
  linkedin_url?: string;
  website_url?: string;
  created_at: string;
}

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
