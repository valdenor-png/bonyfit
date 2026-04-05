import { create } from 'zustand';
import { supabase } from '../services/supabase';

// ── Interfaces ──────────────────────────────────────────────────────────

interface ActiveSet {
  id: string;
  setIndex: number;
  setType: 'warmup' | 'normal' | 'drop_set' | 'failure';
  weightKg: number | null;
  reps: number | null;
  isCompleted: boolean;
  previousWeight: number | null;
  previousReps: number | null;
}

interface ActiveExercise {
  id: string; // local UUID
  exerciseId: string; // DB exercise ID
  exerciseName: string;
  muscleGroup: string;
  sets: ActiveSet[];
}

interface ActiveWorkout {
  id: string;
  name: string;
  templateId: string | null;
  startedAt: number; // Date.now()
  exercises: ActiveExercise[];
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    targetSets: number;
    targetReps: string;
    targetWeight: number | null;
    restSeconds: number;
  }[];
  createdAt: string;
}

// ── Store interface ─────────────────────────────────────────────────────

interface WorkoutStore {
  activeWorkout: ActiveWorkout | null;
  isWorkoutActive: boolean;
  elapsedSeconds: number;
  restTimerSeconds: number;
  isRestTimerActive: boolean;
  templates: WorkoutTemplate[];

  startWorkout: (name: string, templateId?: string) => void;
  addExercise: (exerciseId: string, exerciseName: string, muscleGroup: string) => void;
  removeExercise: (localExerciseId: string) => void;
  addSet: (localExerciseId: string) => void;
  updateSet: (
    localExerciseId: string,
    setIndex: number,
    data: { weightKg?: number | null; reps?: number | null }
  ) => void;
  deleteSet: (localExerciseId: string, setIndex: number) => void;
  completeSet: (localExerciseId: string, setIndex: number) => void;
  startRestTimer: (seconds: number) => void;
  tickRestTimer: () => void;
  stopRestTimer: () => void;
  tickElapsed: () => void;
  finishWorkout: (userId: string) => Promise<number>;
  discardWorkout: () => void;
  fetchTemplates: (userId: string) => Promise<void>;
  loadPreviousSets: (exerciseId: string, userId: string) => Promise<void>;
}

// ── Helpers ─────────────────────────────────────────────────────────────

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const makeEmptySet = (index: number): ActiveSet => ({
  id: generateId(),
  setIndex: index,
  setType: 'normal',
  weightKg: null,
  reps: null,
  isCompleted: false,
  previousWeight: null,
  previousReps: null,
});

const initialState = {
  activeWorkout: null as ActiveWorkout | null,
  isWorkoutActive: false,
  elapsedSeconds: 0,
  restTimerSeconds: 0,
  isRestTimerActive: false,
  templates: [] as WorkoutTemplate[],
};

// ── Store ───────────────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  ...initialState,

  // ── Workout lifecycle ───────────────────────────────────────────────

  startWorkout: (name, templateId) =>
    set({
      activeWorkout: {
        id: Date.now().toString(),
        name,
        templateId: templateId ?? null,
        startedAt: Date.now(),
        exercises: [],
      },
      isWorkoutActive: true,
      elapsedSeconds: 0,
    }),

  discardWorkout: () => set({ ...initialState }),

  // ── Exercise management ─────────────────────────────────────────────

  addExercise: (exerciseId, exerciseName, muscleGroup) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const newExercise: ActiveExercise = {
        id: generateId(),
        exerciseId,
        exerciseName,
        muscleGroup,
        sets: [makeEmptySet(0), makeEmptySet(1), makeEmptySet(2)],
      };
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: [...state.activeWorkout.exercises, newExercise],
        },
      };
    }),

  removeExercise: (localExerciseId) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.filter(
            (e) => e.id !== localExerciseId
          ),
        },
      };
    }),

  // ── Set management ──────────────────────────────────────────────────

  addSet: (localExerciseId) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((ex) =>
            ex.id === localExerciseId
              ? { ...ex, sets: [...ex.sets, makeEmptySet(ex.sets.length)] }
              : ex
          ),
        },
      };
    }),

  updateSet: (localExerciseId, setIndex, data) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((ex) =>
            ex.id === localExerciseId
              ? {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.setIndex === setIndex ? { ...s, ...data } : s
                  ),
                }
              : ex
          ),
        },
      };
    }),

  deleteSet: (localExerciseId, setIndex) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((ex) =>
            ex.id === localExerciseId
              ? {
                  ...ex,
                  sets: ex.sets
                    .filter((s) => s.setIndex !== setIndex)
                    .map((s, i) => ({ ...s, setIndex: i })),
                }
              : ex
          ),
        },
      };
    }),

  completeSet: (localExerciseId, setIndex) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((ex) =>
            ex.id === localExerciseId
              ? {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.setIndex === setIndex
                      ? { ...s, isCompleted: !s.isCompleted }
                      : s
                  ),
                }
              : ex
          ),
        },
      };
    }),

  // ── Timers ──────────────────────────────────────────────────────────

  startRestTimer: (seconds) =>
    set({ restTimerSeconds: seconds, isRestTimerActive: true }),

  tickRestTimer: () =>
    set((state) => {
      if (!state.isRestTimerActive) return state;
      const next = state.restTimerSeconds - 1;
      return next <= 0
        ? { restTimerSeconds: 0, isRestTimerActive: false }
        : { restTimerSeconds: next };
    }),

  stopRestTimer: () => set({ restTimerSeconds: 0, isRestTimerActive: false }),

  tickElapsed: () =>
    set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

  // ── Finish & persist ────────────────────────────────────────────────

  finishWorkout: async (userId) => {
    const { activeWorkout, elapsedSeconds } = get();
    if (!activeWorkout) return 0;

    const completedSets = activeWorkout.exercises.flatMap((ex) =>
      ex.sets.filter((s) => s.isCompleted)
    );

    const volumeTotal = completedSets.reduce(
      (sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0),
      0
    );

    const now = new Date().toISOString();

    // Calculate points: 10 per completed set + 1 per 100 kg volume
    const pointsEarned =
      completedSets.length * 10 + Math.floor(volumeTotal / 100);

    // Insert workout log
    const { data: logData, error: logError } = await supabase
      .from('workout_logs_v2')
      .insert({
        user_id: userId,
        name: activeWorkout.name,
        template_id: activeWorkout.templateId,
        started_at: new Date(activeWorkout.startedAt).toISOString(),
        finished_at: now,
        duration_seconds: elapsedSeconds,
        volume_total: volumeTotal,
        points_earned: pointsEarned,
        exercise_count: activeWorkout.exercises.length,
        set_count: completedSets.length,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error saving workout log:', logError);
      return 0;
    }

    // Insert all completed sets
    const setRows = activeWorkout.exercises.flatMap((ex) =>
      ex.sets
        .filter((s) => s.isCompleted)
        .map((s) => ({
          workout_log_id: logData.id,
          exercise_id: ex.exerciseId,
          set_index: s.setIndex,
          set_type: s.setType,
          weight_kg: s.weightKg,
          reps: s.reps,
        }))
    );

    if (setRows.length > 0) {
      const { error: setsError } = await supabase
        .from('workout_sets')
        .insert(setRows);

      if (setsError) {
        console.error('Error saving workout sets:', setsError);
      }
    }

    // Update user points
    const { error: pointsError } = await supabase.rpc('increment_user_points', {
      p_user_id: userId,
      p_points: pointsEarned,
    });

    if (pointsError) {
      console.error('Error updating points:', pointsError);
    }

    // Reset state
    set({ ...initialState });

    return pointsEarned;
  },

  // ── Templates ───────────────────────────────────────────────────────

  fetchTemplates: async (userId) => {
    const { data: templates, error } = await supabase
      .from('workout_templates')
      .select('id, name, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }

    const templatesWithExercises: WorkoutTemplate[] = await Promise.all(
      (templates ?? []).map(async (t) => {
        const { data: exercises } = await supabase
          .from('workout_template_exercises')
          .select(
            'exercise_id, exercise_name, muscle_group, target_sets, target_reps, target_weight, rest_seconds'
          )
          .eq('template_id', t.id)
          .order('order_index', { ascending: true });

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          createdAt: t.created_at,
          exercises: (exercises ?? []).map((e) => ({
            exerciseId: e.exercise_id,
            exerciseName: e.exercise_name,
            muscleGroup: e.muscle_group,
            targetSets: e.target_sets,
            targetReps: e.target_reps,
            targetWeight: e.target_weight,
            restSeconds: e.rest_seconds,
          })),
        };
      })
    );

    set({ templates: templatesWithExercises });
  },

  // ── Previous sets ───────────────────────────────────────────────────

  loadPreviousSets: async (exerciseId, userId) => {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('set_index, weight_kg, reps, workout_log_id')
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data || data.length === 0) return;

    // Get the most recent workout log for this user that contains this exercise
    const logIds = [...new Set(data.map((d) => d.workout_log_id))];
    const { data: logs } = await supabase
      .from('workout_logs_v2')
      .select('id')
      .eq('user_id', userId)
      .in('id', logIds)
      .order('started_at', { ascending: false })
      .limit(1);

    if (!logs || logs.length === 0) return;

    const lastLogId = logs[0].id;
    const previousSets = data.filter((d) => d.workout_log_id === lastLogId);

    set((state) => {
      if (!state.activeWorkout) return state;
      return {
        activeWorkout: {
          ...state.activeWorkout,
          exercises: state.activeWorkout.exercises.map((ex) =>
            ex.exerciseId === exerciseId
              ? {
                  ...ex,
                  sets: ex.sets.map((s) => {
                    const prev = previousSets.find(
                      (p) => p.set_index === s.setIndex
                    );
                    return prev
                      ? {
                          ...s,
                          previousWeight: prev.weight_kg,
                          previousReps: prev.reps,
                        }
                      : s;
                  }),
                }
              : ex
          ),
        },
      };
    });
  },
}));
