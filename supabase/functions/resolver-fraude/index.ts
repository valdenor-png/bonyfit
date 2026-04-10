import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireRole } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const SCORE_RESTORE: Record<string, number> = { alta: 15, media: 8, baixa: 3 }

const bodySchema = z.object({
  flag_id: z.string().uuid(),
  resolucao: z.enum(['absolvido', 'confirmado']),
})

const handler = createHandler(async (req, supabase) => {
  const admin = await requireRole(req, supabase, ['dono'])

  const body = await parseBody(req, bodySchema)

  // Fetch flag
  const { data: flag, error: flagError } = await supabase
    .from('fraud_flags')
    .select('*')
    .eq('id', body.flag_id)
    .eq('resolvido', false)
    .single()

  if (flagError || !flag) {
    throw { status: 404, code: 'FLAG_NOT_FOUND', message: 'Flag não encontrada ou já resolvida' }
  }

  // Resolve
  await supabase
    .from('fraud_flags')
    .update({
      resolvido: true,
      resolvido_por: admin.id,
      resolvido_at: new Date().toISOString(),
      resolucao: body.resolucao,
    })
    .eq('id', body.flag_id)

  if (body.resolucao === 'absolvido') {
    // Restore trust score
    const restore = SCORE_RESTORE[flag.severidade] ?? 5
    await supabase.rpc('increment_trust_score', { p_user_id: flag.user_id, p_delta: restore })
      .then(null, async () => {
        // Fallback if RPC doesn't exist
        const { data: u } = await supabase.from('users').select('trust_score').eq('id', flag.user_id).single()
        if (u) {
          await supabase.from('users').update({ trust_score: Math.min(100, (u.trust_score ?? 0) + restore) }).eq('id', flag.user_id)
        }
      })
  } else {
    // Confirmed fraud — cancel related points
    const workoutId = flag.detalhes?.workout_id ?? flag.detalhes?.log_id
    if (workoutId) {
      await supabase
        .from('user_points')
        .update({ status: 'cancelado' })
        .eq('user_id', flag.user_id)
        .eq('referencia_id', workoutId)
    }
  }

  await logAudit(supabase, {
    userId: admin.id,
    action: 'fraude_resolvida',
    entityType: 'fraud_flag',
    entityId: body.flag_id,
    metadata: { resolucao: body.resolucao, user_id: flag.user_id, severidade: flag.severidade },
  })

  return success({ resolved: true, resolucao: body.resolucao })
}, { functionName: 'resolver-fraude', allowedMethods: ['POST'] })

Deno.serve(handler)
