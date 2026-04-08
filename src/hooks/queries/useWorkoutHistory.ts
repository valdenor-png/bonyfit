import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

export function useWorkoutHistory(userId?: string) {
  return useQuery({
    queryKey: ['workout-history', userId],
    queryFn: async () => {
      let uid = userId;
      if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        uid = user.id;
      }
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
