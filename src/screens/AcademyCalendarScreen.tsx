import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const DAY_CELL_WIDTH = 48;
const DAY_GAP = 6;
const SCREEN_WIDTH = Dimensions.get('window').width;
import { colors, fonts, spacing, radius } from '../tokens';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { supabase } from '../services/supabase';

// ── Types ────────────────────────────────────────────────────
interface ScheduleItem {
  id: string;
  modalidade_nome: string;
  modalidade_icone: string;
  start_time: string;
  end_time: string;
  instructor_name: string | null;
  location: string | null;
  type: 'recurring' | 'event' | 'holiday';
  color: string;
}

// ── Day names ────────────────────────────────────────────────
const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ── Colors per modality ─────────────────────────────────────
const MODALITY_COLORS: Record<string, string> = {
  danca: '#E91E63',
  abdominal: '#FF5722',
  funcional: '#4CAF50',
  spinning: '#2196F3',
  muay_thai: '#F44336',
  yoga: '#9C27B0',
  hiit: '#FF9800',
  alongamento: '#00BCD4',
};

interface Props {
  navigation: any;
}

export default function AcademyCalendarScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const dayScrollRef = useRef<ScrollView>(null);
  const [events, setEvents] = useState<ScheduleItem[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Build 60-day strip (30 past + 30 future) ────────────────
  useEffect(() => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = -30; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    setCalendarDays(days);

    // Scroll to today on mount
    setTimeout(() => {
      const todayIndex = 30; // center of the array
      const offset = todayIndex * (DAY_CELL_WIDTH + DAY_GAP) - SCREEN_WIDTH / 2 + DAY_CELL_WIDTH / 2;
      dayScrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: false });
    }, 100);
  }, []);

  // ── Load data ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const dow = selectedDate.getDay();
    const dateStr = selectedDate.toISOString().split('T')[0];

    try {
      // 1. Recurring classes for this day of week
      const { data: classes } = await supabase
        .from('class_schedule')
        .select('id, start_time, end_time, instructor_name, location, modalidades(nome, slug, icone)')
        .eq('day_of_week', dow)
        .eq('is_active', true)
        .order('start_time');

      const recurring: ScheduleItem[] = (classes || []).map((c: any) => ({
        id: c.id,
        modalidade_nome: c.modalidades?.nome || 'Aula',
        modalidade_icone: c.modalidades?.icone || '📋',
        start_time: c.start_time?.substring(0, 5) || '',
        end_time: c.end_time?.substring(0, 5) || '',
        instructor_name: c.instructor_name,
        location: c.location,
        type: 'recurring' as const,
        color: MODALITY_COLORS[c.modalidades?.slug || ''] || '#F26522',
      }));
      setSchedule(recurring);

      // 2. One-off events for this specific date
      const { data: evts } = await supabase
        .from('gym_events')
        .select('id, title, description, start_time, end_time, location, instructor')
        .eq('event_date', dateStr);

      const eventItems: ScheduleItem[] = (evts || []).map((e: any) => ({
        id: e.id,
        modalidade_nome: e.title,
        modalidade_icone: '🎉',
        start_time: e.start_time?.substring(0, 5) || '',
        end_time: e.end_time?.substring(0, 5) || '',
        instructor_name: e.instructor,
        location: e.location,
        type: 'event' as const,
        color: '#FFD700',
      }));
      setEvents(eventItems);

      // 3. Holidays for this month
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      const { data: hols } = await supabase
        .from('holidays')
        .select('name, holiday_date')
        .eq('year', year)
        .gte('holiday_date', `${year}-${String(month).padStart(2, '0')}-01`)
        .lte('holiday_date', `${year}-${String(month).padStart(2, '0')}-31`);

      setHolidays((hols || []).map((h: any) => ({ date: h.holiday_date, name: h.name })));
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Navigation helpers ─────────────────────────────────────
  const scrollToDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
    const index = 30 + diffDays; // 30 = center offset
    if (index >= 0 && index < calendarDays.length) {
      const offset = index * (DAY_CELL_WIDTH + DAY_GAP) - SCREEN_WIDTH / 2 + DAY_CELL_WIDTH / 2;
      dayScrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
    }
  };

  const goToPrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
    scrollToDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
    scrollToDate(d);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => date.toDateString() === selectedDate.toDateString();

  const isHoliday = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.find((h) => h.date === dateStr);
  };

  const allItems = [...schedule, ...events].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );

  const holidayToday = isHoliday(selectedDate);

  return (
    <ScreenBackground>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={colors.orange} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendário da Academia</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Month + week nav */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={goToPrevWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.navArrow}>{'\u276E'}</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={goToNextWeek} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.navArrow}>{'\u276F'}</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable day strip */}
        <ScrollView
          ref={dayScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayStrip}
          style={styles.dayStripScroll}
        >
          {calendarDays.map((day, idx) => {
            const sel = isSelected(day);
            const today = isToday(day);
            const hol = isHoliday(day);
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dayCell, sel && styles.dayCellSelected]}
                onPress={() => setSelectedDate(new Date(day))}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayName, sel && styles.dayNameSelected]}>
                  {DAY_NAMES_SHORT[day.getDay()]}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  sel && styles.dayNumberSelected,
                  today && !sel && styles.dayNumberToday,
                ]}>
                  {day.getDate()}
                </Text>
                {hol && <View style={styles.holidayDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected day label */}
        <Text style={styles.selectedDayLabel}>
          {DAY_NAMES_FULL[selectedDate.getDay()]}, {selectedDate.getDate()} de {MONTH_NAMES[selectedDate.getMonth()]}
        </Text>

        {/* Holiday banner */}
        {holidayToday && (
          <View style={styles.holidayBanner}>
            <Text style={styles.holidayBannerText}>🏖️ {holidayToday.name} — Academia pode ter horário especial</Text>
          </View>
        )}

        {/* Schedule */}
        {loading ? (
          <ActivityIndicator color={colors.orange} size="large" style={{ marginTop: 40 }} />
        ) : allItems.length > 0 ? (
          <View style={styles.scheduleList}>
            {allItems.map((item) => (
              <View key={item.id} style={styles.scheduleCard}>
                <View style={[styles.scheduleColorBar, { backgroundColor: item.color }]} />
                <View style={styles.scheduleTime}>
                  <Text style={styles.scheduleTimeText}>{item.start_time}</Text>
                  <Text style={styles.scheduleTimeSeparator}>|</Text>
                  <Text style={styles.scheduleTimeEnd}>{item.end_time}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <View style={styles.scheduleNameRow}>
                    <Text style={styles.scheduleIcon}>{item.modalidade_icone}</Text>
                    <Text style={styles.scheduleName}>{item.modalidade_nome}</Text>
                    {item.type === 'event' && (
                      <View style={styles.eventBadge}>
                        <Text style={styles.eventBadgeText}>Evento</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.scheduleMetaRow}>
                    {item.instructor_name && (
                      <Text style={styles.scheduleMeta}>👤 {item.instructor_name}</Text>
                    )}
                    {item.location && (
                      <Text style={styles.scheduleMeta}>📍 {item.location}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Nenhuma aula neste dia</Text>
            <Text style={styles.emptySubtitle}>
              {selectedDate.getDay() === 0 ? 'Domingos sem programação' : 'Sem aulas agendadas'}
            </Text>
          </View>
        )}

        {/* Monthly holidays preview */}
        {holidays.length > 0 && (
          <View style={styles.holidaysSection}>
            <Text style={styles.holidaysSectionTitle}>Feriados do mês</Text>
            {holidays.map((h, idx) => {
              const hDate = new Date(h.date + 'T00:00:00');
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.holidayRow}
                  onPress={() => setSelectedDate(hDate)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.holidayDate}>
                    {hDate.getDate()} {DAY_NAMES_SHORT[hDate.getDay()]}
                  </Text>
                  <Text style={styles.holidayName}>{h.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backArrow: { fontSize: 22, color: colors.text },
  headerTitle: { fontSize: 17, fontFamily: fonts.bodyBold, color: colors.text },

  // Month nav
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navArrow: { fontSize: 18, color: 'rgba(255,255,255,0.5)', paddingHorizontal: 8 },
  monthText: { fontSize: 16, fontFamily: fonts.numbersBold, color: colors.text },

  // Day strip (scrollable)
  dayStripScroll: {
    marginBottom: 16,
  },
  dayStrip: {
    paddingHorizontal: 16,
    gap: DAY_GAP,
  },
  dayCell: {
    width: DAY_CELL_WIDTH,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: '#F26522',
  },
  dayName: { fontSize: 11, fontFamily: fonts.body, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  dayNameSelected: { color: 'rgba(255,255,255,0.8)' },
  dayNumber: { fontSize: 16, fontFamily: fonts.numbersBold, color: 'rgba(255,255,255,0.6)' },
  dayNumberSelected: { color: '#FFFFFF' },
  dayNumberToday: { color: '#F26522' },
  holidayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#FFD700', marginTop: 4,
  },

  // Selected day
  selectedDayLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  // Holiday banner
  holidayBanner: {
    backgroundColor: 'rgba(255,215,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  holidayBannerText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: '#FFD700' },

  // Schedule list
  scheduleList: { paddingHorizontal: 20, gap: 10 },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  scheduleColorBar: { width: 4, alignSelf: 'stretch' },
  scheduleTime: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
    minWidth: 60,
  },
  scheduleTimeText: { fontSize: 14, fontFamily: fonts.numbersBold, color: '#FFFFFF' },
  scheduleTimeSeparator: { fontSize: 10, color: 'rgba(255,255,255,0.2)', marginVertical: 1 },
  scheduleTimeEnd: { fontSize: 12, fontFamily: fonts.numbers, color: 'rgba(255,255,255,0.4)' },
  scheduleInfo: { flex: 1, paddingVertical: 12, paddingRight: 14 },
  scheduleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  scheduleIcon: { fontSize: 16 },
  scheduleName: { fontSize: 14, fontFamily: fonts.bodyBold, color: '#FFFFFF', flex: 1 },
  eventBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventBadgeText: { fontSize: 10, fontFamily: fonts.bodyMedium, color: '#FFD700' },
  scheduleMetaRow: { flexDirection: 'row', gap: 12 },
  scheduleMeta: { fontSize: 11, fontFamily: fonts.body, color: 'rgba(255,255,255,0.4)' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bodyBold, color: '#FFFFFF', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, fontFamily: fonts.body, color: 'rgba(255,255,255,0.4)' },

  // Monthly holidays
  holidaysSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  holidaysSectionTitle: {
    fontSize: 14, fontFamily: fonts.bodyBold, color: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
  },
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  holidayDate: { fontSize: 13, fontFamily: fonts.numbersBold, color: '#FFD700', width: 55 },
  holidayName: { fontSize: 13, fontFamily: fonts.body, color: 'rgba(255,255,255,0.5)' },
});
