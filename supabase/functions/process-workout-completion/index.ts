import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const payload = await req.json();
  const record = payload.record;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const userId = record.user_id;

  // 1. CALCULATE POINTS
  const basePoints = 100;
  const setPoints = (record.total_sets || 0) * 15;
  const exercisePoints = (record.total_exercises || 0) * 50;
  const fullBonus = record.completed_all ? 200 : 0;
  const totalPoints = basePoints + setPoints + exercisePoints + fullBonus;

  // 2. CHECK STREAK
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
    .select('current_streak')
    .eq('id', userId)
    .single();

  if (lastWorkout) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastWorkout.created_at).getTime()) / 86400000
    );
    if (daysSince <= 2) {
      const streak = (userStats?.current_streak || 0) + 1;
      streakMultiplier = Math.min(1 + streak * 0.1, 2.0);

      await supabase
        .from('users')
        .update({ current_streak: streak })
        .eq('id', userId);
    } else {
      await supabase
        .from('users')
        .update({ current_streak: 1 })
        .eq('id', userId);
    }
  }

  const finalPoints = Math.round(totalPoints * streakMultiplier);

  // 3. UPDATE POINTS VIA RPC
  await supabase.rpc('add_user_points', {
    p_user_id: userId,
    p_points: finalPoints,
  });

  // 4. CHECK ACHIEVEMENTS
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

  return new Response(
    JSON.stringify({ points: finalPoints, streak: streakMultiplier }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
