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

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Token de autenticacao ausente' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuario nao autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { aluno_id, medidas } = await req.json();
    if (!aluno_id || !medidas) {
      return new Response(JSON.stringify({ error: 'aluno_id e medidas sao obrigatorios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate avaliador is personal or dono
    const { data: avaliador, error: avaliadorError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (avaliadorError || !avaliador) {
      return new Response(JSON.stringify({ error: 'Avaliador nao encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['personal', 'dono'].includes(avaliador.role)) {
      return new Response(JSON.stringify({ error: 'Apenas personal trainers e donos podem registrar avaliacoes' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get previous evaluation for comparison
    const { data: avaliacaoAnterior } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('aluno_id', aluno_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate derived values
    const peso = medidas.peso ?? 0;
    const altura = medidas.altura ?? 0; // in meters
    const percentual_gordura = medidas.percentual_gordura ?? 0;

    const imc = altura > 0 ? peso / (altura * altura) : 0;
    const massa_gorda = peso * (percentual_gordura / 100);
    const massa_magra = peso - massa_gorda;

    // Calculate differences from previous evaluation
    let diferencas: Record<string, number> = {};
    let melhorias = 0;

    if (avaliacaoAnterior) {
      const campos = ['peso', 'percentual_gordura', 'massa_magra', 'imc'];
      const valoresAtuais: Record<string, number> = { peso, percentual_gordura, massa_magra, imc };
      const camposMelhorQuandoMenor = ['peso', 'percentual_gordura', 'imc'];

      for (const campo of campos) {
        const anterior = avaliacaoAnterior[campo] ?? 0;
        const atual = valoresAtuais[campo] ?? 0;
        const diff = atual - anterior;
        diferencas[campo] = parseFloat(diff.toFixed(2));

        if (camposMelhorQuandoMenor.includes(campo) && diff < 0) {
          melhorias++;
        } else if (campo === 'massa_magra' && diff > 0) {
          melhorias++;
        }
      }
    }

    // Get config for points
    const { data: config } = await supabase
      .from('config_pontos_avaliacao')
      .select('*')
      .single();

    const pontosBase = config?.pontos_base ?? 10;
    const pontosBonus = config?.pontos_bonus_melhoria ?? 5;
    const pontosTotal = pontosBase + (melhorias * pontosBonus);

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
      .single();

    if (insertError) {
      throw insertError;
    }

    // Credit points to student
    const { data: alunoData } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', aluno_id)
      .single();

    if (alunoData) {
      await supabase
        .from('users')
        .update({ total_points: (alunoData.total_points ?? 0) + pontosTotal })
        .eq('id', aluno_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Avaliacao registrada com sucesso',
        avaliacao: novaAvaliacao,
        pontos_ganhos: pontosTotal,
        melhorias,
        diferencas,
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
