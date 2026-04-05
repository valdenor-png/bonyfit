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

    const { qr_token } = await req.json();
    if (!qr_token) {
      return new Response(JSON.stringify({ error: 'qr_token e obrigatorio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query session by qr_token
    const { data: sessao, error: sessaoError } = await supabase
      .from('aula_sessoes')
      .select('*, modalidades(nome)')
      .eq('qr_token', qr_token)
      .single();

    if (sessaoError || !sessao) {
      return new Response(JSON.stringify({ error: 'Sessao nao encontrada para este QR code' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate session status
    if (!['aberta', 'em_andamento'].includes(sessao.status)) {
      return new Response(JSON.stringify({ error: 'Esta sessao nao esta aberta para presenca' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate time window
    const agora = new Date();
    const inicio = new Date(sessao.horario_inicio);
    const fim = new Date(sessao.horario_fim);
    if (agora < inicio || agora > fim) {
      return new Response(JSON.stringify({ error: 'Fora do horario permitido para registro de presenca' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check duplicate attendance
    const { data: existente } = await supabase
      .from('aula_presencas')
      .select('id')
      .eq('sessao_id', sessao.id)
      .eq('aluno_id', user.id)
      .maybeSingle();

    if (existente) {
      return new Response(JSON.stringify({ error: 'Presenca ja registrada para esta aula' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert attendance
    const { error: insertError } = await supabase
      .from('aula_presencas')
      .insert({
        sessao_id: sessao.id,
        aluno_id: user.id,
        horario_entrada: agora.toISOString(),
      });

    if (insertError) {
      throw insertError;
    }

    const modalidadeNome = sessao.modalidades?.nome ?? 'Aula';

    return new Response(
      JSON.stringify({
        success: true,
        message: `Presenca registrada com sucesso em ${modalidadeNome}`,
        modalidade: modalidadeNome,
        sessao_id: sessao.id,
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
