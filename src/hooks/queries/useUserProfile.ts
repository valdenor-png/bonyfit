import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) {
        // Own profile — use safe view (filtered by auth.uid())
        const { data, error } = await supabase
          .from('user_profile_safe')
          .select('*')
          .single();
        if (error) throw error;
        return data;
      }
      // Other user — use public view
      const { data, error } = await supabase
        .from('public_user_profile')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}
