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

    const {
      dados_pessoais,
      questionario,
      assinatura_base64,
      plano_id,
      metodo_pagamento,
      indicador_id,
    } = await req.json();

    if (!dados_pessoais || !questionario || !assinatura_base64 || !plano_id) {
      return new Response(JSON.stringify({ error: 'dados_pessoais, questionario, assinatura_base64 e plano_id sao obrigatorios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Update user with personal data
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        nome: dados_pessoais.nome,
        cpf: dados_pessoais.cpf,
        telefone: dados_pessoais.telefone,
        data_nascimento: dados_pessoais.data_nascimento,
        endereco: dados_pessoais.endereco,
        genero: dados_pessoais.genero,
        contato_emergencia: dados_pessoais.contato_emergencia,
        plano_id,
        metodo_pagamento: metodo_pagamento ?? null,
      })
      .eq('id', user.id);

    if (updateUserError) {
      throw updateUserError;
    }

    // 2. Insert questionario_saude
    const { error: questionarioError } = await supabase
      .from('questionario_saude')
      .insert({
        usuario_id: user.id,
        ...questionario,
      });

    if (questionarioError) {
      throw questionarioError;
    }

    // 3. Upload signature to Storage
    const base64Data = assinatura_base64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `assinaturas/${user.id}/${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(fileName, bytes.buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Erro ao fazer upload da assinatura:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName);

    const assinaturaUrl = urlData?.publicUrl ?? '';

    // 4. Get active contract template and substitute placeholders
    const { data: template, error: templateError } = await supabase
      .from('contrato_templates')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (templateError || !template) {
      console.error('Template de contrato nao encontrado, continuando sem contrato');
    }

    let contratoId: string | null = null;

    if (template) {
      // Get plano info for contract
      const { data: plano } = await supabase
        .from('planos')
        .select('*')
        .eq('id', plano_id)
        .single();

      // Substitute placeholders in template
      let conteudo = template.conteudo ?? '';
      const substituicoes: Record<string, string> = {
        '{{NOME}}': dados_pessoais.nome ?? '',
        '{{CPF}}': dados_pessoais.cpf ?? '',
        '{{DATA}}': new Date().toLocaleDateString('pt-BR'),
        '{{PLANO}}': plano?.nome ?? '',
        '{{VALOR}}': plano?.valor?.toFixed(2) ?? '0.00',
        '{{ENDERECO}}': dados_pessoais.endereco ?? '',
        '{{TELEFONE}}': dados_pessoais.telefone ?? '',
        '{{EMAIL}}': user.email ?? '',
      };

      for (const [placeholder, valor] of Object.entries(substituicoes)) {
        conteudo = conteudo.replaceAll(placeholder, valor);
      }

      // 5. Insert contrato
      const { data: contrato, error: contratoError } = await supabase
        .from('contratos')
        .insert({
          usuario_id: user.id,
          template_id: template.id,
          conteudo,
          plano_id,
          status: 'assinado',
        })
        .select()
        .single();

      if (contratoError) {
        console.error('Erro ao inserir contrato:', contratoError);
      } else {
        contratoId = contrato?.id ?? null;
      }

      // 6. Insert assinatura record
      if (contratoId) {
        const { error: assinaturaError } = await supabase
          .from('assinaturas')
          .insert({
            contrato_id: contratoId,
            usuario_id: user.id,
            assinatura_url: assinaturaUrl,
            ip_address: req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? '',
            user_agent: req.headers.get('user-agent') ?? '',
          });

        if (assinaturaError) {
          console.error('Erro ao inserir assinatura:', assinaturaError);
        }
      }
    }

    // 7. Set onboarding_completo = true
    const updateData: Record<string, unknown> = { onboarding_completo: true };

    // 8. If indicador_id provided, set indicado_por
    if (indicador_id) {
      updateData.indicado_por = indicador_id;
    }

    const { error: finalUpdateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (finalUpdateError) {
      throw finalUpdateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Onboarding completado com sucesso',
        contrato_id: contratoId,
        assinatura_url: assinaturaUrl,
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
