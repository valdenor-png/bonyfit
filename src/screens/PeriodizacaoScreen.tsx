import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

// ─── TYPES ──────────────────────────────────────────────
type PhaseName = 'Volume' | 'Intensificação' | 'Deload' | 'Teste';

interface Phase {
  name: PhaseName;
  color: string;
  weeks: number[];
  description: string;
  series: string;
  reps: string;
  intensity: string;
}

// ─── PHASE DATA ─────────────────────────────────────────
const PHASES: Phase[] = [
  {
    name: 'Volume',
    color: colors.info,
    weeks: [1, 2, 3, 4],
    description: 'Foco em volume. Séries: 4-5. Reps: 10-15. Intensidade: 65-75%',
    series: '4-5',
    reps: '10-15',
    intensity: '65-75%',
  },
  {
    name: 'Intensificação',
    color: colors.orange,
    weeks: [5, 6, 7, 8],
    description: 'Foco em carga. Séries: 3-4. Reps: 6-8. Intensidade: 80-90%',
    series: '3-4',
    reps: '6-8',
    intensity: '80-90%',
  },
  {
    name: 'Deload',
    color: colors.success,
    weeks: [9, 10],
    description: 'Recuperação. Séries: 2-3. Reps: 12-15. Intensidade: 50-60%',
    series: '2-3',
    reps: '12-15',
    intensity: '50-60%',
  },
  {
    name: 'Teste',
    color: '#9B59B6',
    weeks: [11, 12],
    description: 'Testes de 1RM. Séries: 1-3. Reps: 1-3. Intensidade: 95-100%',
    series: '1-3',
    reps: '1-3',
    intensity: '95-100%',
  },
];

const CURRENT_WEEK = 5;
const TOTAL_WEEKS = 12;

const getPhaseForWeek = (week: number): Phase => {
  return PHASES.find((p) => p.weeks.includes(week))!;
};

// ─── COMPONENT ──────────────────────────────────────────
interface Props {
  navigation: any;
}

export default function PeriodizacaoScreen({ navigation }: Props) {
  const [expandedPhase, setExpandedPhase] = useState<PhaseName | null>(null);
  const currentPhase = getPhaseForWeek(CURRENT_WEEK);
  const weeksRemaining = currentPhase.weeks[currentPhase.weeks.length - 1] - CURRENT_WEEK;

  const togglePhase = (name: PhaseName) => {
    setExpandedPhase(expandedPhase === name ? null : name);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>{'←'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Periodização</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Current Phase Card */}
        <View style={[styles.currentPhaseCard, { borderLeftColor: currentPhase.color }]}>
          <View style={styles.currentPhaseHeader}>
            <View style={[styles.phaseBadge, { backgroundColor: currentPhase.color }]}>
              <Text style={styles.phaseBadgeText}>{currentPhase.name}</Text>
            </View>
            <Text style={styles.weekBadge}>Semana {CURRENT_WEEK}/{TOTAL_WEEKS}</Text>
          </View>
          <Text style={styles.currentPhaseDescription}>{currentPhase.description}</Text>
          <Text style={styles.weeksRemaining}>
            {weeksRemaining > 0
              ? `${weeksRemaining} semana${weeksRemaining > 1 ? 's' : ''} restante${weeksRemaining > 1 ? 's' : ''} nesta fase`
              : 'Última semana desta fase'}
          </Text>
        </View>

        {/* Calendar Grid */}
        <Text style={styles.sectionTitle}>Visão geral do mesociclo</Text>
        <View style={styles.calendarGrid}>
          {Array.from({ length: 3 }, (_, rowIndex) => (
            <View key={rowIndex} style={styles.calendarRow}>
              {Array.from({ length: 4 }, (_, colIndex) => {
                const week = rowIndex * 4 + colIndex + 1;
                const phase = getPhaseForWeek(week);
                const isCurrent = week === CURRENT_WEEK;
                const isPast = week < CURRENT_WEEK;

                return (
                  <View
                    key={week}
                    style={[
                      styles.calendarCell,
                      { backgroundColor: phase.color + '20' },
                      isCurrent && styles.currentWeekCell,
                      isPast && styles.pastWeekCell,
                    ]}
                  >
                    <View style={[styles.cellDot, { backgroundColor: phase.color }]} />
                    <Text
                      style={[
                        styles.cellWeekNumber,
                        isCurrent && styles.currentWeekNumber,
                      ]}
                    >
                      S{week}
                    </Text>
                    {isCurrent && (
                      <View style={styles.atualBadge}>
                        <Text style={styles.atualText}>ATUAL</Text>
                      </View>
                    )}
                    {isPast && <View style={styles.pastOverlay} />}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Phase Legend */}
        <View style={styles.legendContainer}>
          {PHASES.map((phase) => (
            <View key={phase.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: phase.color }]} />
              <Text style={styles.legendText}>{phase.name}</Text>
            </View>
          ))}
        </View>

        {/* Phase Details */}
        <Text style={styles.sectionTitle}>Detalhes das fases</Text>
        {PHASES.map((phase) => {
          const isExpanded = expandedPhase === phase.name;
          return (
            <TouchableOpacity
              key={phase.name}
              style={[styles.phaseDetailCard, { borderLeftColor: phase.color }]}
              onPress={() => togglePhase(phase.name)}
              activeOpacity={0.7}
            >
              <View style={styles.phaseDetailHeader}>
                <View style={[styles.phaseDetailDot, { backgroundColor: phase.color }]} />
                <Text style={styles.phaseDetailName}>{phase.name}</Text>
                <Text style={styles.phaseDetailWeeks}>
                  Semanas {phase.weeks[0]}-{phase.weeks[phase.weeks.length - 1]}
                </Text>
                <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
              </View>
              {isExpanded && (
                <View style={styles.phaseDetailContent}>
                  <Text style={styles.phaseDetailDescription}>{phase.description}</Text>
                  <View style={styles.phaseStats}>
                    <View style={styles.phaseStat}>
                      <Text style={styles.phaseStatLabel}>Séries</Text>
                      <Text style={[styles.phaseStatValue, { color: phase.color }]}>
                        {phase.series}
                      </Text>
                    </View>
                    <View style={styles.phaseStat}>
                      <Text style={styles.phaseStatLabel}>Reps</Text>
                      <Text style={[styles.phaseStatValue, { color: phase.color }]}>
                        {phase.reps}
                      </Text>
                    </View>
                    <View style={styles.phaseStat}>
                      <Text style={styles.phaseStatLabel}>Intensidade</Text>
                      <Text style={[styles.phaseStatValue, { color: phase.color }]}>
                        {phase.intensity}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.text,
  },

  // Current Phase Card
  currentPhaseCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
  },
  currentPhaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  phaseBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  phaseBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  weekBadge: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  currentPhaseDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  weeksRemaining: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.orange,
  },

  // Section title
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },

  // Calendar Grid
  calendarGrid: {
    marginBottom: spacing.xl,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs / 2,
    position: 'relative',
  },
  currentWeekCell: {
    borderWidth: 2,
    borderColor: colors.orange,
  },
  pastWeekCell: {
    opacity: 0.5,
  },
  cellDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.xs,
  },
  cellWeekNumber: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.text,
  },
  currentWeekNumber: {
    color: colors.orange,
  },
  atualBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: colors.orange,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  atualText: {
    fontFamily: fonts.bodyBold,
    fontSize: 7,
    color: '#FFFFFF',
  },
  pastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Legend
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  legendText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Phase Details
  phaseDetailCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
  },
  phaseDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseDetailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  phaseDetailName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  phaseDetailWeeks: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  expandIcon: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.textMuted,
  },
  phaseDetailContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.elevated,
  },
  phaseDetailDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  phaseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  phaseStat: {
    alignItems: 'center',
  },
  phaseStatLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  phaseStatValue: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 18,
  },
});
