import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { parseBody } from '../_shared/validate.ts'
import { logAudit } from '../_shared/audit.ts'
import { success, error } from '../_shared/response.ts'

// ─── Validação de origem ────────────────────────────────────
function validateWebhookToken(req: Request): void {
  const token = req.headers.get('asaas-access-token')
  const expected = Deno.env.get('ASAAS_WEBHOOK_TOKEN')

  // Se o secret não está configurado, rejeitar TUDO (fail-closed)
  if (!expected) {
    throw { status: 500, code: 'CONFIG_MISSING', message: 'ASAAS_WEBHOOK_TOKEN não configurado' }
  }

  if (!token || token !== expected) {
    throw { status: 401, code: 'INVALID_WEBHOOK_TOKEN', message: 'Token de webhook inválido' }
  }
}

// ─── Rate limit por IP (in-memory, resets por deploy) ───────
const ipRequests = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS_PER_MINUTE = 10

function checkIpRateLimit(req: Request): void {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('cf-connecting-ip')
    ?? 'unknown'

  const now = Date.now()
  const entry = ipRequests.get(ip)

  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + 60_000 })
    return
  }

  entry.count++
  if (entry.count > MAX_REQUESTS_PER_MINUTE) {
    throw { status: 429, code: 'RATE_LIMITED', message: `IP ${ip} excedeu ${MAX_REQUESTS_PER_MINUTE} requests/minuto` }
  }
}

// ─── Schema rígido do payload Asaas ─────────────────────────
const VALID_EVENTS = [
  'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE',
  'PAYMENT_DELETED', 'PAYMENT_REFUNDED', 'PAYMENT_CREATED',
  'PAYMENT_UPDATED', 'PAYMENT_DUNNING_RECEIVED',
] as const

const bodySchema = z.object({
  event: z.enum(VALID_EVENTS),
  payment: z.object({
    id: z.string().min(1),
    customer: z.string().min(1),
    value: z.number(),
    status: z.string(),
    externalReference: z.string().nullish(),
  }).passthrough(),
})

serve(createHandler(async (req, supabase) => {
  // 1. Validar origem (token) e rate limit por IP
  validateWebhookToken(req)
  checkIpRateLimit(req)

  // Webhook must ALWAYS return 200 after auth — wrap business logic in try/catch
  try {
    const body = await parseBody(req, bodySchema)
    const event = body.event
    const payment = body.payment

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
