import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import ScreenBackground from '../components/ScreenBackground';
import { useAuth } from '../hooks/useAuth';
import { useVip } from '../hooks/useVip';
import { fetchPlanoAluno } from '../services/personal';
import type { WorkoutPlan } from '../types/workout';

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const TODAY = new Date();

interface TodayWorkout {
  name: string;
  exercises: number;
  duration: number;
  muscles: string[];
}

const MOCK_TODAY_WORKOUT: TodayWorkout | null = {
  name: 'Treino A — Peito + Tríceps',
  exercises: 6,
  duration: 45,
  muscles: ['Peito', 'Tríceps'],
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function TrainingScreen({ navigation }: { navigation: any }) {
  const todayWorkout = MOCK_TODAY_WORKOUT;
  const { user } = useAuth();
  const { isVip } = useVip(user?.id);
  const [personalPlan, setPersonalPlan] = useState<WorkoutPlan | null>(null);
  const [hasPersonal, setHasPersonal] = useState(false);
  const [personalNome, setPersonalNome] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchPlanoAluno(user.id)
        .then((plan) => {
          if (plan) setPersonalPlan(plan as WorkoutPlan);
        })
        .catch(() => {});

      // Check if VIP user has a personal assigned
      if (isVip) {
        import('../services/supabase').then(({ supabase }) => {
          supabase
            .from('personal_alunos')
            .select('personal:personal_id(name)')
            .eq('aluno_id', user.id)
            .eq('status', 'ativo')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
            .then(({ data }) => {
              if (data?.personal) {
                setHasPersonal(true);
                setPersonalNome((data.personal as any).name || '');
              }
            })
            .then(() => {});
        });
      }
    }
  }, [user?.id, isVip]);

  return (
    <ScreenBackground variant="treino">
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── SECTION 1: Header + Agenda button ──────────────────────── */}
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Meus Treinos</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Calendar')}
          activeOpacity={0.7}
        >
          <View style={[styles.headerBtnIcon, styles.headerBtnIconActive]}>
            <Text style={{ fontSize: 20 }}>📅</Text>
          </View>
          <Text style={styles.headerBtnLabel}>Agenda</Text>
        </TouchableOpacity>
      </View>

      {/* ── VIP Banner ──────────────────────────────────────────────────── */}
      {isVip && !hasPersonal && (
        <TouchableOpacity
          style={styles.vipBanner}
          onPress={() => navigation.navigate('EscolherPersonal')}
          activeOpacity={0.7}
        >
          <Text style={styles.vipBannerText}>
            {'\uD83D\uDC8E'} VIP — Escolha seu personal exclusivo
          </Text>
          <Text style={styles.vipBannerChevron}>{'\u203A'}</Text>
        </TouchableOpacity>
      )}

      {isVip && hasPersonal && personalNome ? (
        <View style={styles.vipPersonalInfo}>
          <Text style={styles.vipPersonalInfoText}>
            Seu personal: {personalNome}
          </Text>
        </View>
      ) : null}

      {/* ── Personal Plan Section ───────────────────────────────────────── */}
      {personalPlan && (
        <View style={styles.card}>
          <Text style={styles.todayLabel}>PLANO DO PERSONAL</Text>
          <Text style={styles.workoutName}>{personalPlan.nome}</Text>
          {personalPlan.personal && (
            <Text style={styles.workoutMeta}>
              Por {personalPlan.personal.name}
            </Text>
          )}

          {personalPlan.splits
            ?.sort((a, b) => a.ordem - b.ordem)
            .map((split) => (
              <TouchableOpacity
                key={split.id}
                style={styles.personalSplitCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ActiveWorkout')}
              >
                <View style={styles.personalSplitRow}>
                  <View style={styles.personalSplitBadge}>
                    <Text style={styles.personalSplitBadgeText}>{split.label}</Text>
                  </View>
                  <View style={styles.personalSplitInfo}>
                    <Text style={styles.personalSplitName}>{split.nome}</Text>
                    <Text style={styles.personalSplitMeta}>
                      {split.exercises?.length || 0} exercícios
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.personalStartBtn}
                    onPress={() => navigation.navigate('ActiveWorkout')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.personalStartBtnText}>Iniciar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
        </View>
      )}

      {/* ── SECTION 2: Today's workout card ─────────────────────────────── */}
      {!personalPlan && (
        <View style={styles.card}>
          {todayWorkout ? (
            <>
              <Text style={styles.todayLabel}>TREINO DE HOJE</Text>
              <Text style={styles.workoutName}>{todayWorkout.name}</Text>
              <Text style={styles.workoutMeta}>
                {todayWorkout.exercises} exercícios · ~{todayWorkout.duration} min
              </Text>
              <View style={styles.chipRow}>
                {todayWorkout.muscles.map((m) => (
                  <View key={m} style={styles.chip}>
                    <Text style={styles.chipText}>{m}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('ActiveWorkout')}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>Iniciar Treino</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.noWorkout}>
                Sem treino agendado pra hoje
              </Text>
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => navigation.navigate('ActiveWorkout')}
                activeOpacity={0.7}
              >
                <Text style={styles.outlineButtonText}>Iniciar Treino Vazio</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* ── Empty workout card ──────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.emptyWorkoutBtn}
        onPress={() => navigation.navigate('ActiveWorkout')}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyWorkoutPlus}>+</Text>
        <Text style={styles.emptyWorkoutText}>Iniciar Treinamento Vazio</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
    </ScreenBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
  },

  // Header row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // Header buttons
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerBtn: {
    alignItems: 'center',
  },
  headerBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIconActive: {
    backgroundColor: '#F26522',
  },
  headerBtnLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: '#FFFFFF',
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  // Today workout
  todayLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  workoutName: {
    fontSize: 17,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#888888',
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    backgroundColor: colors.orange + '26',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  startButton: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // No workout state
  noWorkout: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: '#888888',
    textAlign: 'center',
    marginBottom: spacing.md,
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
    color: '#FFFFFF',
  },

  // Empty workout card
  emptyWorkoutBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  emptyWorkoutPlus: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginRight: spacing.sm,
  },
  emptyWorkoutText: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
  },

  // Personal plan splits
  personalSplitCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  personalSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalSplitBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  personalSplitBadgeText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  personalSplitInfo: {
    flex: 1,
  },
  personalSplitName: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
  },
  personalSplitMeta: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#888888',
  },
  personalStartBtn: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  personalStartBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // VIP banner
  vipBanner: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vipBannerText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    flex: 1,
  },
  vipBannerChevron: {
    fontSize: 22,
    color: colors.orange,
    marginLeft: spacing.sm,
  },
  vipPersonalInfo: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  vipPersonalInfoText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: '#999999',
  },
});
