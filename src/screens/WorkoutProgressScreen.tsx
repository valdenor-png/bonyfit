import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeeklyVolume {
  label: string;
  volume: number;
}

interface ExerciseProgressionEntry {
  date: string;
  maxWeight: number;
}

interface MuscleDistribution {
  muscle: string;
  sets: number;
}

interface StatsData {
  totalWorkouts: number;
  totalVolume: number;
  avgDuration: number;
  workoutsPerWeek: number;
  weeklyVolumes: WeeklyVolume[];
  exerciseNames: string[];
  exerciseProgression: Record<string, ExerciseProgressionEntry[]>;
  muscleDistribution: MuscleDistribution[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function createMockStats(): StatsData {
  const weeklyVolumes: WeeklyVolume[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weeklyVolumes.push({
      label: `S${8 - i}`,
      volume: 3000 + Math.floor(Math.random() * 5000),
    });
  }

  const exerciseNames = ['Supino Reto', 'Agachamento', 'Puxada Frontal', 'Desenvolvimento', 'Rosca Direta'];
  const exerciseProgression: Record<string, ExerciseProgressionEntry[]> = {};
  for (const name of exerciseNames) {
    const entries: ExerciseProgressionEntry[] = [];
    let baseWeight = name === 'Agachamento' ? 80 : name === 'Supino Reto' ? 60 : 30;
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 3);
      entries.push({
        date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        maxWeight: baseWeight + Math.floor(Math.random() * 10),
      });
    }
    exerciseProgression[name] = entries;
  }

  return {
    totalWorkouts: 47,
    totalVolume: 128500,
    avgDuration: 52,
    workoutsPerWeek: 3.8,
    weeklyVolumes,
    exerciseNames,
    exerciseProgression,
    muscleDistribution: [
      { muscle: 'Peito', sets: 18 },
      { muscle: 'Costas', sets: 16 },
      { muscle: 'Perna', sets: 14 },
      { muscle: 'Ombro', sets: 10 },
      { muscle: 'Bíceps', sets: 8 },
      { muscle: 'Tríceps', sets: 8 },
      { muscle: 'Abdômen', sets: 4 },
    ],
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface WorkoutProgressScreenProps {
  navigation?: any;
}

export default function WorkoutProgressScreen({ navigation }: WorkoutProgressScreenProps) {
  const [stats, setStats] = useState<StatsData>(createMockStats);
  const [selectedExercise, setSelectedExercise] = useState('Supino Reto');
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);

  // Derive max values for bar chart scaling
  const maxWeeklyVolume = Math.max(...stats.weeklyVolumes.map((w) => w.volume), 1);
  const maxMuscleSets = Math.max(...stats.muscleDistribution.map((m) => m.sets), 1);
  const currentProgression = stats.exerciseProgression[selectedExercise] ?? [];
  const maxProgWeight = Math.max(...currentProgression.map((p) => p.maxWeight), 1);

  // ---- render helpers ----
  const renderStatCard = (label: string, value: string) => (
    <View style={styles.statCard} key={label}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  // ---- main render ----
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.screenTitle}>Progresso</Text>

        {/* Stats cards grid */}
        <View style={styles.statsGrid}>
          {renderStatCard('Total treinos', String(stats.totalWorkouts))}
          {renderStatCard('Volume total', `${(stats.totalVolume / 1000).toFixed(1)}t`)}
          {renderStatCard('Média duração', `${stats.avgDuration}min`)}
          {renderStatCard('Treinos/semana', stats.workoutsPerWeek.toFixed(1))}
        </View>

        {/* ---- Weekly volume bar chart ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume semanal</Text>
          <View style={styles.barChartContainer}>
            {stats.weeklyVolumes.map((week, idx) => {
              const heightPct = (week.volume / maxWeeklyVolume) * 100;
              return (
                <View style={styles.barColumn} key={idx}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${Math.max(heightPct, 4)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{week.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ---- Exercise progression ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progressão por exercício</Text>

          {/* Exercise picker */}
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setExercisePickerOpen(!exercisePickerOpen)}
          >
            <Text style={styles.pickerText}>{selectedExercise}</Text>
            <Text style={styles.pickerArrow}>{exercisePickerOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {exercisePickerOpen && (
            <View style={styles.pickerDropdown}>
              {stats.exerciseNames.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.pickerOption}
                  onPress={() => {
                    setSelectedExercise(name);
                    setExercisePickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      name === selectedExercise && styles.pickerOptionSelected,
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Horizontal bars for weight progression */}
          <View style={styles.progressionList}>
            {currentProgression.map((entry, idx) => {
              const widthPct = (entry.maxWeight / maxProgWeight) * 100;
              return (
                <View style={styles.progressionRow} key={idx}>
                  <Text style={styles.progressionDate}>{entry.date}</Text>
                  <View style={styles.progressionBarTrack}>
                    <View
                      style={[
                        styles.progressionBarFill,
                        { width: `${Math.max(widthPct, 5)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressionWeight}>{entry.maxWeight}kg</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ---- Muscle distribution ---- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribuição muscular</Text>
          <Text style={styles.sectionSubtitle}>Últimos 7 dias</Text>

          {stats.muscleDistribution.map((item) => {
            const widthPct = (item.sets / maxMuscleSets) * 100;
            return (
              <View style={styles.muscleRow} key={item.muscle}>
                <Text style={styles.muscleName}>{item.muscle}</Text>
                <View style={styles.muscleBarTrack}>
                  <View
                    style={[
                      styles.muscleBarFill,
                      { width: `${Math.max(widthPct, 3)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.muscleSets}>{item.sets}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BAR_CHART_HEIGHT = 150;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
  screenTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    marginBottom: spacing.lg,
  },

  // ---- stats grid ----
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '47%',
    flexGrow: 1,
  },
  statValue: {
    color: colors.text,
    fontFamily: fonts.numbersExtraBold,
    fontSize: 26,
  },
  statLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
  },

  // ---- section ----
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },

  // ---- bar chart (weekly volume) ----
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_CHART_HEIGHT,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xl,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '60%',
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: colors.orange,
    borderRadius: 4,
    width: '100%',
    minHeight: 4,
  },
  barLabel: {
    color: colors.textMuted,
    fontFamily: fonts.numbersBold,
    fontSize: 10,
    marginTop: spacing.xs,
    position: 'absolute',
    bottom: -16,
  },

  // ---- exercise picker ----
  picker: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pickerText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  pickerArrow: {
    color: colors.textMuted,
    fontSize: 12,
  },
  pickerDropdown: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  pickerOptionText: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  pickerOptionSelected: {
    color: colors.orange,
    fontFamily: fonts.bodyBold,
  },

  // ---- exercise progression bars ----
  progressionList: {
    gap: spacing.sm,
  },
  progressionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressionDate: {
    width: 44,
    color: colors.textMuted,
    fontFamily: fonts.numbersBold,
    fontSize: 11,
  },
  progressionBarTrack: {
    flex: 1,
    height: 18,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  progressionBarFill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: 4,
    minWidth: 4,
  },
  progressionWeight: {
    width: 44,
    color: colors.text,
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    textAlign: 'right',
  },

  // ---- muscle distribution ----
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  muscleName: {
    width: 70,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  muscleBarTrack: {
    flex: 1,
    height: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  muscleBarFill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: 4,
    minWidth: 4,
  },
  muscleSets: {
    width: 28,
    color: colors.text,
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    textAlign: 'right',
  },
});
