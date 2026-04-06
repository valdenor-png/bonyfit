import { create } from 'zustand';
import type { AlunoVinculado, WorkoutPlan } from '../types/workout';
import * as personalService from '../services/personal';

interface PersonalState {
  alunos: AlunoVinculado[];
  alunoAtual: {
    aluno: AlunoVinculado | null;
    plano: WorkoutPlan | null;
    ultimosTreinos: any[];
    avaliacoes: any[];
  };
  loading: boolean;

  fetchAlunos: (personalId: string) => Promise<void>;
  fetchAlunoDetalhe: (alunoId: string) => Promise<void>;
  reset: () => void;
}

export const usePersonalStore = create<PersonalState>((set, get) => ({
  alunos: [],
  alunoAtual: {
    aluno: null,
    plano: null,
    ultimosTreinos: [],
    avaliacoes: [],
  },
  loading: false,

  fetchAlunos: async (personalId: string) => {
    set({ loading: true });
    try {
      const raw = await personalService.fetchMeusAlunos(personalId);

      // Enrich each aluno with plano_ativo and ultimo_treino
      const alunos: AlunoVinculado[] = await Promise.all(
        raw.map(async (item: any) => {
          const aluno = item.aluno;
          const plano = await personalService.fetchPlanoAluno(aluno.id);
          const ultimoTreino = await personalService.fetchUltimoTreino(aluno.id);

          return {
            id: item.id,
            aluno,
            plano_ativo: plano ? { id: plano.id, nome: plano.nome } : null,
            ultimo_treino: ultimoTreino?.workout_date || null,
            vinculado_em: item.vinculado_em,
          };
        }),
      );

      set({ alunos, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchAlunoDetalhe: async (alunoId: string) => {
    set({ loading: true });
    try {
      const [plano, ultimosTreinos, avaliacoes] = await Promise.all([
        personalService.fetchPlanoAluno(alunoId),
        personalService.fetchUltimosTreinos(alunoId),
        personalService.fetchAvaliacoes(alunoId),
      ]);

      const currentAluno = get().alunos.find((a) => a.aluno.id === alunoId) || null;

      set({
        alunoAtual: {
          aluno: currentAluno,
          plano,
          ultimosTreinos,
          avaliacoes,
        },
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  reset: () =>
    set({
      alunos: [],
      alunoAtual: { aluno: null, plano: null, ultimosTreinos: [], avaliacoes: [] },
      loading: false,
    }),
}));
