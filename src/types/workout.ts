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
