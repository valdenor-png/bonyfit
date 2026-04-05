import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { supabase } from '../services/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkoutLogEntry {
  id: string;
  name: string;
  date: string; // ISO
  durationMinutes: number;
  volumeKg: number;
  points: number;
  exercises: {
    name: string;
    sets: { weight: number; reps: number }[];
  }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function createMockHistory(): WorkoutLogEntry[] {
  const today = new Date();
  const entries: WorkoutLogEntry[] = [];
  const names = ['Treino A - Peito', 'Treino B - Costas', 'Treino C - Perna'];

  for (let i = 0; i < 12; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 2 - 1);
    entries.push({
      id: String(i),
      name: names[i % 3],
      date: d.toISOString(),
      durationMinutes: 40 + Math.floor(Math.random() * 30),
      volumeKg: 2000 + Math.floor(Math.random() * 3000),
      points: 300 + Math.floor(Math.random() * 200),
      exercises: [
        {
          name: i % 3 === 0 ? 'Supino Reto' : i % 3 === 1 ? 'Puxada Frontal' : 'Agachamento',
          sets: [
            { weight: 60, reps: 12 },
            { weight: 60, reps: 10 },
            { weight: 65, reps: 8 },
          ],
        },
        {
          name: i % 3 === 0 ? 'Crucifixo' : i % 3 === 1 ? 'Remada Curvada' : 'Leg Press',
          sets: [
            { weight: 16, reps: 12 },
            { weight: 18, reps: 10 },
          ],
        },
      ],
    });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface WorkoutHistoryScreenProps {
  navigation?: any;
}

export default function WorkoutHistoryScreen({ navigation }: WorkoutHistoryScreenProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [workouts, setWorkouts] = useState<WorkoutLogEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('workout_logs_v2')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data || data.length === 0) {
        setWorkouts(createMockHistory());
      } else {
        setWorkouts(data as WorkoutLogEntry[]);
      }
    } catch {
      setWorkouts(createMockHistory());
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkouts();
    setRefreshing(false);
  }, []);

  // ---- calendar helpers ----
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  const workoutDates = new Set(
    workouts.map((w) => {
      const d = new Date(w.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );

  const hasWorkout = (day: number) =>
    workoutDates.has(`${currentYear}-${currentMonth}-${day}`);

  const isToday = (day: number) =>
    isSameDay(new Date(currentYear, currentMonth, day), today);

  const navigateMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedDay(null);
  };

  // ---- filter workouts for display ----
  const displayedWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return false;
    if (selectedDay !== null && d.getDate() !== selectedDay) return false;
    return true;
  });

  // ---- render calendar ----
  const renderCalendar = () => {
    const cells: React.ReactNode[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View style={styles.calendarCell} key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const hasDot = hasWorkout(day);
      const todayBorder = isToday(day);
      const isSelected = selectedDay === day;

      cells.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarCell,
            todayBorder && styles.calendarCellToday,
            isSelected && styles.calendarCellSelected,
          ]}
          onPress={() => setSelectedDay(selectedDay === day ? null : day)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
            ]}
          >
            {day}
          </Text>
          {hasDot && <View style={styles.calendarDot} />}
        </TouchableOpacity>,
      );
    }

    return cells;
  };

  // ---- render workout card ----
  const renderWorkoutCard = (workout: WorkoutLogEntry) => {
    const isExpanded = expandedId === workout.id;
    return (
      <TouchableOpacity
        key={workout.id}
        style={styles.workoutCard}
        onPress={() => setExpandedId(isExpanded ? null : workout.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.workoutName}>{workout.name}</Text>
        <Text style={styles.workoutDate}>
          {formatDate(workout.date)} · {formatTime(workout.date)}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text style={styles.statItem}>⏱ {workout.durationMinutes}min</Text>
          <Text style={styles.statItem}>🏋 {workout.volumeKg.toLocaleString()}kg</Text>
          <Text style={styles.statItemPoints}>+{workout.points} pts</Text>
        </View>

        {/* Expanded: exercise details */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            {workout.exercises.map((ex, idx) => (
              <View key={idx} style={styles.expandedExercise}>
                <Text style={styles.expandedExName}>{ex.name}</Text>
                {ex.sets.map((s, si) => (
                  <Text key={si} style={styles.expandedSet}>
                    Série {si + 1}: {s.weight}kg × {s.reps}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ---- main render ----
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.orange}
            colors={[colors.orange]}
          />
        }
      >
        {/* Month header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => navigateMonth(-1)}>
            <Text style={styles.monthArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS_PT[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth(1)}>
            <Text style={styles.monthArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={styles.dayLabelsRow}>
          {DAYS_PT.map((d) => (
            <View style={styles.calendarCell} key={d}>
              <Text style={styles.dayLabel}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>{renderCalendar()}</View>

        {/* Workout list */}
        <View style={styles.workoutsList}>
          {displayedWorkouts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedDay !== null
                  ? 'Nenhum treino neste dia'
                  : 'Nenhum treino neste mês'}
              </Text>
            </View>
          ) : (
            displayedWorkouts.map(renderWorkoutCard)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ---- month header ----
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  monthArrow: {
    color: colors.orange,
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    paddingHorizontal: spacing.sm,
  },
  monthTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
  },

  // ---- day labels ----
  dayLabelsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  dayLabel: {
    color: colors.textMuted,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textAlign: 'center',
  },

  // ---- calendar grid ----
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  calendarCellToday: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: radius.sm,
  },
  calendarCellSelected: {
    backgroundColor: 'rgba(242,101,34,0.2)',
    borderRadius: radius.sm,
  },
  calendarDayText: {
    color: colors.textSecondary,
    fontFamily: fonts.numbersBold,
    fontSize: 13,
  },
  calendarDayTextSelected: {
    color: colors.text,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.orange,
    marginTop: 2,
  },

  // ---- workouts list ----
  workoutsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  workoutCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  workoutName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  workoutDate: {
    color: colors.textSecondary,
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  statItem: {
    color: colors.textSecondary,
    fontFamily: fonts.numbersBold,
    fontSize: 12,
  },
  statItemPoints: {
    color: colors.orange,
    fontFamily: fonts.numbersBold,
    fontSize: 12,
  },

  // ---- expanded ----
  expandedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  expandedExercise: {
    marginBottom: spacing.sm,
  },
  expandedExName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    marginBottom: 2,
  },
  expandedSet: {
    color: colors.textMuted,
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    marginLeft: spacing.md,
  },

  // ---- empty ----
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
  },
});
