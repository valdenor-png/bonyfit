import { create } from 'zustand';

export interface TreinoSet {
  id: string;
  weight: number | null;
  reps: number | null;
  tempoSeconds: number | null;
  completed: boolean;
  completedAt: number | null;
  prevWeight: number | null;
  prevReps: number | null;
}

export interface TreinoExercise {
  id: string;
  dbId: string | null; // UUID do banco, null se mock
  name: string;
  equipment: string;
  muscleGroup: string;
  setType: 'normal' | 'dropset' | 'tempo' | 'failure';
  restSeconds: number;
  tempoPerRep: number | null; // só para tipo 'tempo'
  sets: TreinoSet[];
}

interface TreinoState {
  // Treino ativo
  treinoIniciado: boolean;
  inicioTimestamp: number | null;
  workoutName: string;
  workoutLogId: string | null;
  exercises: TreinoExercise[];
  exercicioAtual: number;
  trustScore: number;

  // Ações
  carregarTreino: (name: string, exercises: TreinoExercise[]) => void;
  iniciarTreino: () => void;
  setWorkoutLogId: (id: string) => void;
  toggleSerie: (exerciseIdx: number, setIdx: number) => void;
  updateSerieWeight: (exerciseIdx: number, setIdx: number, weight: number | null) => void;
  updateSerieReps: (exerciseIdx: number, setIdx: number, reps: number | null) => void;
  setExercicioAtual: (idx: number) => void;
  setTrustScore: (score: number) => void;
  resetTreino: () => void;

  // Derivados
  getSeriesConcluidas: () => number;
  getSeriesTotais: () => number;
  getPontos: () => number;
  getExerciseStatus: (exerciseIdx: number) => 'pending' | 'partial' | 'complete';
  podeMarcarSerie: (exerciseIdx: number, setType: string) => { pode: boolean; aguardar: number };
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useTreinoStore = create<TreinoState>((set, get) => ({
  treinoIniciado: false,
  inicioTimestamp: null,
  workoutName: '',
  workoutLogId: null,
  exercises: [],
  exercicioAtual: 0,
  trustScore: 80,

  carregarTreino: (name, exercises) => set({
    workoutName: name,
    exercises,
    treinoIniciado: false,
    inicioTimestamp: null,
    workoutLogId: null,
    exercicioAtual: 0,
  }),

  iniciarTreino: () => set({
    treinoIniciado: true,
    inicioTimestamp: Date.now(),
  }),

  setWorkoutLogId: (id) => set({ workoutLogId: id }),
  setTrustScore: (score) => set({ trustScore: score }),

  toggleSerie: (exerciseIdx, setIdx) => {
    const state = get();
    const ex = state.exercises[exerciseIdx];
    if (!ex) return;
    const s = ex.sets[setIdx];
    if (!s) return;

    // Anti-fraude: mínimo 20s entre séries
    if (!s.completed) {
      const lastCompleted = ex.sets
        .filter(ss => ss.completed && ss.completedAt)
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0];
      if (lastCompleted && Date.now() - (lastCompleted.completedAt ?? 0) < 20000) {
        return; // bloqueia
      }
    }

    const newExercises = [...state.exercises];
    const newSets = [...newExercises[exerciseIdx].sets];
    newSets[setIdx] = {
      ...s,
      completed: !s.completed,
      completedAt: !s.completed ? Date.now() : null,
    };
    newExercises[exerciseIdx] = { ...newExercises[exerciseIdx], sets: newSets };
    set({ exercises: newExercises });
  },

  updateSerieWeight: (exerciseIdx, setIdx, weight) => {
    const clamped = weight !== null ? Math.min(Math.max(weight, 0), 500) : null;
    const newExercises = [...get().exercises];
    const newSets = [...newExercises[exerciseIdx].sets];
    newSets[setIdx] = { ...newSets[setIdx], weight: clamped };
    newExercises[exerciseIdx] = { ...newExercises[exerciseIdx], sets: newSets };
    set({ exercises: newExercises });
  },

  updateSerieReps: (exerciseIdx, setIdx, reps) => {
    const clamped = reps !== null ? Math.min(Math.max(reps, 0), 100) : null;
    const newExercises = [...get().exercises];
    const newSets = [...newExercises[exerciseIdx].sets];
    newSets[setIdx] = { ...newSets[setIdx], reps: clamped };
    newExercises[exerciseIdx] = { ...newExercises[exerciseIdx], sets: newSets };
    set({ exercises: newExercises });
  },

  setExercicioAtual: (idx) => set({ exercicioAtual: idx }),

  resetTreino: () => set({
    treinoIniciado: false,
    inicioTimestamp: null,
    workoutName: '',
    workoutLogId: null,
    exercises: [],
    exercicioAtual: 0,
    trustScore: 80,
  }),

  getSeriesConcluidas: () =>
    get().exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0),

  getSeriesTotais: () =>
    get().exercises.reduce((sum, ex) => sum + ex.sets.length, 0),

  getPontos: () => {
    const state = get();
    let pts = 0;
    state.exercises.forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed).length;
      pts += completedSets * 15;
      if (completedSets === ex.sets.length && ex.sets.length > 0) pts += 50;
    });
    const allDone = state.exercises.every(ex => ex.sets.every(s => s.completed));
    if (allDone && state.exercises.length > 0) pts += 200;
    return pts;
  },

  getExerciseStatus: (exerciseIdx) => {
    const ex = get().exercises[exerciseIdx];
    if (!ex) return 'pending';
    const done = ex.sets.filter(s => s.completed).length;
    if (done === 0) return 'pending';
    if (done === ex.sets.length) return 'complete';
    return 'partial';
  },

  podeMarcarSerie: (exerciseIdx, setType) => {
    const MIN_SEC: Record<string, number> = { normal: 20, dropset: 8, tempo: 30, failure: 25 };
    const state = get();
    let minMs = (MIN_SEC[setType] ?? 20) * 1000;

    // Trust score penalty
    if (state.trustScore < 70) minMs = Math.round(minMs * 1.5);
    if (state.trustScore < 30) return { pode: false, aguardar: 0 };

    // Find last completed set across ALL exercises in this workout
    let lastCompletedAt = 0;
    state.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed && s.completedAt && s.completedAt > lastCompletedAt) {
          lastCompletedAt = s.completedAt;
        }
      });
    });

    if (lastCompletedAt === 0) return { pode: true, aguardar: 0 };

    const elapsed = Date.now() - lastCompletedAt;
    if (elapsed >= minMs) return { pode: true, aguardar: 0 };

    return { pode: false, aguardar: Math.ceil((minMs - elapsed) / 1000) };
  },
}));
