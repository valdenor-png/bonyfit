import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const bodySchema = z.object({
  sessao_id: z.string().uuid(),
})

serve(createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)
  await checkRateLimit(supabase, user.id, { action: 'finalizar_aula' })

  const { sessao_id } = await parseBody(req, bodySchema)

  // Validate professor owns the session
  const { data: sessao, error: sessaoError } = await supabase
    .from('aula_sessoes')
    .select('*, modalidades(nome, pontos_por_aula)')
    .eq('id', sessao_id)
    .eq('professor_id', user.id)
    .single()

  if (sessaoError || !sessao) {
    throw { status: 403, code: 'NOT_PROFESSOR', message: 'Sessao nao encontrada ou voce nao e o professor desta aula' }
  }

  if (sessao.status === 'finalizada') {
    throw { status: 400, code: 'ALREADY_FINISHED', message: 'Sessao ja foi finalizada' }
  }

  // Update session status to finalizada
  const { error: updateSessaoError } = await supabase
    .from('aula_sessoes')
    .update({ status: 'finalizada', horario_fim_real: new Date().toISOString() })
    .eq('id', sessao_id)

  if (updateSessaoError) {
    throw updateSessaoError
  }

  // Get present attendees (not removed)
  const { data: presencas, error: presencasError } = await supabase
    .from('aula_presencas')
    .select('id, aluno_id')
    .eq('sessao_id', sessao_id)
    .eq('removido', false)

  if (presencasError) {
    throw presencasError
  }

  const pontos = sessao.modalidades?.pontos_por_aula ?? 0
  let alunosAtualizados = 0

  // For each present student: update presence and credit points
  for (const presenca of (presencas ?? [])) {
    // Mark as present at end and assign points
    const { error: updatePresencaError } = await supabase
      .from('aula_presencas')
      .update({ presente_no_fim: true, pontos_ganhos: pontos })
      .eq('id', presenca.id)

    if (updatePresencaError) {
      console.error(`Erro ao atualizar presenca ${presenca.id}:`, updatePresencaError)
      continue
    }

    // Increment user total_points
    const { error: updateUserError } = await supabase.rpc('incrementar_pontos', {
      user_id: presenca.aluno_id,
      pontos_adicionar: pontos,
    })

    if (updateUserError) {
      // Fallback: manual increment
      const { data: userData } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', presenca.aluno_id)
        .single()

      if (userData) {
        await supabase
          .from('users')
          .update({ total_points: (userData.total_points ?? 0) + pontos })
          .eq('id', presenca.aluno_id)
      }
    }

    alunosAtualizados++
  }

  await logAudit(supabase, {
    userId: user.id,
    action: 'aula_finalizada',
    entityType: 'aula_sessao',
    entityId: sessao_id,
    metadata: { total_presentes: presencas?.length ?? 0, pontos_por_aluno: pontos },
  })

  return success({
    message: 'Aula finalizada com sucesso',
    resumo: {
      sessao_id,
      modalidade: sessao.modalidades?.nome ?? '',
      total_presentes: presencas?.length ?? 0,
      alunos_pontuados: alunosAtualizados,
      pontos_por_aluno: pontos,
    },
  })
}, { functionName: 'finalizar-aula', allowedMethods: ['POST'] }))
