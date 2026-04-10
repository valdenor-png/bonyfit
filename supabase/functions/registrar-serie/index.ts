import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const MIN_SECONDS: Record<string, number> = { normal: 20, dropset: 8, tempo: 30, failure: 25 }
const MIN_BETWEEN_EXERCISES = 60 // 60s entre exercícios diferentes
const MAX_REPS = 50
const MAX_CARGA_MULT = 2
const DAILY_POINTS_CAP = 500

const bodySchema = z.object({
  workout_log_id: z.string().uuid(),
  exercise_name: z.string().min(1),
  exercise_db_id: z.string().uuid().optional(),
  set_index: z.number().int().min(1).max(50),
  kg_real: z.number().min(0).max(500),
  reps_real: z.number().int().min(1).max(100),
  set_type: z.enum(['normal', 'dropset', 'tempo', 'failure']).default('normal'),
  device_id: z.string().optional(),
  timestamp_sig: z.string().optional(),
})

async function logFraud(supabase: any, userId: string, tipo: string, detalhes: any) {
  await supabase.from('fraud_log').insert({ user_id: userId, tipo, detalhes }).catch(() => {})
}

const handler = createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)

  // Rate limit
  try { await checkRateLimit(supabase, user.id, { action: 'complete_set' }) }
  catch {
    await logFraud(supabase, user.id, 'rate_limit', { action: 'complete_set' })
    throw { status: 429, code: 'RATE_LIMITED', message: 'Muitas requisições' }
  }

  const body = await parseBody(req, bodySchema)

  // ── BLOQUEIO 0: Blacklist temporário ─────────────────────
  const { data: userData } = await supabase
    .from('users')
    .select('gamificacao_bloqueada_ate')
    .eq('id', user.id)
    .single()

  if (userData?.gamificacao_bloqueada_ate) {
    const bloqueadoAte = new Date(userData.gamificacao_bloqueada_ate)
    if (bloqueadoAte > new Date()) {
      const dias = Math.ceil((bloqueadoAte.getTime() - Date.now()) / 86400000)
      throw { status: 403, code: 'BLACKLISTED', message: `Gamificação suspensa por ${dias} dia(s). Procure a recepção.` }
    }
  }

  // ── BLOQUEIO 1: Verificar timestamp signature (anti-replay) ──
  const sigSecret = Deno.env.get('BONY_FIT_SIG_SECRET')
  if (sigSecret && body.timestamp_sig) {
    const [ts, sig] = body.timestamp_sig.split(':')
    if (ts && sig) {
      const expected = createHmac('sha256', sigSecret).update(ts).digest('hex')
      if (sig !== expected || Math.abs(Date.now() - parseInt(ts)) > 30000) {
        await logFraud(supabase, user.id, 'replay_attack', { timestamp_sig: body.timestamp_sig })
        throw { status: 400, code: 'INVALID_SIG', message: 'Requisição inválida' }
      }
    }
  }

  // ── BLOQUEIO 2: Device fingerprint (mesmo user, 2 devices simultâneos) ──
  if (body.device_id) {
    const { data: recentSet } = await supabase
      .from('workout_sets')
      .select('created_at')
      .eq('workout_log_id', body.workout_log_id)
      .eq('is_completed', true)
      .not('exercise_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Check device_id on workout_log
    const { data: logDevice } = await supabase
      .from('workout_logs_v2')
      .select('device_id')
      .eq('id', body.workout_log_id)
      .single()

    if (logDevice?.device_id && logDevice.device_id !== body.device_id) {
      await logFraud(supabase, user.id, 'device_diferente', {
        device_original: logDevice.device_id, device_atual: body.device_id,
      })
      throw { status: 403, code: 'DEVICE_MISMATCH', message: 'Treino iniciado em outro dispositivo' }
    }
  }

  // ── BLOQUEIO 3: Ownership ──────────────────────────────────
  const { data: log } = await supabase
    .from('workout_logs_v2').select('id, user_id, invalidado').eq('id', body.workout_log_id).single()

  if (!log) throw { status: 404, code: 'NOT_FOUND', message: 'Treino não encontrado' }
  if (log.user_id !== user.id) {
    await logFraud(supabase, user.id, 'serie_nao_pertence', { workout_log_id: body.workout_log_id })
    throw { status: 403, code: 'NOT_OWNER', message: 'Este treino não pertence a você' }
  }
  if (log.invalidado) throw { status: 400, code: 'INVALIDATED', message: 'Treino foi invalidado' }

  // ── BLOQUEIO 4: Catraca ────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]
  const { data: checkin } = await supabase
    .from('checkins').select('id').eq('user_id', user.id)
    .gte('created_at', today).lt('created_at', today + 'T23:59:59Z').maybeSingle()

  if (!checkin) {
    await logFraud(supabase, user.id, 'sem_catraca', { workout_log_id: body.workout_log_id })
    throw { status: 403, code: 'NO_CHECKIN', message: 'Sem registro de entrada na academia' }
  }

  // ── BLOQUEIO 5: Duplicata ──────────────────────────────────
  const { data: dup } = await supabase
    .from('workout_sets').select('id')
    .eq('workout_log_id', body.workout_log_id).eq('exercise_name', body.exercise_name)
    .eq('set_index', body.set_index).eq('is_completed', true).maybeSingle()

  if (dup) {
    await logFraud(supabase, user.id, 'serie_duplicada', { exercise: body.exercise_name, set_index: body.set_index })
    throw { status: 400, code: 'DUPLICATE', message: 'Série já registrada' }
  }

  // ── BLOQUEIO 6: Ordem ──────────────────────────────────────
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

  // ── BLOQUEIO 7: Tempo mínimo entre séries ──────────────────
  const { data: lastSet } = await supabase
    .from('workout_sets').select('created_at, exercise_name')
    .eq('workout_log_id', body.workout_log_id).eq('is_completed', true)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  let minSec = MIN_SECONDS[body.set_type] ?? 20

  // Cooldown entre exercícios diferentes (60s)
  if (lastSet && lastSet.exercise_name !== body.exercise_name) {
    minSec = Math.max(minSec, MIN_BETWEEN_EXERCISES)
  }

  if (lastSet) {
    const elapsed = (Date.now() - new Date(lastSet.created_at).getTime()) / 1000
    if (elapsed < minSec) {
      await logFraud(supabase, user.id, 'tempo_minimo_serie', { elapsed: Math.round(elapsed), minimo: minSec })
      throw { status: 400, code: 'TOO_FAST', message: `Aguarde ${Math.ceil(minSec - elapsed)}s entre séries` }
    }
  }

  // ── BLOQUEIO 8: Reps impossíveis ───────────────────────────
  if (body.reps_real > MAX_REPS) {
    await logFraud(supabase, user.id, 'reps_impossivel', { reps: body.reps_real })
    throw { status: 400, code: 'IMPOSSIBLE_REPS', message: 'Valor de repetições inválido' }
  }

  // ── BLOQUEIO 9: Carga impossível ───────────────────────────
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

  // ── BLOQUEIO 10: Cap diário de pontos ──────────────────────
  const { data: todayPoints } = await supabase
    .from('user_points')
    .select('pontos')
    .eq('user_id', user.id)
    .gte('created_at', today)
    .lt('created_at', today + 'T23:59:59Z')

  const pontosHoje = (todayPoints ?? []).reduce((sum: number, p: any) => sum + p.pontos, 0)
  if (pontosHoje >= DAILY_POINTS_CAP) {
    await logFraud(supabase, user.id, 'cap_diario', { pontos_hoje: pontosHoje, cap: DAILY_POINTS_CAP })
    // Não bloqueia a série — só não dá pontos
  }

  // ── BLOQUEIO 11: Volume impossível ─────────────────────────
  // Verificar se volume acumulado do treino é absurdo
  const { data: allSets } = await supabase
    .from('workout_sets').select('weight_kg, reps')
    .eq('workout_log_id', body.workout_log_id).eq('is_completed', true)

  const volumeAtual = (allSets ?? []).reduce((sum: number, s: any) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
  const volumeNovo = volumeAtual + body.kg_real * body.reps_real
  const { data: logInfo } = await supabase
    .from('workout_logs_v2').select('started_at').eq('id', body.workout_log_id).single()

  if (logInfo?.started_at) {
    const duracaoMin = (Date.now() - new Date(logInfo.started_at).getTime()) / 60000
    if (duracaoMin > 0 && volumeNovo / duracaoMin > 2000) {
      await logFraud(supabase, user.id, 'volume_impossivel', { volume: volumeNovo, minutos: Math.round(duracaoMin) })
      throw { status: 400, code: 'IMPOSSIBLE_VOLUME', message: 'Volume de treino impossível para o tempo decorrido' }
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

  // Award points (only if under daily cap)
  let pontosGanhos = 0
  if (pontosHoje < DAILY_POINTS_CAP) {
    await supabase.from('user_points').insert({ user_id: user.id, pontos: 15, tipo: 'serie', referencia_id: setData.id })
    pontosGanhos = 15
  }

  // Exercise bonus (3+ sets completed for same exercise)
  let exerciseBonus = false
  const { count: exSets } = await supabase.from('workout_sets').select('id', { count: 'exact', head: true })
    .eq('workout_log_id', body.workout_log_id).eq('exercise_name', body.exercise_name).eq('is_completed', true)

  if ((exSets ?? 0) >= 3 && pontosHoje + pontosGanhos < DAILY_POINTS_CAP) {
    const { count: bonusCount } = await supabase.from('user_points').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('tipo', 'exercicio').eq('referencia_id', body.workout_log_id)

    const { data: allEx } = await supabase.from('workout_sets').select('exercise_name')
      .eq('workout_log_id', body.workout_log_id).eq('is_completed', true)
    const uniqueEx = new Set((allEx ?? []).map((s: any) => s.exercise_name)).size

    if ((bonusCount ?? 0) < uniqueEx) {
      await supabase.from('user_points').insert({ user_id: user.id, pontos: 50, tipo: 'exercicio', referencia_id: body.workout_log_id })
      exerciseBonus = true
      pontosGanhos += 50
    }
  }

  await logAudit(supabase, {
    userId: user.id, action: 'serie_concluida', entityType: 'workout_set', entityId: setData.id,
    metadata: { exercise: body.exercise_name, kg: body.kg_real, reps: body.reps_real, pontos: pontosGanhos },
  })

  return success({ pontos_ganhos: pontosGanhos, exercicio_completo: exerciseBonus })
}, { functionName: 'registrar-serie', allowedMethods: ['POST'] })

Deno.serve(handler)
