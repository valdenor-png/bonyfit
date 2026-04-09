import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://esm.sh/zod@3.23'
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHandler } from '../_shared/handler.ts'
import { parseBody } from '../_shared/validate.ts'
import { logAudit } from '../_shared/audit.ts'
import { success, error } from '../_shared/response.ts'

// ═══════════════════════════════════════════════════════════════
// CAMADA 1 — Rate limit por IP (in-memory)
// ═══════════════════════════════════════════════════════════════
const ipRequests = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS_PER_MINUTE = 10

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('cf-connecting-ip')
    ?? 'unknown'
}

function checkIpRateLimit(req: Request): void {
  const ip = getClientIp(req)
  const now = Date.now()
  const entry = ipRequests.get(ip)

  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + 60_000 })
    return
  }

  entry.count++
  if (entry.count > MAX_REQUESTS_PER_MINUTE) {
    throw { status: 429, code: 'RATE_LIMITED', message: `IP ${ip} excedeu ${MAX_REQUESTS_PER_MINUTE} req/min` }
  }
}

// ═══════════════════════════════════════════════════════════════
// CAMADA 2 — Validação de token do webhook
// ═══════════════════════════════════════════════════════════════
function validateWebhookToken(req: Request): void {
  const token = req.headers.get('asaas-access-token')
  const expected = Deno.env.get('ASAAS_WEBHOOK_TOKEN')

  if (!expected) {
    throw { status: 500, code: 'CONFIG_MISSING', message: 'ASAAS_WEBHOOK_TOKEN não configurado' }
  }
  if (!token || token !== expected) {
    throw { status: 401, code: 'INVALID_WEBHOOK_TOKEN', message: 'Token de webhook inválido' }
  }
}

// ═══════════════════════════════════════════════════════════════
// CAMADA 3 — Schema rígido do payload
// ═══════════════════════════════════════════════════════════════
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
    dateCreated: z.string().nullish(),
    externalReference: z.string().nullish(),
  }).passthrough(),
})

type WebhookBody = z.infer<typeof bodySchema>

// ═══════════════════════════════════════════════════════════════
// CAMADA 4 — Validação de timestamp (anti-replay, 5 min)
// ═══════════════════════════════════════════════════════════════
function validateTimestamp(body: WebhookBody): void {
  const timestamp = body.payment.dateCreated
  if (!timestamp) return // Asaas nem sempre envia — não bloquear

  const eventTime = new Date(timestamp).getTime()
  if (isNaN(eventTime)) return // Data inválida — não bloquear

  const drift = Math.abs(Date.now() - eventTime)
  const FIVE_MINUTES = 5 * 60 * 1000

  if (drift > FIVE_MINUTES) {
    throw { status: 403, code: 'WEBHOOK_EXPIRED', message: 'Webhook expirado (>5min)' }
  }
}

// ═══════════════════════════════════════════════════════════════
// CAMADA 5 — Idempotência (webhook_logs)
// ═══════════════════════════════════════════════════════════════
async function checkIdempotency(
  supabase: SupabaseClient,
  eventId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('webhook_logs')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle()

  return !!data
}

async function recordWebhookLog(
  supabase: SupabaseClient,
  body: WebhookBody,
  sourceIp: string,
  verifiedAtApi: boolean,
): Promise<void> {
  const eventId = `${body.payment.id}_${body.event}`
  await supabase.from('webhook_logs').insert({
    event_id: eventId,
    event_type: body.event,
    payment_id: body.payment.id,
    customer_id: body.payment.customer,
    value: body.payment.value,
    source_ip: sourceIp,
    verified_at_api: verifiedAtApi,
  })
}

// ═══════════════════════════════════════════════════════════════
// CAMADA 6 — Double check na API do Asaas
// ═══════════════════════════════════════════════════════════════
interface AsaasPaymentVerification {
  status: string
  value: number
  customer: string
}

async function verifyPaymentAtAsaas(
  paymentId: string,
  expectedValue: number,
): Promise<AsaasPaymentVerification> {
  const apiKey = Deno.env.get('ASAAS_API_KEY')
  if (!apiKey) {
    throw { status: 500, code: 'CONFIG_MISSING', message: 'ASAAS_API_KEY não configurado' }
  }

  const baseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3'

  const res = await fetch(`${baseUrl}/payments/${paymentId}`, {
    headers: { 'access_token': apiKey },
  })

  if (!res.ok) {
    throw {
      status: 403,
      code: 'PAYMENT_VERIFICATION_FAILED',
      message: `Asaas retornou ${res.status} ao verificar pagamento ${paymentId}`,
    }
  }

  const real = await res.json()

  // Comparar valor — tolerância de R$0.01 por arredondamento
  if (Math.abs(real.value - expectedValue) > 0.01) {
    console.error('ALERTA SEGURANÇA: valor divergente', {
      webhook: expectedValue,
      real: real.value,
      paymentId,
    })
    throw {
      status: 403,
      code: 'VALUE_MISMATCH',
      message: 'Valor do webhook difere do valor real no Asaas',
    }
  }

  return { status: real.status, value: real.value, customer: real.customer }
}

// ═══════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════
serve(createHandler(async (req, supabase) => {
  const sourceIp = getClientIp(req)

  // ── 1. Rate limit por IP ─────────────────────────────────
  checkIpRateLimit(req)

  // ── 2. Validar token ─────────────────────────────────────
  validateWebhookToken(req)

  // ── 3. Validar schema ────────────────────────────────────
  const body = await parseBody(req, bodySchema)
  const { event, payment } = body

  // ── 4. Validar timestamp (anti-replay) ───────────────────
  validateTimestamp(body)

  // ── 5. Idempotência ──────────────────────────────────────
  const eventId = `${payment.id}_${event}`
  if (await checkIdempotency(supabase, eventId)) {
    return success({ received: true, already_processed: true })
  }

  // ── 6. Double check na API do Asaas ──────────────────────
  // Só verifica para eventos que alteram estado financeiro
  const EVENTS_REQUIRING_VERIFICATION = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']
  let verifiedAtApi = false

  if (EVENTS_REQUIRING_VERIFICATION.includes(event)) {
    await verifyPaymentAtAsaas(payment.id, payment.value)
    verifiedAtApi = true
  }

  // ── 7. Processar evento ──────────────────────────────────
  // A partir daqui, wrap em try/catch para sempre retornar 200
  // (evita retries infinitos do Asaas em caso de erro interno)
  try {
    const externalReference = payment.externalReference

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        // Atualizar assinatura
        const { data: assinatura } = await supabase
          .from('assinaturas_pagamento')
          .select('id, usuario_id')
          .eq('asaas_payment_id', payment.id)
          .maybeSingle()

        if (assinatura) {
          await supabase
            .from('assinaturas_pagamento')
            .update({ status: 'paga', data_pagamento: new Date().toISOString() })
            .eq('id', assinatura.id)

          await supabase
            .from('users')
            .update({ status_assinatura: 'ativa' })
            .eq('id', assinatura.usuario_id)

          // Processar indicação se aplicável
          const { data: usuario } = await supabase
            .from('users')
            .select('id, indicado_por')
            .eq('id', assinatura.usuario_id)
            .single()

          if (usuario?.indicado_por) {
            const { data: indicacaoExistente } = await supabase
              .from('indicacoes')
              .select('id, status')
              .eq('indicador_id', usuario.indicado_por)
              .eq('indicado_id', usuario.id)
              .maybeSingle()

            if (indicacaoExistente && indicacaoExistente.status === 'pendente') {
              const { data: config } = await supabase
                .from('config_pontos_indicacao')
                .select('*')
                .single()

              if (config) {
                await supabase
                  .from('indicacoes')
                  .update({ status: 'confirmada', updated_at: new Date().toISOString() })
                  .eq('id', indicacaoExistente.id)

                // Pontos ao indicador
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

                // Pontos ao indicado
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

        // Atualizar pedido da loja
        if (externalReference) {
          const { data: pedido } = await supabase
            .from('loja_pedidos')
            .select('id')
            .eq('id', externalReference)
            .maybeSingle()

          if (pedido) {
            await supabase
              .from('loja_pedidos')
              .update({ status: 'pago', data_pagamento: new Date().toISOString() })
              .eq('id', pedido.id)
          }
        }

        break
      }

      case 'PAYMENT_OVERDUE': {
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

        if (externalReference) {
          await supabase
            .from('loja_pedidos')
            .update({ status: 'vencido' })
            .eq('id', externalReference)
        }

        break
      }

      default:
        console.log(`Evento não tratado: ${event}`)
    }

    // ── 8. Gravar no webhook_logs ────────────────────────────
    await recordWebhookLog(supabase, body, sourceIp, verifiedAtApi)

    await logAudit(supabase, {
      userId: 'system',
      action: 'webhook_asaas',
      metadata: { event, payment_id: payment.id, verified_at_api: verifiedAtApi },
    })
  } catch (err: any) {
    // Erro de negócio — logar mas retornar 200 para evitar retries
    console.error('Webhook processing error:', err)
    try {
      await logAudit(supabase, {
        userId: 'system',
        action: 'webhook_asaas_error',
        metadata: { event, payment_id: payment.id, error: err.message ?? String(err) },
      })
    } catch {
      // Best effort
    }
  }

  // ── 9. Retornar 200 ───────────────────────────────────────
  return success({ received: true })
}, { functionName: 'webhook-asaas', allowedMethods: ['POST'] }))
