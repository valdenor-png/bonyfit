import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const TOLERANCIA_MIN = 5

const bodySchema = z.object({
  workout_log_id: z.string().uuid(),
})

async function logFraud(supabase: any, userId: string, tipo: string, detalhes: any) {
  await supabase.from('fraud_log').insert({ user_id: userId, tipo, detalhes }).catch(() => {})
}

const handler = createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)
  await checkRateLimit(supabase, user.id, { action: 'finalizar_treino', maxPerMinute: 5 })

  const body = await parseBody(req, bodySchema)

  // 1. Fetch workout log
  const { data: log } = await supabase
    .from('workout_logs_v2')
    .select('id, user_id, started_at, finished_at, invalidado, duration_seconds')
    .eq('id', body.workout_log_id)
    .single()

  if (!log) throw { status: 404, code: 'NOT_FOUND', message: 'Treino não encontrado' }
  if (log.user_id !== user.id) throw { status: 403, code: 'NOT_OWNER', message: 'Treino não pertence a você' }
  if (log.invalidado) throw { status: 400, code: 'INVALIDATED', message: 'Treino já foi invalidado' }
  if (log.finished_at) throw { status: 400, code: 'ALREADY_FINISHED', message: 'Treino já foi finalizado' }

  // 2. Check cooldown: no other workout finished in last 2h
  const { data: recent } = await supabase
    .from('workout_logs_v2')
    .select('id')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .eq('invalidado', false)
    .neq('id', body.workout_log_id)
    .gte('finished_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle()

  if (recent) {
    await logFraud(supabase, user.id, 'treino_recente', { last_id: recent.id })
    throw { status: 400, code: 'COOLDOWN', message: 'Aguarde 2h entre treinos' }
  }

  // 3. Count sets and exercises
  const { data: sets } = await supabase
    .from('workout_sets')
    .select('id, exercise_name, created_at')
    .eq('workout_log_id', body.workout_log_id)
    .eq('is_completed', true)
    .order('created_at', { ascending: true })

  const completedSets = sets ?? []
  const uniqueExercises = new Set(completedSets.map((s: any) => s.exercise_name)).size
  const duracao = log.started_at
    ? (Date.now() - new Date(log.started_at).getTime()) / 60000
    : 0

  // 4. Minimum time check
  let tempoMinimo = 10
  if (uniqueExercises >= 11) tempoMinimo = 40
  else if (uniqueExercises >= 7) tempoMinimo = 30
  else if (uniqueExercises >= 4) tempoMinimo = 20

  const tempoComTolerancia = tempoMinimo - TOLERANCIA_MIN

  // 5. POST-WORKOUT FRAUD DETECTION: average time between sets
  let invalidado = false
  let motivoInvalidacao = ''

  if (completedSets.length > 2) {
    const timestamps = completedSets.map((s: any) => new Date(s.created_at).getTime())
    const intervals: number[] = []
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push((timestamps[i] - timestamps[i - 1]) / 1000)
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

    // Velocity check: avg < 15s per set
    if (avgInterval < 15) {
      invalidado = true
      motivoInvalidacao = 'velocidade_impossivel'
      await logFraud(supabase, user.id, 'velocidade_impossivel', {
        media_segundos: Math.round(avgInterval * 10) / 10,
        total_series: completedSets.length,
      })
    }

    // Robotic pattern: stddev < 2s with 5+ sets
    if (!invalidado && completedSets.length >= 5) {
      const mean = avgInterval
      const variance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length
      const stddev = Math.sqrt(variance)

      if (stddev < 2) {
        invalidado = true
        motivoInvalidacao = 'padrao_robotico'
        await logFraud(supabase, user.id, 'padrao_robotico', {
          desvio_padrao: Math.round(stddev * 100) / 100,
          total_series: completedSets.length,
        })
      }
    }
  }

  // 6. If invalidated: remove all points and mark workout
  if (invalidado) {
    // Delete all points for this workout's sets
    const setIds = completedSets.map((s: any) => s.id)
    if (setIds.length > 0) {
      await supabase.from('user_points').delete().eq('user_id', user.id).in('referencia_id', setIds)
    }
    // Delete exercise bonuses and workout bonus
    await supabase.from('user_points').delete()
      .eq('user_id', user.id).eq('referencia_id', body.workout_log_id)

    await supabase.from('workout_logs_v2').update({
      invalidado: true,
      finished_at: new Date().toISOString(),
      duration_seconds: Math.round(duracao * 60),
    }).eq('id', body.workout_log_id)

    // Check auto-blacklist (3 invalidações em 30 dias = ban 7 dias)
    await supabase.rpc('check_auto_blacklist', { p_user_id: user.id }).catch(() => {})

    await logAudit(supabase, {
      userId: user.id, action: 'treino_invalidado', entityType: 'workout_log',
      entityId: body.workout_log_id, metadata: { motivo: motivoInvalidacao },
    })

    return success({
      status: 'invalidado',
      motivo: 'Treino invalidado por padrão suspeito',
      pontos_removidos: true,
    })
  }

  // 7. Determine if complete or partial
  const isComplete = completedSets.length > 0 && duracao >= tempoComTolerancia
  let pontosBonus = 0

  await supabase.from('workout_logs_v2').update({
    finished_at: new Date().toISOString(),
    duration_seconds: Math.round(duracao * 60),
  }).eq('id', body.workout_log_id)

  if (isComplete) {
    // Workout bonus
    await supabase.from('user_points').insert({
      user_id: user.id, pontos: 200, tipo: 'treino_bonus', referencia_id: body.workout_log_id,
    })
    pontosBonus = 200

    // Streak check (consecutive days with checkin)
    const { data: checkins } = await supabase
      .from('checkins')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(31)

    if (checkins && checkins.length > 0) {
      let streak = 1
      for (let i = 1; i < checkins.length; i++) {
        const d1 = new Date(checkins[i - 1].created_at).toISOString().split('T')[0]
        const d2 = new Date(checkins[i].created_at).toISOString().split('T')[0]
        const diff = (new Date(d1).getTime() - new Date(d2).getTime()) / 86400000
        if (diff <= 1) streak++; else break
      }

      if (streak === 7) {
        await supabase.from('user_points').insert({ user_id: user.id, pontos: 150, tipo: 'streak_7', referencia_id: body.workout_log_id })
        pontosBonus += 150
      }
      if (streak === 30) {
        await supabase.from('user_points').insert({ user_id: user.id, pontos: 500, tipo: 'streak_30', referencia_id: body.workout_log_id })
        pontosBonus += 500
      }
    }
  }

  // Update user total_points from ledger
  const { data: pointsTotal } = await supabase
    .from('user_points_total')
    .select('pontos_total, total_treinos')
    .eq('user_id', user.id)
    .single()

  if (pointsTotal) {
    await supabase.from('users').update({
      total_points: pointsTotal.pontos_total,
      total_workouts: pointsTotal.total_treinos,
    }).eq('id', user.id)
  }

  await logAudit(supabase, {
    userId: user.id, action: 'treino_finalizado', entityType: 'workout_log',
    entityId: body.workout_log_id,
    metadata: { status: isComplete ? 'completo' : 'parcial', duracao: Math.round(duracao), series: completedSets.length, exercicios: uniqueExercises, bonus: pontosBonus },
  })

  return success({
    status: isComplete ? 'completo' : 'parcial',
    duracao_minutos: Math.round(duracao),
    series_concluidas: completedSets.length,
    exercicios: uniqueExercises,
    pontos_bonus: pontosBonus,
  })
}, { functionName: 'finalizar-treino', allowedMethods: ['POST'] })

Deno.serve(handler)
