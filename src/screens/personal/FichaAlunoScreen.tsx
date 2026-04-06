import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { usePersonalStore } from '../../stores/personalStore';
import * as personalService from '../../services/personal';
import type { WorkoutPlan } from '../../types/workout';

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_ALUNO = {
  id: 'a1',
  name: 'Lucas Martins',
  avatar_url: null,
  level: 'Intermediário',
  total_points: 2450,
};

const MOCK_PLANO: WorkoutPlan = {
  id: 'p1',
  aluno_id: 'a1',
  personal_id: 'pers1',
  nome: 'Hipertrofia — Push/Pull/Legs',
  objetivo: 'Hipertrofia',
  data_inicio: '2026-03-01',
  status: 'ativo',
  personal: { name: 'João Personal', avatar_url: null },
  splits: [
    {
      id: 's1',
      plan_id: 'p1',
      label: 'A',
      nome: 'Peito e Tríceps',
      ordem: 0,
      exercises: [
        { id: 'e1', split_id: 's1', exercise_id: 'ex1', exercise: { id: 'ex1', name: 'Supino Reto', muscle_group: 'Peito', equipment: 'Barra', video_url: null, tips: null, min_time_seconds: 0, sets: 4, reps: 12, weight: 0, rest_seconds: 90 }, series: 4, repeticoes: '8-12', descanso_seg: 90, ordem: 0 },
        { id: 'e2', split_id: 's1', exercise_id: 'ex2', exercise: { id: 'ex2', name: 'Crucifixo Inclinado', muscle_group: 'Peito', equipment: 'Halter', video_url: null, tips: null, min_time_seconds: 0, sets: 3, reps: 12, weight: 0, rest_seconds: 60 }, series: 3, repeticoes: '12', descanso_seg: 60, ordem: 1 },
        { id: 'e3', split_id: 's1', exercise_id: 'ex3', exercise: { id: 'ex3', name: 'Tríceps Corda', muscle_group: 'Tríceps', equipment: 'Cabo', video_url: null, tips: null, min_time_seconds: 0, sets: 3, reps: 15, weight: 0, rest_seconds: 60 }, series: 3, repeticoes: '15', descanso_seg: 60, ordem: 2 },
      ],
    },
    {
      id: 's2',
      plan_id: 'p1',
      label: 'B',
      nome: 'Costas e Bíceps',
      ordem: 1,
      exercises: [
        { id: 'e4', split_id: 's2', exercise_id: 'ex4', exercise: { id: 'ex4', name: 'Puxada Frontal', muscle_group: 'Costas', equipment: 'Cabo', video_url: null, tips: null, min_time_seconds: 0, sets: 4, reps: 10, weight: 0, rest_seconds: 90 }, series: 4, repeticoes: '10-12', descanso_seg: 90, ordem: 0 },
        { id: 'e5', split_id: 's2', exercise_id: 'ex5', exercise: { id: 'ex5', name: 'Rosca Direta', muscle_group: 'Bíceps', equipment: 'Barra', video_url: null, tips: null, min_time_seconds: 0, sets: 3, reps: 12, weight: 0, rest_seconds: 60 }, series: 3, repeticoes: '12', descanso_seg: 60, ordem: 1 },
      ],
    },
    {
      id: 's3',
      plan_id: 'p1',
      label: 'C',
      nome: 'Pernas',
      ordem: 2,
      exercises: [
        { id: 'e6', split_id: 's3', exercise_id: 'ex6', exercise: { id: 'ex6', name: 'Agachamento Livre', muscle_group: 'Quadríceps', equipment: 'Barra', video_url: null, tips: null, min_time_seconds: 0, sets: 4, reps: 10, weight: 0, rest_seconds: 120 }, series: 4, repeticoes: '8-10', descanso_seg: 120, ordem: 0 },
        { id: 'e7', split_id: 's3', exercise_id: 'ex7', exercise: { id: 'ex7', name: 'Leg Press', muscle_group: 'Quadríceps', equipment: 'Máquina', video_url: null, tips: null, min_time_seconds: 0, sets: 3, reps: 12, weight: 0, rest_seconds: 90 }, series: 3, repeticoes: '12-15', descanso_seg: 90, ordem: 1 },
      ],
    },
  ],
};

const MOCK_TREINOS = [
  { id: 't1', name: 'Treino A — Peito e Tríceps', workout_date: '2026-04-04', duration_seconds: 3200, volume_total: 12500 },
  { id: 't2', name: 'Treino C — Pernas', workout_date: '2026-04-02', duration_seconds: 4100, volume_total: 18200 },
  { id: 't3', name: 'Treino B — Costas e Bíceps', workout_date: '2026-03-31', duration_seconds: 2900, volume_total: 9800 },
  { id: 't4', name: 'Treino A — Peito e Tríceps', workout_date: '2026-03-29', duration_seconds: 3400, volume_total: 13100 },
  { id: 't5', name: 'Treino C — Pernas', workout_date: '2026-03-27', duration_seconds: 3800, volume_total: 17500 },
];

const MOCK_AVALIACOES = [
  { id: 'av1', data: '2026-03-15', peso: 78.5, gordura_corporal: 18.2 },
  { id: 'av2', data: '2026-02-15', peso: 79.1, gordura_corporal: 19.0 },
  { id: 'av3', data: '2026-01-15', peso: 80.0, gordura_corporal: 20.1 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getLevelColor(level: string): string {
  switch (level) {
    case 'Iniciante': return colors.success;
    case 'Intermediário': return colors.warning;
    case 'Avançado': return colors.danger;
    default: return colors.textMuted;
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

function formatVolume(vol: number): string {
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}t`;
  return `${vol} kg`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function FichaAlunoScreen({ route, navigation }: { route: any; navigation: any }) {
  const { alunoId } = route.params;
  const { alunoAtual, loading, fetchAlunoDetalhe } = usePersonalStore();
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    fetchAlunoDetalhe(alunoId).then(() => {
      const state = usePersonalStore.getState().alunoAtual;
      if (!state.aluno) setUseMock(true);
    });
  }, [alunoId]);

  const aluno = useMock ? MOCK_ALUNO : alunoAtual.aluno?.aluno || MOCK_ALUNO;
  const plano = useMock ? MOCK_PLANO : alunoAtual.plano;
  const treinos = useMock ? MOCK_TREINOS : alunoAtual.ultimosTreinos;
  const avaliacoes = useMock ? MOCK_AVALIACOES : alunoAtual.avaliacoes;

  const levelColor = getLevelColor(aluno.level);

  if (loading && !useMock) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Header: Avatar + Info ────────────────────────────────── */}
      <View style={styles.profileRow}>
        <View style={[styles.avatar, { borderColor: levelColor }]}>
          <Text style={styles.avatarText}>{getInitials(aluno.name)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.nameText}>{aluno.name}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor + '26' }]}>
              <Text style={[styles.levelText, { color: levelColor }]}>{aluno.level}</Text>
            </View>
            <Text style={styles.pointsText}>{aluno.total_points.toLocaleString()} pts</Text>
          </View>
        </View>
      </View>

      {/* ── Treino Atual ─────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Treino Atual</Text>
      {plano ? (
        <View style={styles.planCard}>
          <Text style={styles.planName}>{plano.nome}</Text>
          <Text style={styles.planObjective}>{plano.objetivo}</Text>

          {plano.splits
            .sort((a, b) => a.ordem - b.ordem)
            .map((split) => (
              <View key={split.id} style={styles.splitCard}>
                <View style={styles.splitHeader}>
                  <View style={styles.splitLabel}>
                    <Text style={styles.splitLabelText}>{split.label}</Text>
                  </View>
                  <Text style={styles.splitName}>{split.nome}</Text>
                  <Text style={styles.splitExCount}>{split.exercises.length} ex.</Text>
                </View>
                {split.exercises
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((ex) => (
                    <View key={ex.id} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                      <Text style={styles.exerciseDetail}>
                        {ex.series}x{ex.repeticoes} — {ex.descanso_seg}s
                      </Text>
                    </View>
                  ))}
              </View>
            ))}
        </View>
      ) : (
        <View style={styles.emptyPlanCard}>
          <Text style={styles.emptyPlanText}>Sem treino atribuído</Text>
        </View>
      )}

      {/* ── Últimos Treinos ──────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Últimos Treinos</Text>
      {treinos.length > 0 ? (
        treinos.map((t: any) => (
          <View key={t.id} style={styles.treinoRow}>
            <View style={styles.treinoInfo}>
              <Text style={styles.treinoName} numberOfLines={1}>{t.name}</Text>
              <Text style={styles.treinoDate}>{formatDate(t.workout_date)}</Text>
            </View>
            <View style={styles.treinoStats}>
              <Text style={styles.treinoStat}>{formatVolume(t.volume_total)}</Text>
              <Text style={styles.treinoStatSep}>·</Text>
              <Text style={styles.treinoStat}>{formatDuration(t.duration_seconds)}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyListText}>Nenhum treino registrado</Text>
      )}

      {/* ── Avaliações ───────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Avaliações</Text>
      {avaliacoes.length > 0 ? (
        avaliacoes.map((av: any) => (
          <View key={av.id} style={styles.avalRow}>
            <Text style={styles.avalDate}>{formatDate(av.data)}</Text>
            <Text style={styles.avalValue}>{av.peso} kg</Text>
            <Text style={styles.avalValue}>{av.gordura_corporal}% BF</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyListText}>Nenhuma avaliação registrada</Text>
      )}

      {/* ── Action Buttons ───────────────────────────────────────── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('MontarTreino', {
              alunoId: aluno.id,
              alunoNome: aluno.name,
            })
          }
        >
          <Text style={styles.primaryButtonText}>Montar Treino</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert('Em breve', 'Funcionalidade de avaliação física em desenvolvimento.')
          }
        >
          <Text style={styles.outlineButtonText}>Nova Avaliação</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile header
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.elevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  profileInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginRight: spacing.md,
  },
  levelText: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
  },
  pointsText: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  // Plan
  planCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  planName: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  planObjective: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  // Splits
  splitCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  splitLabel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  splitLabelText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  splitName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  splitExCount: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 36,
  },
  exerciseName: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    flex: 1,
  },
  exerciseDetail: {
    fontSize: 12,
    fontFamily: fonts.numbers,
    color: colors.textMuted,
  },

  // Empty plan
  emptyPlanCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyPlanText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },

  // Treinos
  treinoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  treinoInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  treinoName: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  treinoDate: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  treinoStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  treinoStat: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.textSecondary,
  },
  treinoStatSep: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: 4,
  },

  // Avaliacoes
  avalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avalDate: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    flex: 1,
  },
  avalValue: {
    fontSize: 13,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    marginLeft: spacing.lg,
  },

  emptyListText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Actions
  actions: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
});
