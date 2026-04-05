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

    const { sessao_id } = await req.json();
    if (!sessao_id) {
      return new Response(JSON.stringify({ error: 'sessao_id e obrigatorio' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate professor owns the session
    const { data: sessao, error: sessaoError } = await supabase
      .from('aula_sessoes')
      .select('*, modalidades(nome, pontos_por_aula)')
      .eq('id', sessao_id)
      .eq('professor_id', user.id)
      .single();

    if (sessaoError || !sessao) {
      return new Response(JSON.stringify({ error: 'Sessao nao encontrada ou voce nao e o professor desta aula' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (sessao.status === 'finalizada') {
      return new Response(JSON.stringify({ error: 'Sessao ja foi finalizada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update session status to finalizada
    const { error: updateSessaoError } = await supabase
      .from('aula_sessoes')
      .update({ status: 'finalizada', horario_fim_real: new Date().toISOString() })
      .eq('id', sessao_id);

    if (updateSessaoError) {
      throw updateSessaoError;
    }

    // Get present attendees (not removed)
    const { data: presencas, error: presencasError } = await supabase
      .from('aula_presencas')
      .select('id, aluno_id')
      .eq('sessao_id', sessao_id)
      .eq('removido', false);

    if (presencasError) {
      throw presencasError;
    }

    const pontos = sessao.modalidades?.pontos_por_aula ?? 0;
    let alunosAtualizados = 0;

    // For each present student: update presence and credit points
    for (const presenca of (presencas ?? [])) {
      // Mark as present at end and assign points
      const { error: updatePresencaError } = await supabase
        .from('aula_presencas')
        .update({ presente_no_fim: true, pontos_ganhos: pontos })
        .eq('id', presenca.id);

      if (updatePresencaError) {
        console.error(`Erro ao atualizar presenca ${presenca.id}:`, updatePresencaError);
        continue;
      }

      // Increment user total_points
      const { error: updateUserError } = await supabase.rpc('incrementar_pontos', {
        user_id: presenca.aluno_id,
        pontos_adicionar: pontos,
      });

      if (updateUserError) {
        // Fallback: manual increment
        const { data: userData } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', presenca.aluno_id)
          .single();

        if (userData) {
          await supabase
            .from('users')
            .update({ total_points: (userData.total_points ?? 0) + pontos })
            .eq('id', presenca.aluno_id);
        }
      }

      alunosAtualizados++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Aula finalizada com sucesso',
        resumo: {
          sessao_id,
          modalidade: sessao.modalidades?.nome ?? '',
          total_presentes: presencas?.length ?? 0,
          alunos_pontuados: alunosAtualizados,
          pontos_por_aluno: pontos,
        },
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
