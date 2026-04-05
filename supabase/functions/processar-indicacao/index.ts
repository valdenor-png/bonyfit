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

    const { indicado_id } = await req.json();
    if (!indicado_id) {
      return new Response(JSON.stringify({ error: 'indicado_id e obrigatorio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find indicador via users.indicado_por
    const { data: indicado, error: indicadoError } = await supabase
      .from('users')
      .select('id, indicado_por')
      .eq('id', indicado_id)
      .single();

    if (indicadoError || !indicado) {
      return new Response(JSON.stringify({ error: 'Usuario indicado nao encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!indicado.indicado_por) {
      return new Response(JSON.stringify({ error: 'Este usuario nao possui indicador' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const indicador_id = indicado.indicado_por;

    // Check monthly limit
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: indicacoesMes, error: countError } = await supabase
      .from('indicacoes')
      .select('id', { count: 'exact', head: true })
      .eq('indicador_id', indicador_id)
      .gte('created_at', inicioMes.toISOString());

    if (countError) {
      throw countError;
    }

    // Get config for points and limits
    const { data: config, error: configError } = await supabase
      .from('config_pontos_indicacao')
      .select('*')
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'Configuracao de indicacao nao encontrada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const limiteAtingido = (indicacoesMes ?? 0) >= (config.limite_mensal ?? 10);
    if (limiteAtingido) {
      return new Response(JSON.stringify({ error: 'Limite mensal de indicacoes atingido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this indicacao already exists
    const { data: existente } = await supabase
      .from('indicacoes')
      .select('id')
      .eq('indicador_id', indicador_id)
      .eq('indicado_id', indicado_id)
      .maybeSingle();

    if (existente) {
      // Update existing record
      await supabase
        .from('indicacoes')
        .update({ status: 'confirmada', updated_at: new Date().toISOString() })
        .eq('id', existente.id);
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
        });

      if (insertError) {
        throw insertError;
      }
    }

    // Credit points to indicador
    const { data: indicadorData } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', indicador_id)
      .single();

    if (indicadorData) {
      await supabase
        .from('users')
        .update({ total_points: (indicadorData.total_points ?? 0) + (config.pontos_indicador ?? 0) })
        .eq('id', indicador_id);
    }

    // Credit points to indicado
    const { data: indicadoData } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', indicado_id)
      .single();

    if (indicadoData) {
      await supabase
        .from('users')
        .update({ total_points: (indicadoData.total_points ?? 0) + (config.pontos_indicado ?? 0) })
        .eq('id', indicado_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Indicacao processada com sucesso',
        pontos_indicador: config.pontos_indicador,
        pontos_indicado: config.pontos_indicado,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
