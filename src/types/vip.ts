export interface PlanoVip {
  tipo: 'padrao' | 'vip';
  personal_exclusivo: boolean;
  avaliacao_mensal: boolean;
  duracao_sessao_min: number;
}

export interface SolicitacaoPersonal {
  id: string;
  aluno_id: string;
  aluno?: { name: string; avatar_url: string | null; level: string };
  personal_id: string | null;
  unidade_id: string;
  status: 'pendente' | 'ativo' | 'inativo' | 'transferido';
  modo_escolha: 'direto' | 'salao' | 'recepcao';
  origem: 'app' | 'recepcao' | 'personal';
  atribuido_por?: string;
  vinculado_em: string;
}

export interface AgendamentoAvaliacao {
  id: string;
  aluno_id: string;
  personal_id: string | null;
  unidade_id: string;
  data_agendada: string | null;
  horario_inicio: string | null;
  horario_fim: string | null;
  status: 'solicitado' | 'agendado' | 'realizado' | 'cancelado' | 'nao_compareceu';
  solicitado_por: 'app' | 'recepcao' | 'personal';
  confirmado_por: string | null;
  avaliacao_id: string | null;
  observacoes_aluno: string | null;
  observacoes_recepcao: string | null;
  aluno?: { name: string; avatar_url: string | null };
  personal?: { name: string; avatar_url: string | null };
}
