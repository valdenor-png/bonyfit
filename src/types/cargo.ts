export interface Cargo {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  permissoes: Record<string, boolean | string[]>;
  modalidade: string | null;
  pode_trocar_modo: boolean;
  ordem: number;
}

export interface Modalidade {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  icone: string | null;
  pontos_aula_completa: number;
  ativa: boolean;
}

export interface AulaSessao {
  id: string;
  modalidade_id: string;
  professor_id: string;
  unidade_id: string | null;
  qr_token: string;
  status: 'aberta' | 'em_andamento' | 'finalizada' | 'cancelada';
  horario_inicio: string | null;
  horario_fim: string | null;
  janela_qr_minutos: number;
  max_alunos: number | null;
  created_at: string;
  // Joined
  modalidade?: Modalidade;
}

export interface AulaPresenca {
  id: string;
  sessao_id: string;
  aluno_id: string;
  escaneou_at: string;
  removido: boolean;
  removido_at: string | null;
  removido_motivo: string | null;
  pontos_concedidos: number;
  presente_no_fim: boolean;
  // Joined
  aluno_nome?: string;
  aluno_avatar?: string | null;
}

export interface LojaProduto {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
  variacoes: { nome: string; opcoes: string[] }[];
  estoque: number | null;
  ativo: boolean;
  destaque: boolean;
  categoria_nome?: string;
  categoria_icone?: string;
}

export interface LojaCategoria {
  id: string;
  nome: string;
  slug: string;
  icone: string | null;
  ordem: number;
}
