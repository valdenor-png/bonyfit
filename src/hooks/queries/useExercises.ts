import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

export function useExercises(muscleGroup?: string) {
  return useQuery({
    queryKey: ['exercises', muscleGroup],
    queryFn: async () => {
      let query = supabase
        .from('exercises')
        .select('id, name, muscle_group, equipment, image_url')
        .order('name');
      if (muscleGroup) query = query.eq('muscle_group', muscleGroup);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });
}
