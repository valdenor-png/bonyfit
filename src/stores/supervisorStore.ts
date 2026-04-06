import { create } from 'zustand';
import type { PersonalComCarga, SolicitacaoVip, EscolhaRecente } from '../types/supervisor';
import * as supervisorService from '../services/supervisor';

interface AvaliacaoPendente {
  id: string;
  status: string;
  observacoes_aluno: string | null;
  created_at: string;
  aluno: { id: string; name: string; avatar_url: string | null };
  personal: { id: string; name: string } | null;
}

interface SupervisorState {
  solicitacoesPendentes: SolicitacaoVip[];
  avaliacoesPendentes: AvaliacaoPendente[];
  personaisDaUnidade: PersonalComCarga[];
  escolhasRecentes: EscolhaRecente[];
  loading: boolean;

  fetchAll: (unitId: string) => Promise<void>;
  atribuirPersonal: (solicitacaoId: string, personalId: string, supervisorId: string) => Promise<void>;
  agendarAvaliacao: (id: string, data: string, hora: string, personalId: string, supervisorId: string) => Promise<void>;
  reset: () => void;
}

export const useSupervisorStore = create<SupervisorState>((set, get) => ({
  solicitacoesPendentes: [],
  avaliacoesPendentes: [],
  personaisDaUnidade: [],
  escolhasRecentes: [],
  loading: false,

  fetchAll: async (unitId: string) => {
    set({ loading: true });
    try {
      const [solicitacoes, avaliacoes, personais, escolhas] = await Promise.all([
        supervisorService.fetchSolicitacoesVip(unitId),
        supervisorService.fetchAvaliacoesPendentesUnidade(unitId),
        supervisorService.fetchPersonaisUnidade(unitId),
        supervisorService.fetchEscolhasRecentes(unitId),
      ]);

      const mappedEscolhas: EscolhaRecente[] = (escolhas as any[]).map((e) => ({
        id: e.id,
        aluno_nome: e.aluno?.name || 'Aluno',
        personal_nome: e.personal?.name || null,
        modo_escolha: e.modo_escolha,
        status: e.status,
        vinculado_em: e.vinculado_em,
      }));

      set({
        solicitacoesPendentes: solicitacoes as any[],
        avaliacoesPendentes: avaliacoes as any[],
        personaisDaUnidade: personais as any[],
        escolhasRecentes: mappedEscolhas,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  atribuirPersonal: async (solicitacaoId: string, personalId: string, supervisorId: string) => {
    await supervisorService.atribuirPersonalVip(solicitacaoId, personalId, supervisorId);
    const current = get().solicitacoesPendentes;
    set({ solicitacoesPendentes: current.filter((s) => s.id !== solicitacaoId) });
  },

  agendarAvaliacao: async (id: string, data: string, hora: string, personalId: string, supervisorId: string) => {
    await supervisorService.agendarAvaliacaoSupervisor(id, data, hora, personalId, supervisorId);
    const current = get().avaliacoesPendentes;
    set({ avaliacoesPendentes: current.filter((a) => a.id !== id) });
  },

  reset: () =>
    set({
      solicitacoesPendentes: [],
      avaliacoesPendentes: [],
      personaisDaUnidade: [],
      escolhasRecentes: [],
      loading: false,
    }),
}));
