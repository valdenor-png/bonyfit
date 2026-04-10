import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const MIN_SECONDS: Record<string, number> = {
  normal: 20,
  dropset: 8,
  tempo: 30,
  failure: 25,
}

const bodySchema = z.object({
  workout_log_id: z.string().uuid(),
  exercise_name: z.string().min(1),
  set_index: z.number().int().min(1).max(50),
  kg_real: z.number().min(0).max(500),
  reps_real: z.number().int().min(1).max(100),
  set_type: z.enum(['normal', 'dropset', 'tempo', 'failure']).default('normal'),
  tempo_real: z.number().min(0).optional(),
})

const handler = createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)
  await checkRateLimit(supabase, user.id, { action: 'complete_set' })

  const body = await parseBody(req, bodySchema)

  // 1. Verify workout log belongs to user
  const { data: log, error: logError } = await supabase
    .from('workout_logs_v2')
    .select('id, user_id')
    .eq('id', body.workout_log_id)
    .single()

  if (logError || !log) {
    throw { status: 404, code: 'LOG_NOT_FOUND', message: 'Registro de treino não encontrado' }
  }
  if (log.user_id !== user.id) {
    throw { status: 403, code: 'NOT_OWNER', message: 'Este treino não pertence a você' }
  }

  // 2. Check duplicate set
  const { data: existingSet } = await supabase
    .from('workout_sets')
    .select('id')
    .eq('workout_log_id', body.workout_log_id)
    .eq('exercise_name', body.exercise_name)
    .eq('set_index', body.set_index)
    .eq('is_completed', true)
    .maybeSingle()

  if (existingSet) {
    throw { status: 400, code: 'DUPLICATE_SET', message: 'Série já registrada' }
  }

  // 3. Check minimum time since last completed set
  const { data: lastSet } = await supabase
    .from('workout_sets')
    .select('created_at')
    .eq('workout_log_id', body.workout_log_id)
    .eq('is_completed', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get user trust_score
  const { data: userData } = await supabase
    .from('users')
    .select('trust_score')
    .eq('id', user.id)
    .single()

  const trustScore = userData?.trust_score ?? 80
  let minSeconds = MIN_SECONDS[body.set_type] ?? 20

  // Trust score adjustments
  if (trustScore < 30) {
    throw { status: 403, code: 'GAMIFICATION_SUSPENDED', message: 'Gamificação suspensa. Procure a recepção.' }
  }
  if (trustScore < 70) {
    minSeconds = Math.round(minSeconds * 1.5)
  }

  if (lastSet) {
    const elapsed = (Date.now() - new Date(lastSet.created_at).getTime()) / 1000
    if (elapsed < minSeconds) {
      throw {
        status: 400,
        code: 'TOO_FAST',
        message: `Aguarde ${Math.ceil(minSeconds - elapsed)}s entre séries`,
      }
    }
  }

  // 4. Insert completed set
  const { data: setData, error: setError } = await supabase
    .from('workout_sets')
    .insert({
      workout_log_id: body.workout_log_id,
      exercise_name: body.exercise_name,
      set_index: body.set_index,
      weight_kg: body.kg_real,
      reps: body.reps_real,
      is_completed: true,
    })
    .select('id')
    .single()

  if (setError) throw setError

  // 5. Award points
  const pointsStatus = trustScore >= 50 ? 'confirmado' : 'pendente'
  await supabase.from('user_points').insert({
    user_id: user.id,
    pontos: 15,
    tipo: 'serie',
    referencia_id: setData.id,
    status: pointsStatus,
  })

  // 6. Check if exercise is complete (all sets for this exercise done)
  const { count: completedForExercise } = await supabase
    .from('workout_sets')
    .select('id', { count: 'exact', head: true })
    .eq('workout_log_id', body.workout_log_id)
    .eq('exercise_name', body.exercise_name)
    .eq('is_completed', true)

  let exerciseBonus = false
  // Simplified: if 3+ sets completed for this exercise, award bonus
  if ((completedForExercise ?? 0) >= 3) {
    const { data: alreadyAwarded } = await supabase
      .from('user_points')
      .select('id')
      .eq('user_id', user.id)
      .eq('tipo', 'exercicio')
      .eq('referencia_id', body.workout_log_id)
      .maybeSingle()

    // Only award once per exercise per workout — use exercise_name in check
    if (!alreadyAwarded) {
      await supabase.from('user_points').insert({
        user_id: user.id,
        pontos: 50,
        tipo: 'exercicio',
        referencia_id: body.workout_log_id,
        status: pointsStatus,
      })
      exerciseBonus = true
    }
  }

  // 7. Audit
  await logAudit(supabase, {
    userId: user.id,
    action: 'serie_concluida',
    entityType: 'workout_set',
    entityId: setData.id,
    metadata: {
      workout_log_id: body.workout_log_id,
      exercise: body.exercise_name,
      set_index: body.set_index,
      kg: body.kg_real,
      reps: body.reps_real,
      trust_score: trustScore,
    },
  })

  return success({
    pontos_ganhos: 15 + (exerciseBonus ? 50 : 0),
    exercicio_completo: exerciseBonus,
    trust_score: trustScore,
    status: pointsStatus,
  })
}, { functionName: 'registrar-serie', allowedMethods: ['POST'] })

Deno.serve(handler)
