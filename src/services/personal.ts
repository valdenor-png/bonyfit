import { supabase } from './supabase';

export async function fetchMeusAlunos(personalId: string) {
  const { data } = await supabase
    .from('personal_alunos')
    .select(`
      id, vinculado_em, status,
      aluno:aluno_id(id, name, avatar_url, level, total_points)
    `)
    .eq('personal_id', personalId)
    .eq('status', 'ativo');
  return data || [];
}

export async function fetchPlanoAluno(alunoId: string) {
  const { data } = await supabase
    .from('workout_plans')
    .select(`
      *,
      personal:personal_id(name, avatar_url),
      splits:workout_plan_splits(
        *,
        exercises:workout_plan_split_exercises(
          *,
          exercise:exercise_id(id, name, muscle_group, equipment, tips)
        )
      )
    `)
    .eq('aluno_id', alunoId)
    .eq('status', 'ativo')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function fetchUltimoTreino(alunoId: string) {
  const { data } = await supabase
    .from('workout_logs_v2')
    .select('id, name, workout_date, duration_seconds, volume_total')
    .eq('user_id', alunoId)
    .order('workout_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function fetchUltimosTreinos(alunoId: string, limit = 5) {
  const { data } = await supabase
    .from('workout_logs_v2')
    .select('id, name, workout_date, duration_seconds, volume_total')
    .eq('user_id', alunoId)
    .order('workout_date', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function fetchAvaliacoes(alunoId: string, limit = 3) {
  const { data } = await supabase
    .from('avaliacoes_fisicas')
    .select('id, data, peso, gordura_corporal')
    .eq('user_id', alunoId)
    .order('data', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function salvarPlano(plan: any, splits: any[]) {
  // Insert plan
  const { data: planData, error: planError } = await supabase
    .from('workout_plans')
    .insert(plan)
    .select('id')
    .single();
  if (planError) throw planError;

  // Insert splits with exercises
  for (const split of splits) {
    const { data: splitData, error: splitError } = await supabase
      .from('workout_plan_splits')
      .insert({ plan_id: planData.id, label: split.label, nome: split.nome, ordem: split.ordem })
      .select('id')
      .single();
    if (splitError) throw splitError;

    if (split.exercises?.length > 0) {
      const exRows = split.exercises.map((ex: any, i: number) => ({
        split_id: splitData.id,
        exercise_id: ex.exercise_id,
        series: ex.series || 3,
        repeticoes: ex.repeticoes || '12',
        descanso_seg: ex.descanso_seg || 90,
        carga_kg: ex.carga_kg || null,
        observacoes: ex.observacoes || null,
        ordem: i,
      }));
      await supabase.from('workout_plan_split_exercises').insert(exRows);
    }
  }
  return planData.id;
}
