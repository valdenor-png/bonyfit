import { supabase } from './supabase';

export async function fetchLogsMes(userId: string, ano: number, mes: number) {
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const fim = new Date(ano, mes, 0).toISOString().split('T')[0]; // last day
  const { data } = await supabase
    .from('workout_logs_v2')
    .select('id, workout_date, volume_total, points_earned, duration_seconds, name')
    .eq('user_id', userId)
    .gte('workout_date', inicio)
    .lte('workout_date', fim)
    .order('workout_date');
  return data || [];
}

export async function fetchLogsRecentes(userId: string, offset: number, limit: number) {
  const { data } = await supabase
    .from('workout_logs_v2')
    .select('id, name, workout_date, started_at, duration_seconds, volume_total, points_earned')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return data || [];
}

export async function fetchExerciseHistory(userId: string, exerciseId: string) {
  const { data } = await supabase
    .from('workout_sets')
    .select('weight_kg, reps, set_index, workout_log_id, created_at')
    .eq('exercise_id', exerciseId)
    .eq('is_completed', true)
    .order('created_at', { ascending: true });
  // Group by workout_log_id to get per-session data
  return data || [];
}

export async function fetchPreviousSets(userId: string, exerciseId: string) {
  const { data: lastLog } = await supabase
    .from('workout_logs_v2')
    .select('id')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  if (!lastLog) return [];
  const { data } = await supabase
    .from('workout_sets')
    .select('set_index, weight_kg, reps')
    .eq('workout_log_id', lastLog.id)
    .eq('exercise_id', exerciseId)
    .order('set_index');
  return data || [];
}

export async function fetchExerciciosFrequentes(userId: string) {
  // Get exercise_ids from recent sets, count frequency
  const { data } = await supabase
    .from('workout_sets')
    .select('exercise_id, exercises(id, name, muscle_group)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (!data) return [];
  const freq: Record<string, { id: string; name: string; muscle_group: string; count: number }> = {};
  data.forEach((s: any) => {
    const eid = s.exercise_id;
    if (!freq[eid] && s.exercises) freq[eid] = { ...s.exercises, count: 0 };
    if (freq[eid]) freq[eid].count++;
  });
  return Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 10);
}
