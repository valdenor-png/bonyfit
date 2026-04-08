import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        uid = user.id;
      }
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}
