import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

// ─── Safety caps ────────────────────────────────────────────
const MAX_SETS = 200
const MAX_EXERCISES = 30
const MAX_POINTS_PER_WORKOUT = 2000

// ─── Streak multipliers ─────────────────────────────────────
function getStreakMultiplier(streak: number): number {
  if (streak >= 14) return 2.0
  if (streak >= 7) return 1.5
  if (streak >= 3) return 1.2
  return 1.0
}

const bodySchema = z.object({
  workout_log_id: z.string().uuid(),
})

const handler = createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)
  await checkRateLimit(supabase, user.id, { action: 'completar_treino' })

  const { workout_log_id } = await parseBody(req, bodySchema)

  // 1. FETCH workout log and verify ownership
  const { data: log, error: logError } = await supabase
    .from('workout_logs_v2')
    .select('id, user_id, points_earned, duration_seconds, volume_total, name, workout_date')
    .eq('id', workout_log_id)
    .single()

  if (logError || !log) {
    throw { status: 404, code: 'LOG_NOT_FOUND', message: 'Registro de treino não encontrado' }
  }

  if (log.user_id !== user.id) {
    throw { status: 403, code: 'NOT_OWNER', message: 'Este treino não pertence a você' }
  }

  // 2. IDEMPOTENCY: check if points were already awarded
  if (log.points_earned && log.points_earned > 0) {
    return success({
      pontos_ganhos: log.points_earned,
      multiplicador: 1.0,
      streak: 0,
      ja_processado: true,
    })
  }

  // 3. COUNT exercises and sets from workout_sets
  const { count: setsCount } = await supabase
    .from('workout_sets')
    .select('id', { count: 'exact', head: true })
    .eq('workout_log_id', workout_log_id)
    .eq('is_completed', true)

  const { data: exerciseRows } = await supabase
    .from('workout_sets')
    .select('exercise_id')
    .eq('workout_log_id', workout_log_id)
    .eq('is_completed', true)

  const uniqueExercises = new Set((exerciseRows ?? []).map(r => r.exercise_id)).size

  const safeSets = Math.min(setsCount ?? 0, MAX_SETS)
  const safeExercises = Math.min(uniqueExercises, MAX_EXERCISES)

  // 4. CALCULATE points server-side
  const basePoints = safeExercises * 50 + safeSets * 15 + 200
  const cappedBase = Math.min(basePoints, MAX_POINTS_PER_WORKOUT)

  // 5. FETCH current streak
  const { data: userData } = await supabase
    .from('users')
    .select('current_streak, last_workout_date, total_points, total_workouts')
    .eq('id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let streak = 1
  if (userData) {
    if (userData.last_workout_date === today) {
      streak = userData.current_streak || 1
    } else if (userData.last_workout_date === yesterday) {
      streak = (userData.current_streak || 0) + 1
    }
  }

  const multiplier = getStreakMultiplier(streak)
  const finalPoints = Math.round(cappedBase * multiplier)

  // 6. UPDATE user gamification via RPC (atomic)
  const { error: rpcError } = await supabase.rpc('update_user_gamification', {
    p_user_id: user.id,
    p_points_to_add: finalPoints,
    p_increment_streak: true,
    p_increment_workouts: true,
  })

  // Fallback if RPC not available
  if (rpcError) {
    console.warn('RPC update_user_gamification failed, using fallback:', rpcError)
    await supabase.from('users').update({
      total_points: (userData?.total_points ?? 0) + finalPoints,
      current_streak: streak,
      last_workout_date: today,
      total_workouts: (userData?.total_workouts ?? 0) + 1,
    }).eq('id', user.id)
  }

  // 7. MARK log as processed (store points earned)
  await supabase
    .from('workout_logs_v2')
    .update({ points_earned: finalPoints })
    .eq('id', workout_log_id)

  // 8. AUDIT LOG
  await logAudit(supabase, {
    userId: user.id,
    action: 'treino_completado',
    entityType: 'workout_log',
    entityId: workout_log_id,
    metadata: {
      pontos_base: cappedBase,
      multiplicador: multiplier,
      pontos_final: finalPoints,
      streak,
      series: safeSets,
      exercicios: safeExercises,
    },
  })

  return success({
    pontos_ganhos: finalPoints,
    multiplicador: multiplier,
    streak,
    ja_processado: false,
  })
}, { functionName: 'completar-treino', allowedMethods: ['POST'] })

Deno.serve(handler)
