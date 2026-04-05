import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Public endpoint - no JWT validation
    const body = await req.json();
    const event = body.event;
    const payment = body.payment;

    if (!event || !payment) {
      // Always return 200 to Asaas to avoid retries
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Webhook Asaas recebido: ${event}`, payment.id);

    const externalReference = payment.externalReference;

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED': {
        // Try to update assinatura (subscription payment)
        const { data: assinatura } = await supabase
          .from('assinaturas_pagamento')
          .select('id, usuario_id')
          .eq('asaas_payment_id', payment.id)
          .maybeSingle();

        if (assinatura) {
          await supabase
            .from('assinaturas_pagamento')
            .update({
              status: 'paga',
              data_pagamento: new Date().toISOString(),
            })
            .eq('id', assinatura.id);

          // Update user subscription status
          await supabase
            .from('users')
            .update({ status_assinatura: 'ativa' })
            .eq('id', assinatura.usuario_id);

          // Process indicacao if applicable
          const { data: usuario } = await supabase
            .from('users')
            .select('id, indicado_por')
            .eq('id', assinatura.usuario_id)
            .single();

          if (usuario?.indicado_por) {
            // Check if indicacao already processed
            const { data: indicacaoExistente } = await supabase
              .from('indicacoes')
              .select('id, status')
              .eq('indicador_id', usuario.indicado_por)
              .eq('indicado_id', usuario.id)
              .maybeSingle();

            if (indicacaoExistente && indicacaoExistente.status === 'pendente') {
              // Call processar-indicacao logic inline
              const { data: config } = await supabase
                .from('config_pontos_indicacao')
                .select('*')
                .single();

              if (config) {
                await supabase
                  .from('indicacoes')
                  .update({ status: 'confirmada', updated_at: new Date().toISOString() })
                  .eq('id', indicacaoExistente.id);

                // Credit points to indicador
                const { data: indicadorData } = await supabase
                  .from('users')
                  .select('total_points')
                  .eq('id', usuario.indicado_por)
                  .single();

                if (indicadorData) {
                  await supabase
                    .from('users')
                    .update({ total_points: (indicadorData.total_points ?? 0) + (config.pontos_indicador ?? 0) })
                    .eq('id', usuario.indicado_por);
                }

                // Credit points to indicado
                const { data: indicadoData } = await supabase
                  .from('users')
                  .select('total_points')
                  .eq('id', usuario.id)
                  .single();

                if (indicadoData) {
                  await supabase
                    .from('users')
                    .update({ total_points: (indicadoData.total_points ?? 0) + (config.pontos_indicado ?? 0) })
                    .eq('id', usuario.id);
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
            .maybeSingle();

          if (pedido) {
            await supabase
              .from('loja_pedidos')
              .update({
                status: 'pago',
                data_pagamento: new Date().toISOString(),
              })
              .eq('id', pedido.id);
          }
        }

        break;
      }

      case 'PAYMENT_OVERDUE': {
        // Update assinatura status to vencida
        const { data: assinaturaVencida } = await supabase
          .from('assinaturas_pagamento')
          .select('id, usuario_id')
          .eq('asaas_payment_id', payment.id)
          .maybeSingle();

        if (assinaturaVencida) {
          await supabase
            .from('assinaturas_pagamento')
            .update({ status: 'vencida' })
            .eq('id', assinaturaVencida.id);

          await supabase
            .from('users')
            .update({ status_assinatura: 'vencida' })
            .eq('id', assinaturaVencida.usuario_id);
        }

        // Update loja pedido if applicable
        if (externalReference) {
          await supabase
            .from('loja_pedidos')
            .update({ status: 'vencido' })
            .eq('id', externalReference);
        }

        break;
      }

      default:
        console.log(`Evento nao tratado: ${event}`);
    }

    // Always return 200 OK to Asaas
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    // Still return 200 to avoid Asaas retries
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
