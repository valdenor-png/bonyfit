import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const MIN_SECONDS: Record<string, number> = { normal: 20, dropset: 8, tempo: 30, failure: 25 }
const MAX_REPS = 50
const MAX_CARGA_MULT = 2

const bodySchema = z.object({
  workout_log_id: z.string().uuid(),
  exercise_name: z.string().min(1),
  exercise_db_id: z.string().uuid().optional(),
  set_index: z.number().int().min(1).max(50),
  kg_real: z.number().min(0).max(500),
  reps_real: z.number().int().min(1).max(100),
  set_type: z.enum(['normal', 'dropset', 'tempo', 'failure']).default('normal'),
})

async function logFraud(supabase: any, userId: string, tipo: string, detalhes: any) {
  await supabase.from('fraud_log').insert({ user_id: userId, tipo, detalhes }).catch(() => {})
}

const handler = createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)

  try { await checkRateLimit(supabase, user.id, { action: 'complete_set' }) }
  catch {
    await logFraud(supabase, user.id, 'rate_limit', { action: 'complete_set' })
    throw { status: 429, code: 'RATE_LIMITED', message: 'Muitas requisições' }
  }

  const body = await parseBody(req, bodySchema)

  // 1. Verify ownership
  const { data: log } = await supabase
    .from('workout_logs_v2').select('id, user_id, invalidado').eq('id', body.workout_log_id).single()

  if (!log) throw { status: 404, code: 'NOT_FOUND', message: 'Treino não encontrado' }
  if (log.user_id !== user.id) {
    await logFraud(supabase, user.id, 'serie_nao_pertence', { workout_log_id: body.workout_log_id })
    throw { status: 403, code: 'NOT_OWNER', message: 'Este treino não pertence a você' }
  }
  if (log.invalidado) throw { status: 400, code: 'INVALIDATED', message: 'Treino foi invalidado' }

  // 2. Check catraca
  const today = new Date().toISOString().split('T')[0]
  const { data: checkin } = await supabase
    .from('checkins').select('id').eq('user_id', user.id)
    .gte('created_at', today).lt('created_at', today + 'T23:59:59Z').maybeSingle()

  if (!checkin) {
    await logFraud(supabase, user.id, 'sem_catraca', { workout_log_id: body.workout_log_id })
    throw { status: 403, code: 'NO_CHECKIN', message: 'Sem registro de entrada na academia' }
  }

  // 3. Duplicate check
  const { data: dup } = await supabase
    .from('workout_sets').select('id')
    .eq('workout_log_id', body.workout_log_id).eq('exercise_name', body.exercise_name)
    .eq('set_index', body.set_index).eq('is_completed', true).maybeSingle()

  if (dup) {
    await logFraud(supabase, user.id, 'serie_duplicada', { exercise: body.exercise_name, set_index: body.set_index })
    throw { status: 400, code: 'DUPLICATE', message: 'Série já registrada' }
  }

  // 4. Order check
  if (body.set_index > 1) {
    const { data: prev } = await supabase
      .from('workout_sets').select('id')
      .eq('workout_log_id', body.workout_log_id).eq('exercise_name', body.exercise_name)
      .eq('set_index', body.set_index - 1).eq('is_completed', true).maybeSingle()

    if (!prev) {
      await logFraud(supabase, user.id, 'serie_fora_ordem', { exercise: body.exercise_name, set_index: body.set_index })
      throw { status: 400, code: 'ORDER', message: 'Conclua a série anterior primeiro' }
    }
  }

  // 5. Minimum time
  const { data: lastSet } = await supabase
    .from('workout_sets').select('created_at')
    .eq('workout_log_id', body.workout_log_id).eq('is_completed', true)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  const minSec = MIN_SECONDS[body.set_type] ?? 20
  if (lastSet) {
    const elapsed = (Date.now() - new Date(lastSet.created_at).getTime()) / 1000
    if (elapsed < minSec) {
      await logFraud(supabase, user.id, 'tempo_minimo_serie', { elapsed: Math.round(elapsed), minimo: minSec })
      throw { status: 400, code: 'TOO_FAST', message: `Aguarde ${Math.ceil(minSec - elapsed)}s entre séries` }
    }
  }

  // 6. Impossible reps
  if (body.reps_real > MAX_REPS) {
    await logFraud(supabase, user.id, 'reps_impossivel', { reps: body.reps_real })
    throw { status: 400, code: 'IMPOSSIBLE_REPS', message: 'Valor de repetições inválido' }
  }

  // 7. Impossible load
  if (body.exercise_db_id && body.kg_real > 0) {
    const { data: hist } = await supabase
      .from('workout_sets').select('weight_kg')
      .eq('exercise_id', body.exercise_db_id).eq('is_completed', true)
      .order('weight_kg', { ascending: false }).limit(1).maybeSingle()

    if (hist?.weight_kg > 0 && body.kg_real > hist.weight_kg * MAX_CARGA_MULT) {
      await logFraud(supabase, user.id, 'carga_impossivel', { kg: body.kg_real, max: hist.weight_kg })
      throw { status: 400, code: 'IMPOSSIBLE_LOAD', message: 'Carga muito acima do seu histórico' }
    }
  }

  // ═══ ALL PASSED — Insert set + award points ═══
  const { data: setData, error: setErr } = await supabase.from('workout_sets').insert({
    workout_log_id: body.workout_log_id,
    ...(body.exercise_db_id ? { exercise_id: body.exercise_db_id } : {}),
    exercise_name: body.exercise_name,
    set_index: body.set_index,
    weight_kg: body.kg_real,
    reps: body.reps_real,
    is_completed: true,
  }).select('id').single()

  if (setErr) throw setErr

  await supabase.from('user_points').insert({ user_id: user.id, pontos: 15, tipo: 'serie', referencia_id: setData.id })

  // Exercise bonus (3+ sets completed)
  const { count: exSets } = await supabase.from('workout_sets').select('id', { count: 'exact', head: true })
    .eq('workout_log_id', body.workout_log_id).eq('exercise_name', body.exercise_name).eq('is_completed', true)

  let exerciseBonus = false
  if ((exSets ?? 0) >= 3) {
    const { count: bonusCount } = await supabase.from('user_points').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('tipo', 'exercicio').eq('referencia_id', body.workout_log_id)

    const { data: allEx } = await supabase.from('workout_sets').select('exercise_name')
      .eq('workout_log_id', body.workout_log_id).eq('is_completed', true)
    const uniqueEx = new Set((allEx ?? []).map((s: any) => s.exercise_name)).size

    if ((bonusCount ?? 0) < uniqueEx) {
      await supabase.from('user_points').insert({ user_id: user.id, pontos: 50, tipo: 'exercicio', referencia_id: body.workout_log_id })
      exerciseBonus = true
    }
  }

  await logAudit(supabase, {
    userId: user.id, action: 'serie_concluida', entityType: 'workout_set', entityId: setData.id,
    metadata: { exercise: body.exercise_name, kg: body.kg_real, reps: body.reps_real },
  })

  return success({ pontos_ganhos: 15 + (exerciseBonus ? 50 : 0), exercicio_completo: exerciseBonus })
}, { functionName: 'registrar-serie', allowedMethods: ['POST'] })

Deno.serve(handler)
