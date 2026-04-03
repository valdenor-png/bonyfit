export type AuthStackParamList = {
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
};

export type TreinoStackParamList = {
  TreinoMain: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Feed: undefined;
  Ranking: undefined;
  Treino: undefined;
  Personal: undefined;
  Perfil: undefined;
};
