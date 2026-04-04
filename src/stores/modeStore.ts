import { create } from 'zustand';

interface ModeStore {
  currentMode: 'aluno' | 'profissional';
  toggleMode: () => void;
  setMode: (mode: 'aluno' | 'profissional') => void;
}

export const useModeStore = create<ModeStore>((set) => ({
  currentMode: 'aluno',
  toggleMode: () =>
    set((state) => ({
      currentMode: state.currentMode === 'aluno' ? 'profissional' : 'aluno',
    })),
  setMode: (mode) => set({ currentMode: mode }),
}));
