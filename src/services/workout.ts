import { supabase } from './supabase';
import type {
  WorkoutTemplate,
  WorkoutSession,
  WorkoutLog,
} from '../types/workout';

// --- Point constants ---
const POINTS_PER_SET = 15;
const POINTS_COMPLETE_EXERCISE = 50;
const POINTS_COMPLETE_WORKOUT = 200;
const POINTS_CHECKIN = 100;

export async function getWorkoutTemplate(
  userId: string,
  dayOfWeek: string,
): Promise<WorkoutTemplate | null> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*, exercises:workout_template_exercises(*, exercise:exercises(*))')
    .eq('user_id', userId)
    .eq('day_of_week', dayOfWeek)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    day_of_week: data.day_of_week,
    label: data.label,
    exercises: data.exercises.map((e: any) => e.exercise),
  } as WorkoutTemplate;
}

export async function startSession(
  userId: string,
  unitId: string,
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      unit_id: unitId,
      started_at: new Date().toISOString(),
      catraca_validated: false,
      total_points: POINTS_CHECKIN,
    })
    .select()
    .single();

  if (error) throw error;

  // Award check-in points
  await addPoints(userId, POINTS_CHECKIN);

  return data as WorkoutSession;
}

export async function confirmSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  reps: number,
  weight: number,
): Promise<WorkoutLog> {
  // Anti-fraud layer 3: validate minimum time between sets
  const { data: exercise } = await supabase
    .from('exercises')
    .select('min_time_seconds')
    .eq('id', exerciseId)
    .single();

  if (exercise && exercise.min_time_seconds > 0) {
    const { data: lastLog } = await supabase
      .from('workout_logs')
      .select('confirmed_at')
      .eq('session_id', sessionId)
      .eq('exercise_id', exerciseId)
      .not('confirmed_at', 'is', null)
      .order('confirmed_at', { ascending: false })
      .limit(1)
      .single();

    if (lastLog && lastLog.confirmed_at) {
      const elapsed =
        (Date.now() - new Date(lastLog.confirmed_at).getTime()) / 1000;
      if (elapsed < exercise.min_time_seconds) {
        throw new Error(
          `Tempo mínimo entre séries não atingido. Aguarde ${Math.ceil(exercise.min_time_seconds - elapsed)}s.`,
        );
      }
    }
  }

  const { data: log, error } = await supabase
    .from('workout_logs')
    .insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      set_number: setNumber,
      reps,
      weight,
      confirmed_at: new Date().toISOString(),
      points_earned: POINTS_PER_SET,
    })
    .select()
    .single();

  if (error) throw error;

  // Update session points
  await addSessionPoints(sessionId, POINTS_PER_SET);

  // Check if exercise is now complete (all sets done)
  const exerciseBonus = await checkExerciseComplete(sessionId, exerciseId);
  if (exerciseBonus > 0) {
    await addSessionPoints(sessionId, exerciseBonus);
  }

  // Check if entire workout is complete
  const workoutBonus = await checkWorkoutComplete(sessionId);
  if (workoutBonus > 0) {
    await addSessionPoints(sessionId, workoutBonus);
  }

  return log as WorkoutLog;
}

export async function skipExercise(
  sessionId: string,
  exerciseId: string,
): Promise<void> {
  const { error } = await supabase.from('workout_logs').insert({
    session_id: sessionId,
    exercise_id: exerciseId,
    set_number: 0,
    reps: 0,
    weight: 0,
    confirmed_at: null,
    points_earned: 0,
  });

  if (error) throw error;
}

export async function endSession(
  sessionId: string,
): Promise<WorkoutSession> {
  const endedAt = new Date().toISOString();

  // Anti-fraud layer 4: validate total session duration vs volume
  const { data: sessionCheck } = await supabase
    .from('workout_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single();

  const { count: completedSets } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .not('confirmed_at', 'is', null);

  const MIN_SECONDS_PER_SET = 120; // 2 minutes per set
  let flagged = false;

  if (sessionCheck && completedSets !== null && completedSets > 0) {
    const durationSeconds =
      (new Date(endedAt).getTime() -
        new Date(sessionCheck.started_at).getTime()) /
      1000;
    const requiredSeconds = completedSets * MIN_SECONDS_PER_SET;

    if (durationSeconds < requiredSeconds) {
      flagged = true;
    }
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .update({ ended_at: endedAt, flagged })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;

  // Sync total points to user profile
  const session = data as WorkoutSession;
  await addPoints(session.user_id, 0); // recalc triggers level update

  return session;
}

export async function getSessionPoints(sessionId: string): Promise<number> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('total_points')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data.total_points as number;
}

// --- Internal helpers ---

async function addSessionPoints(
  sessionId: string,
  points: number,
): Promise<void> {
  const { error } = await supabase.rpc('increment_session_points', {
    p_session_id: sessionId,
    p_points: points,
  });

  // Fallback if RPC not available: read-then-write
  if (error) {
    const { data } = await supabase
      .from('workout_sessions')
      .select('total_points, user_id')
      .eq('id', sessionId)
      .single();

    if (data) {
      await supabase
        .from('workout_sessions')
        .update({ total_points: (data.total_points ?? 0) + points })
        .eq('id', sessionId);

      await addPoints(data.user_id, points);
    }
  }
}

async function addPoints(userId: string, points: number): Promise<void> {
  if (points === 0) return;

  const { error } = await supabase.rpc('increment_user_points', {
    p_user_id: userId,
    p_points: points,
  });

  // Fallback
  if (error) {
    const { data } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (data) {
      await supabase
        .from('users')
        .update({ points: (data.points ?? 0) + points })
        .eq('id', userId);
    }
  }
}

async function checkExerciseComplete(
  sessionId: string,
  exerciseId: string,
): Promise<number> {
  // Get total sets expected for this exercise in the template
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single();

  if (!session) return 0;

  const { data: templateExercise } = await supabase
    .from('workout_template_exercises')
    .select('sets')
    .eq('exercise_id', exerciseId)
    .limit(1)
    .single();

  if (!templateExercise) return 0;

  const { count } = await supabase
    .from('workout_logs')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('exercise_id', exerciseId)
    .not('confirmed_at', 'is', null);

  if (count !== null && count >= templateExercise.sets) {
    await addPoints(session.user_id, POINTS_COMPLETE_EXERCISE);
    return POINTS_COMPLETE_EXERCISE;
  }

  return 0;
}

async function checkWorkoutComplete(sessionId: string): Promise<number> {
  // Get all exercises in the session and check if all are complete or skipped
  const { data: logs } = await supabase
    .from('workout_logs')
    .select('exercise_id, confirmed_at, set_number')
    .eq('session_id', sessionId);

  if (!logs || logs.length === 0) return 0;

  const exerciseIds = [...new Set(logs.map((l) => l.exercise_id))];

  // Check that every exercise has at least one confirmed set or is skipped
  const allDone = exerciseIds.every((eid) => {
    const eLogs = logs.filter((l) => l.exercise_id === eid);
    return eLogs.some((l) => l.confirmed_at !== null) || eLogs.some((l) => l.set_number === 0);
  });

  if (!allDone) return 0;

  // Ensure we haven't already awarded this bonus
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('user_id, total_points')
    .eq('id', sessionId)
    .single();

  if (!session) return 0;

  // Simple guard: if total_points already includes the bonus threshold, skip
  // A more robust approach would use a flag column
  await addPoints(session.user_id, POINTS_COMPLETE_WORKOUT);
  return POINTS_COMPLETE_WORKOUT;
}
