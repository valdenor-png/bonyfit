export interface PersonalComCarga {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  especialidade?: string;
  horario?: string;
  rating?: number;
  alunos_count: number;
}

export interface SolicitacaoVip {
  id: string;
  aluno: { id: string; name: string; avatar_url: string | null; level: string };
  modo_escolha: 'salao';
  created_at: string;
}

export interface EscolhaRecente {
  id: string;
  aluno_nome: string;
  personal_nome: string | null;
  modo_escolha: 'direto' | 'salao' | 'recepcao';
  status: 'pendente' | 'ativo' | 'inativo' | 'transferido';
  vinculado_em: string;
}

export interface DetalhePersonal {
  personal: PersonalComCarga;
  alunos: {
    id: string;
    name: string;
    avatar_url: string | null;
    level: string;
    vinculado_em: string;
  }[];
  atividade_recente: {
    tipo: 'treino_criado' | 'avaliacao_feita';
    aluno_nome: string;
    data: string;
  }[];
}
