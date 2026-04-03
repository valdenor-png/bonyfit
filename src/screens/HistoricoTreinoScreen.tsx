import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../tokens';

// --------------- Mock data ---------------

const MOCK_WORKOUTS = [
  {
    id: '1',
    date: '2026-03-30',
    dayOfWeek: 'Segunda-feira',
    label: 'Peito + Tríceps + Ombro',
    durationMinutes: 62,
    exercisesCompleted: 5,
    totalPoints: 680,
    exercises: [
      { name: 'Supino Reto', sets: [{ reps: 12, weight: 60 }, { reps: 10, weight: 70 }, { reps: 8, weight: 80 }] },
      { name: 'Supino Inclinado', sets: [{ reps: 12, weight: 50 }, { reps: 10, weight: 60 }, { reps: 8, weight: 65 }] },
      { name: 'Crucifixo', sets: [{ reps: 15, weight: 14 }, { reps: 12, weight: 16 }, { reps: 10, weight: 18 }] },
      { name: 'Tríceps Testa', sets: [{ reps: 12, weight: 20 }, { reps: 10, weight: 25 }] },
      { name: 'Desenvolvimento', sets: [{ reps: 12, weight: 30 }, { reps: 10, weight: 35 }, { reps: 8, weight: 40 }] },
    ],
  },
  {
    id: '2',
    date: '2026-03-28',
    dayOfWeek: 'Sábado',
    label: 'Costas + Bíceps',
    durationMinutes: 55,
    exercisesCompleted: 4,
    totalPoints: 530,
    exercises: [
      { name: 'Puxada Frontal', sets: [{ reps: 12, weight: 50 }, { reps: 10, weight: 60 }] },
      { name: 'Remada Curvada', sets: [{ reps: 12, weight: 40 }, { reps: 10, weight: 50 }] },
      { name: 'Rosca Direta', sets: [{ reps: 12, weight: 16 }, { reps: 10, weight: 18 }] },
      { name: 'Rosca Martelo', sets: [{ reps: 12, weight: 14 }, { reps: 10, weight: 16 }] },
    ],
  },
  {
    id: '3',
    date: '2026-03-26',
    dayOfWeek: 'Quinta-feira',
    label: 'Pernas + Glúteos',
    durationMinutes: 70,
    exercisesCompleted: 6,
    totalPoints: 820,
    exercises: [
      { name: 'Agachamento Livre', sets: [{ reps: 12, weight: 80 }, { reps: 10, weight: 90 }, { reps: 8, weight: 100 }] },
      { name: 'Leg Press', sets: [{ reps: 15, weight: 200 }, { reps: 12, weight: 240 }] },
      { name: 'Extensora', sets: [{ reps: 15, weight: 50 }, { reps: 12, weight: 60 }] },
      { name: 'Flexora', sets: [{ reps: 15, weight: 40 }, { reps: 12, weight: 50 }] },
      { name: 'Panturrilha', sets: [{ reps: 20, weight: 80 }, { reps: 20, weight: 90 }] },
      { name: 'Stiff', sets: [{ reps: 12, weight: 40 }, { reps: 10, weight: 50 }] },
    ],
  },
  {
    id: '4',
    date: '2026-03-24',
    dayOfWeek: 'Terça-feira',
    label: 'Peito + Tríceps + Ombro',
    durationMinutes: 58,
    exercisesCompleted: 5,
    totalPoints: 650,
    exercises: [
      { name: 'Supino Reto', sets: [{ reps: 12, weight: 60 }, { reps: 10, weight: 65 }] },
      { name: 'Supino Inclinado', sets: [{ reps: 12, weight: 50 }, { reps: 10, weight: 55 }] },
      { name: 'Crucifixo', sets: [{ reps: 15, weight: 14 }] },
      { name: 'Tríceps Testa', sets: [{ reps: 12, weight: 20 }, { reps: 10, weight: 22 }] },
      { name: 'Desenvolvimento', sets: [{ reps: 12, weight: 28 }, { reps: 10, weight: 32 }] },
    ],
  },
];

// Workout dates for the calendar dots
const WORKOUT_DATES = new Set(MOCK_WORKOUTS.map((w) => w.date));

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function padDateNum(n: number) {
  return n.toString().padStart(2, '0');
}

export default function HistoricoTreinoScreen() {
  const navigation = useNavigation();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendar = () => {
    const rows: React.ReactNode[] = [];

    // Weekday headers
    rows.push(
      <View key="header" style={styles.calendarRow}>
        {WEEKDAYS.map((wd) => (
          <View key={wd} style={styles.calendarCell}>
            <Text style={styles.calendarWeekday}>{wd}</Text>
          </View>
        ))}
      </View>,
    );

    // Day cells in rows of 7
    for (let i = 0; i < calendarCells.length; i += 7) {
      const week = calendarCells.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      rows.push(
        <View key={`week-${i}`} style={styles.calendarRow}>
          {week.map((day, idx) => {
            const dateStr = day
              ? `${currentYear}-${padDateNum(currentMonth + 1)}-${padDateNum(day)}`
              : null;
            const hasWorkout = dateStr ? WORKOUT_DATES.has(dateStr) : false;
            return (
              <View key={idx} style={styles.calendarCell}>
                {day !== null ? (
                  <View style={styles.calendarDayContainer}>
                    <Text style={styles.calendarDayText}>{day}</Text>
                    {hasWorkout && <View style={styles.calendarDot} />}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>,
      );
    }

    return rows;
  };

  const renderWorkoutCard = ({ item }: { item: typeof MOCK_WORKOUTS[0] }) => {
    const expanded = expandedId === item.id;
    return (
      <TouchableOpacity
        style={styles.workoutCard}
        activeOpacity={0.8}
        onPress={() => setExpandedId(expanded ? null : item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardDate}>
              {formatDate(item.date)} - {item.dayOfWeek}
            </Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>

        <View style={styles.cardStats}>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statValue}>{item.durationMinutes}min</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statValue}>{item.exercisesCompleted} exerc.</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="star-outline" size={14} color={colors.orange} />
            <Text style={[styles.statValue, { color: colors.orange }]}>
              {item.totalPoints} pts
            </Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.exerciseList}>
            {item.exercises.map((ex, idx) => (
              <View key={idx} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <View style={styles.setsRow}>
                  {ex.sets.map((s, si) => (
                    <Text key={si} style={styles.setText}>
                      {s.reps}x{s.weight}kg
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Treinos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS_PT[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          {renderCalendar()}
        </View>

        {/* Workout list */}
        <FlatList
          data={MOCK_WORKOUTS}
          renderItem={renderWorkoutCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
  },
  calendarContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  calendarCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  calendarWeekday: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  calendarDayContainer: {
    alignItems: 'center',
  },
  calendarDayText: {
    fontFamily: fonts.numbers,
    fontSize: 14,
    color: colors.text,
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginTop: 2,
  },
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.numbers,
    fontSize: 13,
    color: colors.textSecondary,
  },
  exerciseList: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.elevated,
    paddingTop: spacing.md,
  },
  exerciseRow: {
    marginBottom: spacing.sm,
  },
  exerciseName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  setsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  setText: {
    fontFamily: fonts.numbers,
    fontSize: 12,
    color: colors.textMuted,
  },
});
