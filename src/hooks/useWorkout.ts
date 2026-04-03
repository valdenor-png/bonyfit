import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type {
  WorkoutSession,
  WorkoutTemplate,
  ExerciseProgress,
} from '../types/workout';

// Points constants
const POINTS_PER_SET = 15;
const POINTS_PER_EXERCISE = 50;
const POINTS_ALL_COMPLETE_BONUS = 200;
const POINTS_CHECK_IN = 100;

interface WorkoutState {
  session: WorkoutSession | null;
  template: WorkoutTemplate | null;
  exerciseProgress: ExerciseProgress[];
  currentExerciseIndex: number;
  currentSetIndex: number;
  isResting: boolean;
  restTimeLeft: number;
  sessionPoints: number;
  elapsedTime: number;
  catracaValidated: boolean;

  // Internal timer refs (not exposed to consumers)
  _elapsedInterval: ReturnType<typeof setInterval> | null;
  _restInterval: ReturnType<typeof setInterval> | null;

  startWorkout: (userId: string, unitId: string) => Promise<void>;
  confirmSet: () => void;
  skipExercise: () => void;
  endWorkout: () => Promise<void>;
  goToExercise: (index: number) => void;
  startRest: (seconds: number) => void;
}

export const useWorkout = create<WorkoutState>((set, get) => ({
  session: null,
  template: null,
  exerciseProgress: [],
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  isResting: false,
  restTimeLeft: 0,
  sessionPoints: 0,
  elapsedTime: 0,
  catracaValidated: false,
  _elapsedInterval: null,
  _restInterval: null,

  startWorkout: async (userId: string, unitId: string) => {
    const state = get();

    if (!state.catracaValidated) {
      throw new Error(
        'Catraca não validada. Passe na catraca antes de iniciar o treino.',
      );
    }

    // Clean up any existing timers
    if (state._elapsedInterval) clearInterval(state._elapsedInterval);
    if (state._restInterval) clearInterval(state._restInterval);

    // Fetch the workout template for today
    const dayOfWeek = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
    });

    const { data: templateData, error: templateError } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (templateError) throw templateError;

    const template = templateData as WorkoutTemplate;

    // Create a new workout session
    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        unit_id: unitId,
        started_at: new Date().toISOString(),
        catraca_validated: true,
        total_points: 0,
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    const session = sessionData as WorkoutSession;

    // Initialize exercise progress
    const exerciseProgress: ExerciseProgress[] = template.exercises.map(
      (exercise) => ({
        exercise,
        status: 'pending' as const,
        setsCompleted: 0,
        totalSets: exercise.sets,
        pointsEarned: 0,
      }),
    );

    // Mark the first exercise as in progress
    if (exerciseProgress.length > 0) {
      exerciseProgress[0].status = 'in_progress';
    }

    // Start elapsed time counter
    const elapsedInterval = setInterval(() => {
      set((s) => ({ elapsedTime: s.elapsedTime + 1 }));
    }, 1000);

    set({
      session,
      template,
      exerciseProgress,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isResting: false,
      restTimeLeft: 0,
      sessionPoints: POINTS_CHECK_IN,
      elapsedTime: 0,
      _elapsedInterval: elapsedInterval,
      _restInterval: null,
    });
  },

  confirmSet: () => {
    const state = get();
    if (state.isResting && state.restTimeLeft > 0) return; // Anti-fraud: can't confirm during rest

    const { exerciseProgress, currentExerciseIndex, currentSetIndex } = state;
    if (!exerciseProgress.length) return;

    const updated = [...exerciseProgress];
    const current = { ...updated[currentExerciseIndex] };
    let points = state.sessionPoints + POINTS_PER_SET;

    current.setsCompleted = currentSetIndex + 1;
    current.pointsEarned += POINTS_PER_SET;

    // Check if exercise is completed
    if (current.setsCompleted >= current.totalSets) {
      current.status = 'completed';
      points += POINTS_PER_EXERCISE;
      current.pointsEarned += POINTS_PER_EXERCISE;

      updated[currentExerciseIndex] = current;

      // Check if all exercises are completed
      const allCompleted = updated.every(
        (ep) => ep.status === 'completed' || ep.status === 'skipped',
      );
      if (allCompleted) {
        points += POINTS_ALL_COMPLETE_BONUS;
      }

      // Move to next pending exercise
      const nextIndex = updated.findIndex(
        (ep, i) => i > currentExerciseIndex && ep.status === 'pending',
      );

      if (nextIndex !== -1) {
        updated[nextIndex] = { ...updated[nextIndex], status: 'in_progress' };
        set({
          exerciseProgress: updated,
          sessionPoints: points,
          currentExerciseIndex: nextIndex,
          currentSetIndex: 0,
        });
      } else {
        set({
          exerciseProgress: updated,
          sessionPoints: points,
        });
      }
    } else {
      updated[currentExerciseIndex] = current;

      // Start rest timer before next set
      const restSeconds = current.exercise.rest_seconds;

      set({
        exerciseProgress: updated,
        sessionPoints: points,
        currentSetIndex: currentSetIndex + 1,
      });

      if (restSeconds > 0) {
        get().startRest(restSeconds);
      }
    }

    // Log the set to the database
    if (state.session) {
      supabase
        .from('workout_logs')
        .insert({
          session_id: state.session.id,
          exercise_id: current.exercise.id,
          set_number: currentSetIndex + 1,
          reps: current.exercise.reps,
          weight: current.exercise.weight,
          confirmed_at: new Date().toISOString(),
          points_earned: POINTS_PER_SET,
        })
        .then(() => {});
    }
  },

  skipExercise: () => {
    const state = get();
    const { exerciseProgress, currentExerciseIndex } = state;
    if (!exerciseProgress.length) return;

    // Clear any rest timer
    if (state._restInterval) {
      clearInterval(state._restInterval);
    }

    const updated = [...exerciseProgress];
    updated[currentExerciseIndex] = {
      ...updated[currentExerciseIndex],
      status: 'skipped',
    };

    // Move to next pending exercise
    const nextIndex = updated.findIndex(
      (ep, i) => i > currentExerciseIndex && ep.status === 'pending',
    );

    if (nextIndex !== -1) {
      updated[nextIndex] = { ...updated[nextIndex], status: 'in_progress' };
      set({
        exerciseProgress: updated,
        currentExerciseIndex: nextIndex,
        currentSetIndex: 0,
        isResting: false,
        restTimeLeft: 0,
        _restInterval: null,
      });
    } else {
      set({
        exerciseProgress: updated,
        isResting: false,
        restTimeLeft: 0,
        _restInterval: null,
      });
    }
  },

  endWorkout: async () => {
    const state = get();

    // Clear timers
    if (state._elapsedInterval) clearInterval(state._elapsedInterval);
    if (state._restInterval) clearInterval(state._restInterval);

    // Update session in the database
    if (state.session) {
      await supabase
        .from('workout_sessions')
        .update({
          ended_at: new Date().toISOString(),
          total_points: state.sessionPoints,
        })
        .eq('id', state.session.id);

      // Add points to the user
      await supabase.rpc('increment_user_points', {
        p_user_id: state.session.user_id,
        p_points: state.sessionPoints,
      });
    }

    set({
      session: null,
      template: null,
      exerciseProgress: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isResting: false,
      restTimeLeft: 0,
      sessionPoints: 0,
      elapsedTime: 0,
      catracaValidated: false,
      _elapsedInterval: null,
      _restInterval: null,
    });
  },

  goToExercise: (index: number) => {
    const state = get();
    const { exerciseProgress } = state;

    if (index < 0 || index >= exerciseProgress.length) return;

    const ep = exerciseProgress[index];
    if (ep.status === 'completed' || ep.status === 'skipped') return;

    // Clear rest timer
    if (state._restInterval) {
      clearInterval(state._restInterval);
    }

    const updated = [...exerciseProgress];

    // Mark current as pending if it was in_progress
    if (updated[state.currentExerciseIndex]?.status === 'in_progress') {
      updated[state.currentExerciseIndex] = {
        ...updated[state.currentExerciseIndex],
        status: 'pending',
      };
    }

    updated[index] = { ...updated[index], status: 'in_progress' };

    set({
      exerciseProgress: updated,
      currentExerciseIndex: index,
      currentSetIndex: updated[index].setsCompleted,
      isResting: false,
      restTimeLeft: 0,
      _restInterval: null,
    });
  },

  startRest: (seconds: number) => {
    const state = get();

    // Clear any existing rest timer
    if (state._restInterval) {
      clearInterval(state._restInterval);
    }

    set({ isResting: true, restTimeLeft: seconds });

    const restInterval = setInterval(() => {
      const current = get();
      const newTime = current.restTimeLeft - 1;

      if (newTime <= 0) {
        clearInterval(restInterval);
        set({ isResting: false, restTimeLeft: 0, _restInterval: null });
      } else {
        set({ restTimeLeft: newTime });
      }
    }, 1000);

    set({ _restInterval: restInterval });
  },
}));
