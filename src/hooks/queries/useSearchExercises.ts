import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

export function useSearchExercises(query: string) {
  return useQuery({
    queryKey: ['search-exercises', query],
    queryFn: async () => {
      if (query.length < 2) return [];

      // Try FTS first, fallback to ILIKE
      const { data, error } = await supabase
        .rpc('search_exercises', { query_text: query, result_limit: 20 });

      if (error) {
        // Fallback to ILIKE if RPC doesn't exist yet
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('exercises')
          .select('id, name, muscle_group, equipment')
          .ilike('name', `%${query}%`)
          .order('name')
          .limit(20);
        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      return data;
    },
    enabled: query.length >= 2,
    staleTime: 60 * 1000,
  });
}
