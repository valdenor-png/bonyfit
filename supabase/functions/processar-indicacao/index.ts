import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const bodySchema = z.object({
  indicado_id: z.string().uuid(),
})

serve(createHandler(async (req, supabase) => {
  const { indicado_id } = await parseBody(req, bodySchema)

  await checkRateLimit(supabase, indicado_id, { action: 'indicacao' })

  // Find indicador via users.indicado_por
  const { data: indicado, error: indicadoError } = await supabase
    .from('users')
    .select('id, indicado_por')
    .eq('id', indicado_id)
    .single()

  if (indicadoError || !indicado) {
    throw { status: 404, code: 'NOT_FOUND', message: 'Usuario indicado nao encontrado' }
  }

  if (!indicado.indicado_por) {
    throw { status: 400, code: 'NO_INDICADOR', message: 'Este usuario nao possui indicador' }
  }

  const indicador_id = indicado.indicado_por

  // Check monthly limit
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const { count: indicacoesMes, error: countError } = await supabase
    .from('indicacoes')
    .select('id', { count: 'exact', head: true })
    .eq('indicador_id', indicador_id)
    .gte('created_at', inicioMes.toISOString())

  if (countError) {
    throw countError
  }

  // Get config for points and limits
  const { data: config, error: configError } = await supabase
    .from('config_pontos_indicacao')
    .select('*')
    .single()

  if (configError || !config) {
    throw { status: 500, code: 'CONFIG_NOT_FOUND', message: 'Configuracao de indicacao nao encontrada' }
  }

  const limiteAtingido = (indicacoesMes ?? 0) >= (config.limite_mensal ?? 10)
  if (limiteAtingido) {
    throw { status: 400, code: 'LIMIT_REACHED', message: 'Limite mensal de indicacoes atingido' }
  }

  // Check if this indicacao already exists
  const { data: existente } = await supabase
    .from('indicacoes')
    .select('id')
    .eq('indicador_id', indicador_id)
    .eq('indicado_id', indicado_id)
    .maybeSingle()

  if (existente) {
    // Update existing record
    await supabase
      .from('indicacoes')
      .update({ status: 'confirmada', updated_at: new Date().toISOString() })
      .eq('id', existente.id)
  } else {
    // Create new indicacao record
    const { error: insertError } = await supabase
      .from('indicacoes')
      .insert({
        indicador_id,
        indicado_id,
        pontos_indicador: config.pontos_indicador ?? 0,
        pontos_indicado: config.pontos_indicado ?? 0,
        status: 'confirmada',
      })

    if (insertError) {
      throw insertError
    }
  }

  const pontos_indicador = config.pontos_indicador ?? 0
  const pontos_indicado = config.pontos_indicado ?? 0

  // Credit points to indicador
  const { data: indicadorData } = await supabase
    .from('users')
    .select('total_points')
    .eq('id', indicador_id)
    .single()

  if (indicadorData) {
    await supabase
      .from('users')
      .update({ total_points: (indicadorData.total_points ?? 0) + pontos_indicador })
      .eq('id', indicador_id)
  }

  // Credit points to indicado
  const { data: indicadoData } = await supabase
    .from('users')
    .select('total_points')
    .eq('id', indicado_id)
    .single()

  if (indicadoData) {
    await supabase
      .from('users')
      .update({ total_points: (indicadoData.total_points ?? 0) + pontos_indicado })
      .eq('id', indicado_id)
  }

  await logAudit(supabase, {
    userId: indicado_id,
    action: 'indicacao_processed',
    entityType: 'indicacao',
    metadata: { indicador_id, pontos_indicador, pontos_indicado },
  })

  return success({
    message: 'Indicacao processada com sucesso',
    pontos_indicador,
    pontos_indicado,
  })
}, { functionName: 'processar-indicacao', allowedMethods: ['POST'] }))
