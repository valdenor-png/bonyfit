import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const bodySchema = z.object({
  aluno_id: z.string().uuid(),
  medidas: z.object({
    peso: z.number(),
    altura: z.number(),
    percentual_gordura: z.number(),
  }).passthrough(),
})

serve(createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)

  const { aluno_id, medidas } = await parseBody(req, bodySchema)

  await checkRateLimit(supabase, user.id, { action: 'avaliacao' })

  // Validate avaliador role from users table (not cargos)
  const { data: avaliador, error: avaliadorError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (avaliadorError || !avaliador) {
    throw { status: 404, code: 'NOT_FOUND', message: 'Avaliador nao encontrado' }
  }

  if (!['personal', 'dono'].includes(avaliador.role)) {
    throw { status: 403, code: 'FORBIDDEN', message: 'Apenas personal trainers e donos podem registrar avaliacoes' }
  }

  // Get previous evaluation for comparison
  const { data: avaliacaoAnterior } = await supabase
    .from('avaliacoes')
    .select('*')
    .eq('aluno_id', aluno_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Calculate derived values
  const peso = medidas.peso ?? 0
  const altura = medidas.altura ?? 0 // in meters
  const percentual_gordura = medidas.percentual_gordura ?? 0

  const imc = altura > 0 ? peso / (altura * altura) : 0
  const massa_gorda = peso * (percentual_gordura / 100)
  const massa_magra = peso - massa_gorda

  // Calculate differences from previous evaluation
  let diferencas: Record<string, number> = {}
  let melhorias = 0

  if (avaliacaoAnterior) {
    const campos = ['peso', 'percentual_gordura', 'massa_magra', 'imc']
    const valoresAtuais: Record<string, number> = { peso, percentual_gordura, massa_magra, imc }
    const camposMelhorQuandoMenor = ['peso', 'percentual_gordura', 'imc']

    for (const campo of campos) {
      const anterior = avaliacaoAnterior[campo] ?? 0
      const atual = valoresAtuais[campo] ?? 0
      const diff = atual - anterior
      diferencas[campo] = parseFloat(diff.toFixed(2))

      if (camposMelhorQuandoMenor.includes(campo) && diff < 0) {
        melhorias++
      } else if (campo === 'massa_magra' && diff > 0) {
        melhorias++
      }
    }
  }

  // Get config for points
  const { data: config } = await supabase
    .from('config_pontos_avaliacao')
    .select('*')
    .single()

  const pontosBase = config?.pontos_base ?? 10
  const pontosBonus = config?.pontos_bonus_melhoria ?? 5
  const pontosTotal = pontosBase + (melhorias * pontosBonus)

  // Insert evaluation
  const { data: novaAvaliacao, error: insertError } = await supabase
    .from('avaliacoes')
    .insert({
      aluno_id,
      avaliador_id: user.id,
      peso,
      altura,
      percentual_gordura,
      massa_magra: parseFloat(massa_magra.toFixed(2)),
      massa_gorda: parseFloat(massa_gorda.toFixed(2)),
      imc: parseFloat(imc.toFixed(2)),
      medidas: medidas,
      diferencas,
      melhorias,
      pontos_ganhos: pontosTotal,
    })
    .select()
    .single()

  if (insertError) {
    throw insertError
  }

  // Credit points to student
  const { data: alunoData } = await supabase
    .from('users')
    .select('total_points')
    .eq('id', aluno_id)
    .single()

  if (alunoData) {
    await supabase
      .from('users')
      .update({ total_points: (alunoData.total_points ?? 0) + pontosTotal })
      .eq('id', aluno_id)
  }

  await logAudit(supabase, {
    userId: user.id,
    action: 'avaliacao_registrada',
    entityType: 'avaliacao',
    entityId: novaAvaliacao.id,
    metadata: { aluno_id, pontos: pontosTotal, melhorias },
  })

  return success({
    message: 'Avaliacao registrada com sucesso',
    avaliacao: novaAvaliacao,
    pontos_ganhos: pontosTotal,
    melhorias,
    diferencas,
  })
}, { functionName: 'registrar-avaliacao', allowedMethods: ['POST'] }))
