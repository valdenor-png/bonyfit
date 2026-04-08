import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const bodySchema = z.object({
  items: z.array(z.object({
    produto_id: z.string(),
    variacao_id: z.string().optional(),
    quantidade: z.number(),
  })),
  metodo_pagamento: z.string(),
})

serve(createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)
  await checkRateLimit(supabase, user.id, { action: 'shop_purchase' })

  const { items, metodo_pagamento } = await parseBody(req, bodySchema)

  // Validate products and get real prices
  let totalPedido = 0
  const itensValidados = []

  for (const item of items) {
    const { produto_id, variacao_id, quantidade } = item

    if (!produto_id || !quantidade || quantidade < 1) {
      throw { status: 400, code: 'INVALID_ITEM', message: 'Cada item deve ter produto_id e quantidade valida' }
    }

    // Get product from database
    const { data: produto, error: produtoError } = await supabase
      .from('loja_produtos')
      .select('*')
      .eq('id', produto_id)
      .eq('ativo', true)
      .single()

    if (produtoError || !produto) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Produto ${produto_id} nao encontrado ou inativo` }
    }

    let precoUnitario = produto.preco

    // If variation specified, get variation price
    if (variacao_id) {
      const { data: variacao, error: variacaoError } = await supabase
        .from('loja_produto_variacoes')
        .select('*')
        .eq('id', variacao_id)
        .eq('produto_id', produto_id)
        .eq('ativo', true)
        .single()

      if (variacaoError || !variacao) {
        throw { status: 404, code: 'VARIATION_NOT_FOUND', message: `Variacao ${variacao_id} nao encontrada ou inativa` }
      }

      precoUnitario = variacao.preco ?? produto.preco
    }

    const subtotal = precoUnitario * quantidade
    totalPedido += subtotal

    itensValidados.push({
      produto_id,
      variacao_id: variacao_id ?? null,
      quantidade,
      preco_unitario: precoUnitario,
      subtotal,
      nome_produto: produto.nome,
    })
  }

  // Insert order
  const { data: pedido, error: pedidoError } = await supabase
    .from('loja_pedidos')
    .insert({
      usuario_id: user.id,
      total: totalPedido,
      metodo_pagamento,
      status: metodo_pagamento === 'presencial' ? 'aguardando_pagamento_presencial' : 'aguardando_pagamento',
    })
    .select()
    .single()

  if (pedidoError || !pedido) {
    throw pedidoError ?? new Error('Erro ao criar pedido')
  }

  // Insert order items
  const itensParaInserir = itensValidados.map((item) => ({
    pedido_id: pedido.id,
    produto_id: item.produto_id,
    variacao_id: item.variacao_id,
    quantidade: item.quantidade,
    preco_unitario: item.preco_unitario,
    subtotal: item.subtotal,
  }))

  const { error: itensError } = await supabase
    .from('loja_pedido_itens')
    .insert(itensParaInserir)

  if (itensError) {
    throw itensError
  }

  let payment_url: string | null = null

  // If payment is not presencial, create Asaas charge
  if (metodo_pagamento !== 'presencial') {
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasApiKey) {
      // Update order status to reflect payment error
      await supabase
        .from('loja_pedidos')
        .update({ status: 'erro_pagamento' })
        .eq('id', pedido.id)

      throw { status: 500, code: 'PAYMENT_CONFIG_ERROR', message: 'Configuracao de pagamento nao disponivel' }
    }

    // Get user info for Asaas
    const { data: userData } = await supabase
      .from('users')
      .select('nome, email, cpf')
      .eq('id', user.id)
      .single()

    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') ?? 'https://api.asaas.com/v3'

    // Create Asaas payment
    const billingType = metodo_pagamento === 'pix' ? 'PIX'
      : metodo_pagamento === 'boleto' ? 'BOLETO'
      : 'CREDIT_CARD'

    const asaasPayload = {
      customer: userData?.cpf ?? user.id,
      billingType,
      value: totalPedido,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `Pedido #${pedido.id} - Bony Fit`,
      externalReference: pedido.id,
    }

    try {
      const asaasResponse = await fetch(`${asaasBaseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify(asaasPayload),
      })

      const asaasData = await asaasResponse.json()

      if (asaasResponse.ok && asaasData.id) {
        payment_url = asaasData.invoiceUrl ?? asaasData.bankSlipUrl ?? null

        // Update order with Asaas payment ID
        await supabase
          .from('loja_pedidos')
          .update({
            asaas_payment_id: asaasData.id,
            payment_url,
          })
          .eq('id', pedido.id)
      } else {
        console.error('Asaas error:', asaasData)
        await supabase
          .from('loja_pedidos')
          .update({ status: 'erro_pagamento' })
          .eq('id', pedido.id)
      }
    } catch (asaasError) {
      console.error('Asaas request error:', asaasError)
      await supabase
        .from('loja_pedidos')
        .update({ status: 'erro_pagamento' })
        .eq('id', pedido.id)
    }
  }

  await logAudit(supabase, {
    userId: user.id,
    action: 'order_created',
    entityType: 'loja_pedido',
    entityId: pedido.id,
    metadata: { total: totalPedido, items_count: itensValidados.length },
  })

  return success({
    pedido_id: pedido.id,
    total: totalPedido,
    status: pedido.status,
    payment_url,
    itens: itensValidados.map((i) => ({
      nome: i.nome_produto,
      quantidade: i.quantidade,
      preco_unitario: i.preco_unitario,
      subtotal: i.subtotal,
    })),
  })
}, { functionName: 'criar-pedido-loja', allowedMethods: ['POST'] }))
