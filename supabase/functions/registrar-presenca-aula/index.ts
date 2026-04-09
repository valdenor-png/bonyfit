import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const PONTOS_PRESENCA = 100

const bodySchema = z.object({
  sessao_id: z.string().uuid(),
})

const handler = createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)
  await checkRateLimit(supabase, user.id, { action: 'registrar_presenca' })

  const { sessao_id } = await parseBody(req, bodySchema)

  // 1. VERIFY session exists and is active
  const { data: sessao, error: sessaoError } = await supabase
    .from('aula_sessoes')
    .select('id, status, modalidade_id, modalidades(nome, pontos_por_aula)')
    .eq('id', sessao_id)
    .single()

  if (sessaoError || !sessao) {
    throw { status: 404, code: 'SESSION_NOT_FOUND', message: 'Sessão de aula não encontrada' }
  }

  if (sessao.status === 'finalizada') {
    throw { status: 400, code: 'SESSION_FINISHED', message: 'Esta aula já foi finalizada' }
  }

  // 2. CHECK if user is already registered
  const { data: existingPresenca } = await supabase
    .from('aula_presencas')
    .select('id, pontos_concedidos')
    .eq('sessao_id', sessao_id)
    .eq('aluno_id', user.id)
    .maybeSingle()

  if (existingPresenca?.pontos_concedidos && existingPresenca.pontos_concedidos > 0) {
    return success({
      pontos_ganhos: existingPresenca.pontos_concedidos,
      ja_registrado: true,
    })
  }

  const pontos = (sessao as any).modalidades?.pontos_por_aula ?? PONTOS_PRESENCA

  // 3. UPSERT presence record
  if (existingPresenca) {
    await supabase
      .from('aula_presencas')
      .update({ presente_no_fim: true, pontos_concedidos: pontos })
      .eq('id', existingPresenca.id)
  } else {
    await supabase
      .from('aula_presencas')
      .insert({
        sessao_id,
        aluno_id: user.id,
        presente_no_fim: true,
        pontos_concedidos: pontos,
        removido: false,
      })
  }

  // 4. AWARD points via RPC (atomic)
  const { error: rpcError } = await supabase.rpc('update_user_gamification', {
    p_user_id: user.id,
    p_points_to_add: pontos,
    p_increment_streak: false,
    p_increment_workouts: false,
  })

  // Fallback if RPC not available
  if (rpcError) {
    console.warn('RPC update_user_gamification failed, using fallback:', rpcError)
    const { data: userData } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', user.id)
      .single()

    await supabase
      .from('users')
      .update({ total_points: (userData?.total_points ?? 0) + pontos })
      .eq('id', user.id)
  }

  // 5. AUDIT LOG
  await logAudit(supabase, {
    userId: user.id,
    action: 'presenca_registrada',
    entityType: 'aula_presenca',
    entityId: sessao_id,
    metadata: {
      pontos,
      modalidade: (sessao as any).modalidades?.nome ?? '',
    },
  })

  return success({
    pontos_ganhos: pontos,
    ja_registrado: false,
  })
}, { functionName: 'registrar-presenca-aula', allowedMethods: ['POST'] })

Deno.serve(handler)
