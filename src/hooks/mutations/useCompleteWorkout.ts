import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

interface WorkoutPayload {
  user_id: string;
  template_id?: string;
  duration_seconds: number;
  total_sets: number;
  total_exercises: number;
  completed_all: boolean;
  notes?: string;
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutData: WorkoutPayload) => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert(workoutData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['workout-history'] });
    },
  });
}
