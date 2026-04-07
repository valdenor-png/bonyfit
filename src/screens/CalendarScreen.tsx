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

// ─── Types ──────────────────────────────────────────────────────────────────────

interface WorkoutEntry {
  name: string;
  status: 'scheduled' | 'completed' | 'missed';
}

interface EventEntry {
  title: string;
  startTime: string;
  endTime: string;
}

interface HolidayEntry {
  name: string;
}

interface DayData {
  workouts?: WorkoutEntry[];
  events?: EventEntry[];
  holiday?: HolidayEntry;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_DATA: Record<string, DayData> = {
  '2026-04-01': { workouts: [{ name: 'Treino A \u2014 Peito + Tr\u00edceps', status: 'completed' }] },
  '2026-04-02': { workouts: [{ name: 'Treino B \u2014 Costas + B\u00edceps', status: 'completed' }] },
  '2026-04-03': {
    workouts: [{ name: 'Treino C \u2014 Pernas', status: 'completed' }],
    holiday: { name: 'Sexta-feira Santa' },
  },
  '2026-04-06': { workouts: [{ name: 'Treino A \u2014 Peito + Tr\u00edceps', status: 'completed' }] },
  '2026-04-08': { workouts: [{ name: 'Treino B \u2014 Costas + B\u00edceps', status: 'completed' }] },
  '2026-04-10': { workouts: [{ name: 'Treino C \u2014 Pernas', status: 'missed' }] },
  '2026-04-12': {
    workouts: [{ name: 'Treino A \u2014 Peito + Tr\u00edceps', status: 'scheduled' }],
    events: [{ title: 'Aula de Dan\u00e7a', startTime: '18:00', endTime: '19:00' }],
  },
  '2026-04-15': {
    workouts: [{ name: 'Treino B \u2014 Costas + B\u00edceps', status: 'scheduled' }],
    events: [{ title: 'Aula de Yoga', startTime: '07:00', endTime: '08:00' }],
  },
  '2026-04-21': {
    holiday: { name: 'Tiradentes' },
    events: [{ title: 'Aulão Especial de Feriado', startTime: '09:00', endTime: '11:00' }],
  },
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Mar\u00e7o', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'S\u00e1b'];

const TODAY = new Date(2026, 3, 5);

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function dateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getGymHours(dayOfWeek: number): { opens: string; closes: string } | null {
  if (dayOfWeek === 0) return null; // Sunday closed
  if (dayOfWeek === 6) return { opens: '08:00', closes: '14:00' }; // Saturday
  return { opens: '06:00', closes: '22:00' }; // Weekdays
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CalendarScreen({ navigation }: { navigation: any }) {
  const [calendarMonth, setCalendarMonth] = useState(TODAY.getMonth());
  const [calendarYear, setCalendarYear] = useState(TODAY.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number>(TODAY.getDate());

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  function prevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
    setSelectedDay(1);
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
    setSelectedDay(1);
  }

  function getDayData(day: number): DayData | undefined {
    return MOCK_DATA[dateKey(calendarYear, calendarMonth, day)];
  }

  function getDots(day: number): string[] {
    const data = getDayData(day);
    const dots: string[] = [];
    if (data?.workouts) {
      for (const w of data.workouts) {
        if (w.status === 'completed') dots.push(colors.success);
        else if (w.status === 'missed') dots.push(colors.danger);
        else dots.push(colors.orange);
      }
    }
    if (data?.events) dots.push(colors.info);
    if (data?.holiday) dots.push(colors.danger);
    return dots;
  }

  const selectedKey = dateKey(calendarYear, calendarMonth, selectedDay);
  const selectedData = MOCK_DATA[selectedKey];
  const selectedDate = new Date(calendarYear, calendarMonth, selectedDay);
  const selectedDayOfWeek = selectedDate.getDay();
  const gymHours = getGymHours(selectedDayOfWeek);

  const statusColors: Record<string, string> = {
    scheduled: '#888888',
    completed: colors.success,
    missed: colors.danger,
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'Agendado',
    completed: 'Conclu\u00eddo',
    missed: 'Perdido',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backText}>{'\u2190'} Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Month navigation ──────────────────────────────────────────── */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn} activeOpacity={0.7}>
          <Text style={styles.arrowText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[calendarMonth]} {calendarYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn} activeOpacity={0.7}>
          <Text style={styles.arrowText}>{'\u2192'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Calendar grid ─────────────────────────────────────────────── */}
      <View style={styles.calendarCard}>
        {/* Weekday headers */}
        <View style={styles.weekRow}>
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} style={styles.weekCell}>
              <Text style={styles.weekLabel}>{label}</Text>
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

            const isSelected = day === selectedDay;
            const dots = getDots(day);

            return (
              <TouchableOpacity
                key={`day-${day}`}
                style={styles.dayCell}
                onPress={() => setSelectedDay(day)}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isSelected && !isToday && styles.dayCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.dayTextToday,
                      !isToday && !getDayData(day) && styles.dayTextGray,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {dots.length > 0 && (
                  <View style={styles.dotsRow}>
                    {dots.map((dotColor, i) => (
                      <View
                        key={i}
                        style={[styles.dayDot, { backgroundColor: dotColor }]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Selected day detail ───────────────────────────────────────── */}
      <Text style={styles.selectedDayTitle}>
        {selectedDay}/{calendarMonth + 1}/{calendarYear}
      </Text>

      {/* Workout card */}
      {selectedData?.workouts?.map((w, i) => (
        <View key={`workout-${i}`} style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailIconCircle, { backgroundColor: colors.orange + '26' }]}>
              <Text style={styles.detailEmoji}>{'\uD83C\uDFCB'}</Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Treino do dia</Text>
              <Text style={styles.detailName}>{w.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[w.status] + '22' }]}>
              <Text style={[styles.statusText, { color: statusColors[w.status] }]}>
                {statusLabels[w.status]}
              </Text>
            </View>
          </View>
          {w.status === 'scheduled' && (
            <TouchableOpacity style={styles.detailButton} activeOpacity={0.8} onPress={() => Alert.alert('Iniciar', 'Iniciar treino deste dia.')}>
              <Text style={styles.detailButtonText}>Iniciar</Text>
            </TouchableOpacity>
          )}
          {w.status === 'completed' && (
            <TouchableOpacity style={styles.detailButtonOutline} activeOpacity={0.7} onPress={() => Alert.alert('Detalhes', 'Ver detalhes do treino.')}>
              <Text style={styles.detailButtonOutlineText}>Ver Detalhes</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {!selectedData?.workouts && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailIconCircle, { backgroundColor: colors.orange + '26' }]}>
              <Text style={styles.detailEmoji}>{'\uD83C\uDFCB'}</Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Treino do dia</Text>
              <Text style={styles.detailMuted}>Nenhum treino agendado</Text>
            </View>
          </View>
        </View>
      )}

      {/* Gym hours card */}
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <View style={[styles.detailIconCircle, { backgroundColor: colors.info + '26' }]}>
            <Text style={styles.detailEmoji}>{'\u23F0'}</Text>
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>Hor\u00e1rio de funcionamento</Text>
            {gymHours ? (
              <Text style={styles.detailName}>
                {gymHours.opens} \u2014 {gymHours.closes}
              </Text>
            ) : (
              <Text style={[styles.detailName, { color: colors.danger }]}>Fechado</Text>
            )}
          </View>
        </View>
      </View>

      {/* Events card */}
      {selectedData?.events && selectedData.events.length > 0 && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailIconCircle, { backgroundColor: '#8B5CF6' + '26' }]}>
              <Text style={styles.detailEmoji}>{'\u2B50'}</Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Eventos do dia</Text>
            </View>
          </View>
          {selectedData.events.map((ev, i) => (
            <View key={`event-${i}`} style={styles.eventItem}>
              <Text style={styles.eventText}>
                {ev.title} \u2014 {ev.startTime} \u00e0s {ev.endTime}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Holiday card */}
      {selectedData?.holiday && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailIconCircle, { backgroundColor: colors.danger + '26' }]}>
              <Text style={styles.detailEmoji}>{'\uD83C\uDFC1'}</Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Feriado</Text>
              <Text style={styles.detailName}>{selectedData.holiday.name}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // Month nav
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  arrowBtn: {
    padding: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  arrowText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
  },
  monthLabel: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    minWidth: 140,
    textAlign: 'center',
  },

  // Calendar
  calendarCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
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
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: '#666666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%' as any,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: colors.orange,
  },
  dayCircleSelected: {
    backgroundColor: '#333333',
  },
  dayText: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: '#FFFFFF',
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontFamily: fonts.numbersExtraBold,
  },
  dayTextGray: {
    color: '#666666',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // Selected day
  selectedDayTitle: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },

  // Detail cards
  detailCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailEmoji: {
    fontSize: 20,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: '#888888',
    marginBottom: 2,
  },
  detailName: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  detailMuted: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: '#666666',
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

  // Buttons
  detailButton: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  detailButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  detailButtonOutline: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  detailButtonOutlineText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
  },

  // Events
  eventItem: {
    marginTop: spacing.sm,
    paddingLeft: 56,
  },
  eventText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#FFFFFF',
  },
});
