import { create } from 'zustand';
import { supabase } from '../services/supabase';

// ── Interfaces ──────────────────────────────────────────────────────────

interface WorkoutLogEntry {
  id: string;
  name: string;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number;
  volumeTotal: number;
  pointsEarned: number;
  workoutDate: string;
  exerciseCount: number;
  setCount: number;
}

interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number;
  avgDurationMinutes: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
}

interface MeasurementEntry {
  id: string;
  measuredAt: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  leftArmCm: number | null;
  rightArmCm: number | null;
}

// ── Store interface ─────────────────────────────────────────────────────

interface ProgressStore {
  workoutHistory: WorkoutLogEntry[];
  stats: WorkoutStats;
  measurements: MeasurementEntry[];
  loading: boolean;

  fetchHistory: (userId: string, limit?: number) => Promise<void>;
  fetchStats: (userId: string) => Promise<void>;
  fetchMeasurements: (userId: string) => Promise<void>;
  addMeasurement: (
    userId: string,
    data: Omit<MeasurementEntry, 'id' | 'measuredAt'>
  ) => Promise<void>;
  calculateOneRepMax: (weight: number, reps: number) => number;
}

// ── Helpers ─────────────────────────────────────────────────────────────

const defaultStats: WorkoutStats = {
  totalWorkouts: 0,
  totalVolume: 0,
  avgDurationMinutes: 0,
  workoutsThisWeek: 0,
  workoutsThisMonth: 0,
};

const getStartOfWeek = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

const getStartOfMonth = (): string => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return first.toISOString();
};

// ── Store ───────────────────────────────────────────────────────────────

export const useProgressStore = create<ProgressStore>((set, get) => ({
  workoutHistory: [],
  stats: { ...defaultStats },
  measurements: [],
  loading: false,

  // ── Workout history ─────────────────────────────────────────────────

  fetchHistory: async (userId, limit = 20) => {
    set({ loading: true });

    const { data, error } = await supabase
      .from('workout_logs_v2')
      .select(
        'id, name, started_at, finished_at, duration_seconds, volume_total, points_earned, workout_date, exercise_count, set_count'
      )
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching workout history:', error);
      set({ loading: false });
      return;
    }

    const history: WorkoutLogEntry[] = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      durationSeconds: row.duration_seconds,
      volumeTotal: row.volume_total,
      pointsEarned: row.points_earned,
      workoutDate: row.workout_date,
      exerciseCount: row.exercise_count,
      setCount: row.set_count,
    }));

    set({ workoutHistory: history, loading: false });
  },

  // ── Aggregate stats ─────────────────────────────────────────────────

  fetchStats: async (userId) => {
    set({ loading: true });

    const { data: allLogs, error } = await supabase
      .from('workout_logs_v2')
      .select('id, duration_seconds, volume_total, started_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching stats:', error);
      set({ loading: false });
      return;
    }

    const logs = allLogs ?? [];
    const totalWorkouts = logs.length;
    const totalVolume = logs.reduce((sum, l) => sum + (l.volume_total ?? 0), 0);
    const totalDuration = logs.reduce(
      (sum, l) => sum + (l.duration_seconds ?? 0),
      0
    );
    const avgDurationMinutes =
      totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts / 60) : 0;

    const weekStart = getStartOfWeek();
    const monthStart = getStartOfMonth();

    const workoutsThisWeek = logs.filter(
      (l) => l.started_at >= weekStart
    ).length;
    const workoutsThisMonth = logs.filter(
      (l) => l.started_at >= monthStart
    ).length;

    set({
      stats: {
        totalWorkouts,
        totalVolume,
        avgDurationMinutes,
        workoutsThisWeek,
        workoutsThisMonth,
      },
      loading: false,
    });
  },

  // ── Body measurements ───────────────────────────────────────────────

  fetchMeasurements: async (userId) => {
    set({ loading: true });

    const { data, error } = await supabase
      .from('body_measurements_v2')
      .select(
        'id, measured_at, weight_kg, body_fat_pct, chest_cm, waist_cm, left_arm_cm, right_arm_cm'
      )
      .eq('user_id', userId)
      .order('measured_at', { ascending: false });

    if (error) {
      console.error('Error fetching measurements:', error);
      set({ loading: false });
      return;
    }

    const measurements: MeasurementEntry[] = (data ?? []).map((row) => ({
      id: row.id,
      measuredAt: row.measured_at,
      weightKg: row.weight_kg,
      bodyFatPct: row.body_fat_pct,
      chestCm: row.chest_cm,
      waistCm: row.waist_cm,
      leftArmCm: row.left_arm_cm,
      rightArmCm: row.right_arm_cm,
    }));

    set({ measurements, loading: false });
  },

  addMeasurement: async (userId, data) => {
    const { error } = await supabase.from('body_measurements_v2').insert({
      user_id: userId,
      weight_kg: data.weightKg,
      body_fat_pct: data.bodyFatPct,
      chest_cm: data.chestCm,
      waist_cm: data.waistCm,
      left_arm_cm: data.leftArmCm,
      right_arm_cm: data.rightArmCm,
    });

    if (error) {
      console.error('Error adding measurement:', error);
      return;
    }

    // Refresh measurements list
    await get().fetchMeasurements(userId);
  },

  // ── Utility ─────────────────────────────────────────────────────────

  calculateOneRepMax: (weight, reps) => {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    // Epley formula
    return Math.round(weight * (1 + reps / 30) * 100) / 100;
  },
}));
