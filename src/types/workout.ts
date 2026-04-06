export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  video_url: string | null;
  tips: string | null;
  min_time_seconds: number;
  sets: number;
  reps: number;
  weight: number;
  rest_seconds: number;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  day_of_week: string;
  label: string; // e.g. "Peito + Tríceps + Ombro"
  exercises: Exercise[];
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  unit_id: string;
  started_at: string;
  ended_at: string | null;
  catraca_validated: boolean;
  total_points: number;
}

export interface WorkoutLog {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  confirmed_at: string | null;
  points_earned: number;
}

export type ExerciseStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type SetStatus = 'pending' | 'current' | 'done';

export interface ExerciseProgress {
  exercise: Exercise;
  status: ExerciseStatus;
  setsCompleted: number;
  totalSets: number;
  pointsEarned: number;
}

// ===== PERSONAL TRAINER TYPES =====

export interface WorkoutPlan {
  id: string;
  aluno_id: string;
  personal_id: string;
  nome: string;
  objetivo: string;
  observacoes?: string;
  data_inicio: string;
  data_fim?: string;
  status: 'ativo' | 'pausado' | 'concluido' | 'substituido';
  personal?: { name: string; avatar_url: string | null };
  splits: WorkoutPlanSplit[];
}

export interface WorkoutPlanSplit {
  id: string;
  plan_id: string;
  label: string;
  nome: string;
  dia_semana?: number[];
  ordem: number;
  exercises: PlanSplitExercise[];
}

export interface PlanSplitExercise {
  id: string;
  split_id: string;
  exercise_id: string;
  exercise: Exercise;
  series: number;
  repeticoes: string;
  descanso_seg: number;
  carga_kg?: number;
  tecnica?: string;
  observacoes?: string;
  ordem: number;
}

export interface AlunoVinculado {
  id: string;
  aluno: {
    id: string;
    name: string;
    avatar_url: string | null;
    level: string;
    total_points: number;
  };
  plano_ativo?: { id: string; nome: string } | null;
  ultimo_treino?: string | null;
  vinculado_em: string;
}
