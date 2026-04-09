import { supabase } from './supabase';

export async function fetchSolicitacoesVip(unitId: string) {
  const { data } = await supabase
    .from('personal_alunos')
    .select('id, status, modo_escolha, created_at, aluno:aluno_id(id, name, avatar_url, level)')
    .eq('status', 'pendente')
    .eq('modo_escolha', 'salao')
    .eq('unidade_id', unitId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function atribuirPersonalVip(solicitacaoId: string, personalId: string, supervisorId: string) {
  return supabase.from('personal_alunos').update({
    personal_id: personalId,
    status: 'ativo',
    atribuido_por: supervisorId,
  }).eq('id', solicitacaoId);
}

export async function fetchAvaliacoesPendentesUnidade(unitId: string) {
  const { data } = await supabase
    .from('agendamento_avaliacoes')
    .select('id, status, observacoes_aluno, created_at, aluno:aluno_id(id, name, avatar_url), personal:personal_id(id, name)')
    .eq('status', 'solicitado')
    .eq('unidade_id', unitId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function agendarAvaliacaoSupervisor(
  id: string,
  data: string,
  hora: string,
  personalId: string,
  supervisorId: string,
) {
  return supabase.from('agendamento_avaliacoes').update({
    data_agendada: data,
    horario_inicio: hora,
    personal_id: personalId,
    status: 'agendado',
    confirmado_por: supervisorId,
  }).eq('id', id);
}

export async function fetchPersonaisUnidade(unitId: string) {
  const { data } = await supabase
    .from('public_user_profile')
    .select('id, name, avatar_url, bio')
    .eq('unit_id', unitId)
    .in('cargo_slug', ['personal', 'supervisor']);

  const result = [];
  for (const p of data || []) {
    const { count } = await supabase
      .from('personal_alunos')
      .select('id', { count: 'exact', head: true })
      .eq('personal_id', p.id)
      .eq('status', 'ativo');
    result.push({ ...p, alunos_count: count || 0 });
  }
  return result;
}

export async function fetchEscolhasRecentes(unitId: string) {
  const { data } = await supabase
    .from('personal_alunos')
    .select('id, modo_escolha, status, vinculado_em, aluno:aluno_id(name), personal:personal_id(name)')
    .eq('unidade_id', unitId)
    .order('vinculado_em', { ascending: false })
    .limit(20);
  return data || [];
}

export async function fetchDetalhePersonal(personalId: string) {
  const { data: alunos } = await supabase
    .from('personal_alunos')
    .select('id, vinculado_em, aluno:aluno_id(id, name, avatar_url, level)')
    .eq('personal_id', personalId)
    .eq('status', 'ativo');
  return { alunos: alunos || [] };
}
