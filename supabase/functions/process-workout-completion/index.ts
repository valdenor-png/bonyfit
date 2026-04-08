import { getServiceClient } from '../_shared/auth.ts';
import { ok, error, cors } from '../_shared/response.ts';

// ── Security caps ────────────────────────────────────────────
const MAX_SETS = 100;
const MAX_EXERCISES = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return cors();

  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record?.user_id) {
      return error('Payload inválido: user_id ausente');
    }

    const supabase = getServiceClient();
    const userId: string = record.user_id;

    // ── 1. CALCULATE POINTS (with safety caps) ──────────────
    const totalSets = Math.min(record.total_sets || 0, MAX_SETS);
    const totalExercises = Math.min(record.total_exercises || 0, MAX_EXERCISES);

    const basePoints = 100;
    const setPoints = totalSets * 15;
    const exercisePoints = totalExercises * 50;
    const fullBonus = record.completed_all ? 200 : 0;
    const rawPoints = basePoints + setPoints + exercisePoints + fullBonus;

    // ── 2. CHECK STREAK ─────────────────────────────────────
    const { data: lastWorkout } = await supabase
      .from('workout_sessions')
      .select('created_at')
      .eq('user_id', userId)
      .neq('id', record.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let streakMultiplier = 1.0;
    const { data: userStats } = await supabase
      .from('users')
      .select('current_streak, push_token, name')
      .eq('id', userId)
      .single();

    if (lastWorkout) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastWorkout.created_at).getTime()) / 86400000
      );
      if (daysSince <= 2) {
        const streak = (userStats?.current_streak || 0) + 1;
        streakMultiplier = Math.min(1 + streak * 0.1, 2.0); // max 2x

        await supabase
          .from('users')
          .update({ current_streak: streak })
          .eq('id', userId);
      } else {
        // Streak broken
        await supabase
          .from('users')
          .update({ current_streak: 1 })
          .eq('id', userId);
      }
    }

    const finalPoints = Math.round(rawPoints * streakMultiplier);

    // ── 3. UPDATE POINTS VIA RPC ────────────────────────────
    await supabase.rpc('add_user_points', {
      p_user_id: userId,
      p_points: finalPoints,
    });

    // ── 4. CHECK ACHIEVEMENTS ───────────────────────────────
    const { data: user } = await supabase
      .from('users')
      .select('total_points, current_streak')
      .eq('id', userId)
      .single();

    const { count: totalWorkouts } = await supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const achievementChecks = [
      { condition: totalWorkouts === 1, badge: 'first_workout' },
      { condition: totalWorkouts === 10, badge: 'workout_10' },
      { condition: totalWorkouts === 50, badge: 'workout_50' },
      { condition: totalWorkouts === 100, badge: 'centurion' },
      { condition: user?.current_streak === 7, badge: 'streak_7' },
      { condition: user?.current_streak === 30, badge: 'streak_30' },
      { condition: (user?.total_points || 0) >= 10000, badge: 'points_10k' },
      { condition: (user?.total_points || 0) >= 50000, badge: 'points_50k' },
    ];

    for (const check of achievementChecks) {
      if (check.condition) {
        await supabase
          .from('user_achievements')
          .upsert(
            { user_id: userId, badge_id: check.badge, earned_at: new Date().toISOString() },
            { onConflict: 'user_id,badge_id', ignoreDuplicates: true }
          );
      }
    }

    // ── 5. PUSH NOTIFICATION (best-effort) ──────────────────
    try {
      const pushToken = userStats?.push_token;
      if (pushToken) {
        const streakText = streakMultiplier > 1
          ? ` (${streakMultiplier.toFixed(1)}x streak!)`
          : '';
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: pushToken,
            title: 'Treino concluído! 💪',
            body: `+${finalPoints} pontos${streakText}`,
            data: { screen: 'workout-summary', workoutId: record.id },
          }),
        });
      }
    } catch {
      // Push failure should not block response
    }

    return ok({ points: finalPoints, streak: streakMultiplier });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return error(message, 500);
  }
});
