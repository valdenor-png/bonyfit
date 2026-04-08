import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

export function useLeaderboard(period: 'weekly' | 'monthly' | 'all' = 'all') {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar_url, total_points, level, current_streak')
        .order('total_points', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
