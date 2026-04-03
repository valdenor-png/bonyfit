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

// Days of the current month where the user trained
const TRAINED_DAYS = new Set([1, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26, 28, 30]);

const MOCK_CHECKINS = [
  { id: '1', date: '03/04/2026', timeIn: '06:15', timeOut: '07:22' },
  { id: '2', date: '01/04/2026', timeIn: '17:30', timeOut: '18:45' },
  { id: '3', date: '30/03/2026', timeIn: '06:20', timeOut: '07:30' },
  { id: '4', date: '28/03/2026', timeIn: '07:00', timeOut: '08:05' },
  { id: '5', date: '26/03/2026', timeIn: '06:10', timeOut: '07:20' },
  { id: '6', date: '24/03/2026', timeIn: '17:45', timeOut: '19:00' },
  { id: '7', date: '22/03/2026', timeIn: '06:30', timeOut: '07:40' },
  { id: '8', date: '21/03/2026', timeIn: '06:25', timeOut: '07:35' },
];

const STATS = {
  thisMonth: 17,
  streak: 5,
  total: 142,
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
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

export default function FrequenciaScreen() {
  const navigation = useNavigation();
  const today = new Date();
  const todayDay = today.getDate();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const isCurrentMonth =
    currentMonth === today.getMonth() && currentYear === today.getFullYear();

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

  const getCellStyle = (day: number) => {
    const isToday = isCurrentMonth && day === todayDay;
    const trained = TRAINED_DAYS.has(day);

    if (isToday) return styles.cellToday;
    if (trained) return styles.cellTrained;
    return styles.cellDefault;
  };

  const getCellTextStyle = (day: number) => {
    const isToday = isCurrentMonth && day === todayDay;
    if (isToday) return styles.cellTextToday;
    return styles.cellTextDefault;
  };

  const renderCalendar = () => {
    const rows: React.ReactNode[] = [];

    // Weekday headers
    rows.push(
      <View key="header" style={styles.calendarRow}>
        {WEEKDAYS.map((wd, i) => (
          <View key={i} style={styles.calendarCell}>
            <Text style={styles.weekdayText}>{wd}</Text>
          </View>
        ))}
      </View>,
    );

    // Day cells
    for (let i = 0; i < calendarCells.length; i += 7) {
      const week = calendarCells.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      rows.push(
        <View key={`week-${i}`} style={styles.calendarRow}>
          {week.map((day, idx) => (
            <View key={idx} style={styles.calendarCell}>
              {day !== null ? (
                <View style={[styles.dayCellBase, getCellStyle(day)]}>
                  <Text style={[styles.dayNumber, getCellTextStyle(day)]}>
                    {day}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>,
      );
    }

    return rows;
  };

  const renderCheckin = ({ item }: { item: typeof MOCK_CHECKINS[0] }) => (
    <View style={styles.checkinCard}>
      <View style={styles.checkinLeft}>
        <Ionicons name="location-outline" size={18} color={colors.orange} />
        <Text style={styles.checkinDate}>{item.date}</Text>
      </View>
      <View style={styles.checkinRight}>
        <Text style={styles.checkinTime}>
          {item.timeIn} - {item.timeOut}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Frequência</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{STATS.thisMonth}</Text>
            <Text style={styles.statLabel}>treinos este mês</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{STATS.streak}</Text>
            <Text style={styles.statLabel}>dias seguidos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{STATS.total}</Text>
            <Text style={styles.statLabel}>total</Text>
          </View>
        </View>

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

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Treinou</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.orange }]} />
              <Text style={styles.legendText}>Hoje</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.elevated }]} />
              <Text style={styles.legendText}>Sem treino</Text>
            </View>
          </View>
        </View>

        {/* Recent check-ins */}
        <Text style={styles.sectionTitle}>Check-ins recentes</Text>

        <FlatList
          data={MOCK_CHECKINS}
          renderItem={renderCheckin}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      </ScrollView>
    </View>
  );
}

const CELL_SIZE = 36;

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
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 26,
    color: colors.orange,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.elevated,
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
    paddingVertical: 4,
  },
  weekdayText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  dayCellBase: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDefault: {
    backgroundColor: colors.elevated,
  },
  cellTrained: {
    backgroundColor: colors.success,
  },
  cellToday: {
    backgroundColor: colors.orange,
  },
  dayNumber: {
    fontFamily: fonts.numbers,
    fontSize: 13,
  },
  cellTextDefault: {
    color: colors.textMuted,
  },
  cellTextToday: {
    color: '#FFFFFF',
    fontFamily: fonts.numbersBold,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  checkinCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkinDate: {
    fontFamily: fonts.numbers,
    fontSize: 14,
    color: colors.text,
  },
  checkinRight: {},
  checkinTime: {
    fontFamily: fonts.numbers,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
