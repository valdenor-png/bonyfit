export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Dados: undefined;
  Unidade: undefined;
  Plano: undefined;
  Pagamento: undefined;
  Facial: undefined;
  Contrato: undefined;
};

export type FeedStackParamList = {
  FeedMain: undefined;
  ProfileView: { userId: string };
  Chat: { userId: string; userName: string };
  Grupos: undefined;
  Desafios: undefined;
};

export type TreinoStackParamList = {
  TreinoMain: undefined;
  TreinosProntos: undefined;
  HistoricoTreino: undefined;
};

export type RankingStackParamList = {
  RankingMain: undefined;
  Recompensas: undefined;
};

export type PersonalStackParamList = {
  PersonalMain: undefined;
  AgendamentoPersonal: undefined;
  Aulas: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  HistoricoFinanceiro: undefined;
  Frequencia: undefined;
  Anamnese: undefined;
  AvaliacaoFisica: undefined;
  Peso: undefined;
  Nutricao: undefined;
  AulasOnline: undefined;
  Suporte: undefined;
  Agendamento: undefined;
};

export type TabParamList = {
  Feed: undefined;
  Ranking: undefined;
  Treino: undefined;
  Personal: undefined;
  Perfil: undefined;
};
