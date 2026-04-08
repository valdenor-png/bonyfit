import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const bodySchema = z.object({
  qr_token: z.string(),
})

serve(createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)
  await checkRateLimit(supabase, user.id, { action: 'qr_scan' })

  const { qr_token } = await parseBody(req, bodySchema)

  // Query session by qr_token
  const { data: sessao, error: sessaoError } = await supabase
    .from('aula_sessoes')
    .select('*, modalidades(nome)')
    .eq('qr_token', qr_token)
    .single()

  if (sessaoError || !sessao) {
    throw { status: 404, code: 'SESSION_NOT_FOUND', message: 'Sessao nao encontrada para este QR code' }
  }

  // Validate session status
  if (!['aberta', 'em_andamento'].includes(sessao.status)) {
    throw { status: 400, code: 'SESSION_CLOSED', message: 'Esta sessao nao esta aberta para presenca' }
  }

  // Validate time window
  const agora = new Date()
  const inicio = new Date(sessao.horario_inicio)
  const fim = new Date(sessao.horario_fim)
  if (agora < inicio || agora > fim) {
    throw { status: 400, code: 'OUT_OF_TIME', message: 'Fora do horario permitido para registro de presenca' }
  }

  // Check duplicate attendance
  const { data: existente } = await supabase
    .from('aula_presencas')
    .select('id')
    .eq('sessao_id', sessao.id)
    .eq('aluno_id', user.id)
    .maybeSingle()

  if (existente) {
    throw { status: 409, code: 'ALREADY_REGISTERED', message: 'Presenca ja registrada para esta aula' }
  }

  // Insert attendance
  const { error: insertError } = await supabase
    .from('aula_presencas')
    .insert({
      sessao_id: sessao.id,
      aluno_id: user.id,
      horario_entrada: agora.toISOString(),
    })

  if (insertError) {
    throw insertError
  }

  const modalidadeNome = sessao.modalidades?.nome ?? 'Aula'

  await logAudit(supabase, {
    userId: user.id,
    action: 'qr_scan',
    entityType: 'aula_sessao',
    entityId: sessao.id,
    metadata: { modalidade: modalidadeNome },
  })

  return success({
    message: `Presenca registrada com sucesso em ${modalidadeNome}`,
    modalidade: modalidadeNome,
    sessao_id: sessao.id,
  })
}, { functionName: 'escanear-qr-aula', allowedMethods: ['POST'] }))
