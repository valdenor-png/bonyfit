import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { parseBody } from '../_shared/validate.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const bodySchema = z.object({
  event: z.string().optional(),
  payment: z.object({}).passthrough().optional(),
}).passthrough()

serve(createHandler(async (req, supabase) => {
  // Webhook must ALWAYS return 200 — wrap everything in internal try/catch
  try {
    const body = await parseBody(req, bodySchema)
    const event = body.event
    const payment = body.payment as Record<string, any> | undefined

    if (!event || !payment) {
      return success({ received: true })
    }

    console.log(`Webhook Asaas recebido: ${event}`, payment.id)

    const externalReference = payment.externalReference

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        // Try to update assinatura (subscription payment)
        const { data: assinatura } = await supabase
          .from('assinaturas_pagamento')
          .select('id, usuario_id')
          .eq('asaas_payment_id', payment.id)
          .maybeSingle()

        if (assinatura) {
          await supabase
            .from('assinaturas_pagamento')
            .update({
              status: 'paga',
              data_pagamento: new Date().toISOString(),
            })
            .eq('id', assinatura.id)

          // Update user subscription status
          await supabase
            .from('users')
            .update({ status_assinatura: 'ativa' })
            .eq('id', assinatura.usuario_id)

          // Process indicacao if applicable
          const { data: usuario } = await supabase
            .from('users')
            .select('id, indicado_por')
            .eq('id', assinatura.usuario_id)
            .single()

          if (usuario?.indicado_por) {
            // Check if indicacao already processed
            const { data: indicacaoExistente } = await supabase
              .from('indicacoes')
              .select('id, status')
              .eq('indicador_id', usuario.indicado_por)
              .eq('indicado_id', usuario.id)
              .maybeSingle()

            if (indicacaoExistente && indicacaoExistente.status === 'pendente') {
              // Call processar-indicacao logic inline
              const { data: config } = await supabase
                .from('config_pontos_indicacao')
                .select('*')
                .single()

              if (config) {
                await supabase
                  .from('indicacoes')
                  .update({ status: 'confirmada', updated_at: new Date().toISOString() })
                  .eq('id', indicacaoExistente.id)

                // Credit points to indicador
                const { data: indicadorData } = await supabase
                  .from('users')
                  .select('total_points')
                  .eq('id', usuario.indicado_por)
                  .single()

                if (indicadorData) {
                  await supabase
                    .from('users')
                    .update({ total_points: (indicadorData.total_points ?? 0) + (config.pontos_indicador ?? 0) })
                    .eq('id', usuario.indicado_por)
                }

                // Credit points to indicado
                const { data: indicadoData } = await supabase
                  .from('users')
                  .select('total_points')
                  .eq('id', usuario.id)
                  .single()

                if (indicadoData) {
                  await supabase
                    .from('users')
                    .update({ total_points: (indicadoData.total_points ?? 0) + (config.pontos_indicado ?? 0) })
                    .eq('id', usuario.id)
                }
              }
            }
          }
        }

        // Try to update loja pedido (store order)
        if (externalReference) {
          const { data: pedido } = await supabase
            .from('loja_pedidos')
            .select('id')
            .eq('id', externalReference)
            .maybeSingle()

          if (pedido) {
            await supabase
              .from('loja_pedidos')
              .update({
                status: 'pago',
                data_pagamento: new Date().toISOString(),
              })
              .eq('id', pedido.id)
          }
        }

        break
      }

      case 'PAYMENT_OVERDUE': {
        // Update assinatura status to vencida
        const { data: assinaturaVencida } = await supabase
          .from('assinaturas_pagamento')
          .select('id, usuario_id')
          .eq('asaas_payment_id', payment.id)
          .maybeSingle()

        if (assinaturaVencida) {
          await supabase
            .from('assinaturas_pagamento')
            .update({ status: 'vencida' })
            .eq('id', assinaturaVencida.id)

          await supabase
            .from('users')
            .update({ status_assinatura: 'vencida' })
            .eq('id', assinaturaVencida.usuario_id)
        }

        // Update loja pedido if applicable
        if (externalReference) {
          await supabase
            .from('loja_pedidos')
            .update({ status: 'vencido' })
            .eq('id', externalReference)
        }

        break
      }

      default:
        console.log(`Evento nao tratado: ${event}`)
    }

    await logAudit(supabase, {
      userId: 'system',
      action: 'webhook_asaas',
      metadata: { event, payment_id: payment.id },
    })
  } catch (err: any) {
    // Log error but still return 200 to avoid Asaas retries
    console.error('Webhook error:', err)
    try {
      await logAudit(supabase, {
        userId: 'system',
        action: 'webhook_asaas_error',
        metadata: { error: err.message ?? String(err) },
      })
    } catch {
      // Best effort
    }
  }

  return success({ received: true })
}, { functionName: 'webhook-asaas', allowedMethods: ['POST'] }))
