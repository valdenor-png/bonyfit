import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const TODAY = new Date(2026, 3, 5); // April 5, 2026

interface ScheduledWorkout {
  id: string;
  name: string;
  date: Date;
  dayLabel: string;
  exercises: number;
  duration: number;
  muscles: string[];
  status: 'scheduled' | 'completed' | 'missed';
}

const MOCK_SCHEDULE: ScheduledWorkout[] = [
  { id: '1', name: 'Treino A — Peito e Tríceps', date: new Date(2026, 3, 1), dayLabel: 'Quarta', exercises: 6, duration: 50, muscles: ['Peito', 'Tríceps'], status: 'completed' },
  { id: '2', name: 'Treino B — Costas e Bíceps', date: new Date(2026, 3, 3), dayLabel: 'Sexta', exercises: 7, duration: 55, muscles: ['Costas', 'Bíceps'], status: 'completed' },
  { id: '3', name: 'Treino C — Pernas', date: new Date(2026, 3, 4), dayLabel: 'Sábado', exercises: 5, duration: 45, muscles: ['Quadríceps', 'Glúteos'], status: 'missed' },
  { id: '4', name: 'Treino A — Peito e Tríceps', date: new Date(2026, 3, 5), dayLabel: 'Domingo', exercises: 6, duration: 45, muscles: ['Peito', 'Tríceps'], status: 'scheduled' },
  { id: '5', name: 'Treino B — Costas e Bíceps', date: new Date(2026, 3, 8), dayLabel: 'Quarta', exercises: 7, duration: 55, muscles: ['Costas', 'Bíceps'], status: 'scheduled' },
  { id: '6', name: 'Treino C — Pernas', date: new Date(2026, 3, 11), dayLabel: 'Sábado', exercises: 5, duration: 45, muscles: ['Quadríceps', 'Glúteos'], status: 'scheduled' },
  { id: '7', name: 'Treino A — Peito e Tríceps', date: new Date(2026, 3, 15), dayLabel: 'Quarta', exercises: 6, duration: 50, muscles: ['Peito', 'Tríceps'], status: 'scheduled' },
  { id: '8', name: 'Treino D — Ombro e Abdômen', date: new Date(2026, 3, 22), dayLabel: 'Quarta', exercises: 8, duration: 60, muscles: ['Ombro', 'Abdômen'], status: 'scheduled' },
];

const MOCK_ROUTINES = [
  { id: '1', name: 'Push Pull Legs', exercises: ['Supino Reto', 'Desenvolvimento', 'Tríceps Corda'] },
  { id: '2', name: 'Upper Lower', exercises: ['Supino Inclinado', 'Remada Curvada', 'Rosca Direta'] },
  { id: '3', name: 'Full Body', exercises: ['Agachamento', 'Supino Reto', 'Barra Fixa'] },
];

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function TrainingScreen({ navigation }: { navigation: any }) {
  const [calendarMonth, setCalendarMonth] = useState(TODAY.getMonth());
  const [calendarYear, setCalendarYear] = useState(TODAY.getFullYear());

  const todayWorkout = MOCK_SCHEDULE.find(
    (w) => isSameDay(w.date, TODAY) && w.status === 'scheduled',
  );

  // Calendar data
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const workoutsThisMonth = MOCK_SCHEDULE.filter(
    (w) => w.date.getMonth() === calendarMonth && w.date.getFullYear() === calendarYear,
  );

  function workoutForDay(day: number) {
    return workoutsThisMonth.find((w) => w.date.getDate() === day);
  }

  function prevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  }

  const statusColors: Record<string, string> = {
    scheduled: '#888888',
    completed: colors.success,
    missed: colors.danger,
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'Agendado',
    completed: 'Concluído',
    missed: 'Perdido',
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── SECTION 1: Header + Start Workout ─────────────────────────────── */}
      <Text style={styles.screenTitle}>Treino</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Treino de hoje</Text>
        {todayWorkout ? (
          <>
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
            >
              <Text style={styles.startButtonText}>Iniciar Treino</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noWorkout}>Nenhum treino agendado para hoje</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.emptyWorkoutBtn}
        onPress={() => navigation.navigate('ActiveWorkout')}
      >
        <Text style={styles.emptyWorkoutPlus}>+</Text>
        <Text style={styles.emptyWorkoutText}>Iniciar Treinamento Vazio</Text>
      </TouchableOpacity>

      {/* ── SECTION 2: Monthly Calendar ───────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Minha agenda</Text>

      <View style={styles.card}>
        {/* Month navigation */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[calendarMonth]} {calendarYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Weekday labels */}
        <View style={styles.weekRow}>
          {WEEKDAY_LABELS.map((d) => (
            <View key={d} style={styles.weekCell}>
              <Text style={styles.weekLabel}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Day cells */}
        <View style={styles.calendarGrid}>
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} style={styles.dayCell} />;
            }

            const isToday =
              calendarYear === TODAY.getFullYear() &&
              calendarMonth === TODAY.getMonth() &&
              day === TODAY.getDate();

            const workout = workoutForDay(day);
            const cellDate = new Date(calendarYear, calendarMonth, day);
            const isPast = cellDate < TODAY && !isToday;
            const isFuture = cellDate > TODAY;

            let dotColor: string | null = null;
            if (workout) {
              if (workout.status === 'completed') dotColor = colors.success;
              else if (workout.status === 'missed') dotColor = colors.danger;
              else dotColor = colors.orange;
            }

            return (
              <View key={`day-${day}`} style={styles.dayCell}>
                <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.dayTextToday,
                      isFuture && !workout && styles.dayTextFuture,
                      isPast && !workout && styles.dayTextPast,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {dotColor && <View style={[styles.dayDot, { backgroundColor: dotColor }]} />}
              </View>
            );
          })}
        </View>
      </View>

      {/* Scheduled workouts list */}
      {workoutsThisMonth.map((w) => (
        <View key={w.id} style={styles.scheduleCard}>
          <View style={styles.scheduleIcon}>
            <Text style={{ fontSize: 20 }}>🏋️</Text>
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleName}>{w.name}</Text>
            <Text style={styles.scheduleDate}>
              {w.dayLabel}, {w.date.getDate()}/{w.date.getMonth() + 1}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[w.status] + '22' }]}>
            <Text style={[styles.statusText, { color: statusColors[w.status] }]}>
              {statusLabels[w.status]}
            </Text>
          </View>
        </View>
      ))}

      {/* ── SECTION 3: Rotinas ────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Rotinas</Text>

      <View style={styles.routineGrid}>
        <TouchableOpacity
          style={styles.routineAction}
          onPress={() => navigation.navigate('Templates')}
        >
          <Text style={styles.routineActionIcon}>📋</Text>
          <Text style={styles.routineActionLabel}>Nova Rotina</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.routineAction}
          onPress={() => Alert.alert('Em breve', 'A funcionalidade de explorar rotinas estará disponível em breve.')}
        >
          <Text style={styles.routineActionIcon}>🔍</Text>
          <Text style={styles.routineActionLabel}>Explorar Rotinas</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subsectionTitle}>Minhas rotinas</Text>

      {MOCK_ROUTINES.map((r) => (
        <View key={r.id} style={styles.routineCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.routineName}>{r.name}</Text>
            <Text style={styles.routineExercises}>{r.exercises.join(' · ')}</Text>
          </View>
          <TouchableOpacity
            style={styles.routineStartBtn}
            onPress={() => navigation.navigate('ActiveWorkout')}
          >
            <Text style={styles.routineStartText}>Iniciar</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* ── BOTTOM: Como começar ──────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.tipCard}
        onPress={() =>
          Alert.alert(
            'Como começar',
            '1. Crie uma rotina com seus exercícios favoritos\n2. Agende treinos na sua agenda\n3. Toque em "Iniciar Treino" e registre séries, cargas e repetições\n4. Acompanhe seu progresso ao longo do tempo!',
          )
        }
      >
        <Text style={styles.tipText}>Como começar</Text>
        <Text style={styles.tipArrow}>→</Text>
      </TouchableOpacity>

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
    paddingTop: 60,
  },

  // Header
  screenTitle: {
    fontSize: 24,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.lg,
  },

  // Cards
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  // Today workout
  workoutName: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.orange + '22',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  startButton: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  noWorkout: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },

  // Empty workout
  emptyWorkoutBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  emptyWorkoutPlus: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  emptyWorkoutText: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },

  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  // Calendar
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  arrowBtn: {
    padding: spacing.sm,
  },
  arrowText: {
    fontSize: 18,
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  monthLabel: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: colors.orange,
  },
  dayText: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontFamily: fonts.numbersExtraBold,
  },
  dayTextFuture: {
    color: colors.textMuted,
  },
  dayTextPast: {
    color: colors.textSecondary,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },

  // Schedule list
  scheduleCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange + '26',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  scheduleDate: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
  },

  // Routines grid
  routineGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  routineAction: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  routineActionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  routineActionLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    textAlign: 'center',
  },

  // Routine cards
  routineCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  routineName: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  routineExercises: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  routineStartBtn: {
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginLeft: spacing.md,
  },
  routineStartText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },

  // Bottom tip card
  tipCard: {
    backgroundColor: '#1A1A2A',
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  tipText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  tipArrow: {
    fontSize: 18,
    color: colors.textSecondary,
  },
});
