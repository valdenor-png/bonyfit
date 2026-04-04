import { create } from 'zustand';

interface OnboardingStore {
  etapaAtual: number;

  // Dados pessoais
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  nascimento: string;

  // PAR-Q
  respostasParQ: Record<string, boolean | string>;
  requerAtestado: boolean;

  // Contrato
  scrolledToEnd: boolean;
  aceitouTermos: boolean;
  versaoContrato: string;
  textoContrato: string;

  // Assinatura
  assinaturaBase64: string | null;

  // Plano
  planoSelecionadoId: string | null;
  metodoPagamento: string | null;

  // Actions
  setDadosPessoais: (dados: Partial<OnboardingStore>) => void;
  setRespostaParQ: (pergunta: string, resposta: boolean | string) => void;
  setScrolledToEnd: (v: boolean) => void;
  setAceitouTermos: (v: boolean) => void;
  setAssinatura: (base64: string) => void;
  setPlano: (planoId: string, metodo: string) => void;
  avancarEtapa: () => void;
  voltarEtapa: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  etapaAtual: 0,
  nome: '',
  cpf: '',
  email: '',
  telefone: '',
  senha: '',
  nascimento: '',
  respostasParQ: {},
  requerAtestado: false,
  scrolledToEnd: false,
  aceitouTermos: false,
  versaoContrato: 'v1.0',
  textoContrato: '',
  assinaturaBase64: null,
  planoSelecionadoId: null,
  metodoPagamento: null,

  setDadosPessoais: (dados) => set(dados),

  setRespostaParQ: (pergunta, resposta) =>
    set((s) => {
      const updated = { ...s.respostasParQ, [pergunta]: resposta };
      const boolKeys = Object.keys(updated).filter(
        (k) => typeof updated[k] === 'boolean'
      );
      const requer = boolKeys.some((k) => updated[k] === true);
      return { respostasParQ: updated, requerAtestado: requer };
    }),

  setScrolledToEnd: (v) => set({ scrolledToEnd: v }),
  setAceitouTermos: (v) => set({ aceitouTermos: v }),
  setAssinatura: (base64) => set({ assinaturaBase64: base64 }),
  setPlano: (planoId, metodo) =>
    set({ planoSelecionadoId: planoId, metodoPagamento: metodo }),
  avancarEtapa: () => set((s) => ({ etapaAtual: s.etapaAtual + 1 })),
  voltarEtapa: () => set((s) => ({ etapaAtual: Math.max(0, s.etapaAtual - 1) })),
  reset: () =>
    set({
      etapaAtual: 0,
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      senha: '',
      nascimento: '',
      respostasParQ: {},
      requerAtestado: false,
      scrolledToEnd: false,
      aceitouTermos: false,
      assinaturaBase64: null,
      planoSelecionadoId: null,
      metodoPagamento: null,
    }),
}));
