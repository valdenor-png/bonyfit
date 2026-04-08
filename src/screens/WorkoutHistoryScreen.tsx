import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { useAuth } from '../hooks/useAuth';
import { useWorkoutHistory } from '../hooks/useWorkoutHistory';
import { useExerciseHistory } from '../hooks/useExerciseHistory';
import { fetchLogsRecentes, fetchExerciciosFrequentes } from '../services/workoutHistory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = 'calendario' | 'recentes' | 'exercicio';

interface RecentLog {
  id: string;
  name: string;
  workout_date: string;
  started_at: string;
  duration_seconds: number;
  volume_total: number;
  points_earned: number;
}

interface FreqExercise {
  id: string;
  name: string;
  muscle_group: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS: { key: TabKey; label: string }[] = [
  { key: 'calendario', label: '\uD83D\uDCC5 Calendário' },
  { key: 'recentes', label: '\uD83D\uDCCB Recentes' },
  { key: 'exercicio', label: '\uD83D\uDCAA Exercício' },
];

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const SCREEN_WIDTH = Dimensions.get('window').width;

// ---------------------------------------------------------------------------
// Mock data fallbacks
// ---------------------------------------------------------------------------

function mockRecentLogs(): RecentLog[] {
  const today = new Date();
  const names = ['Treino A - Peito', 'Treino B - Costas', 'Treino C - Perna', 'Treino D - Ombro'];
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 2 - 1);
    return {
      id: `mock-${i}`,
      name: names[i % 4],
      workout_date: d.toISOString().split('T')[0],
      started_at: d.toISOString(),
      duration_seconds: (40 + Math.floor(Math.random() * 30)) * 60,
      volume_total: 2000 + Math.floor(Math.random() * 3000),
      points_earned: 300 + Math.floor(Math.random() * 200),
    };
  });
}

function mockExercises(): FreqExercise[] {
  return [
    { id: 'ex1', name: 'Supino Reto', muscle_group: 'Peito', count: 18 },
    { id: 'ex2', name: 'Agachamento', muscle_group: 'Perna', count: 15 },
    { id: 'ex3', name: 'Puxada Frontal', muscle_group: 'Costas', count: 14 },
    { id: 'ex4', name: 'Desenvolvimento', muscle_group: 'Ombro', count: 12 },
    { id: 'ex5', name: 'Rosca Direta', muscle_group: 'Bíceps', count: 11 },
    { id: 'ex6', name: 'Leg Press', muscle_group: 'Perna', count: 10 },
    { id: 'ex7', name: 'Remada Curvada', muscle_group: 'Costas', count: 9 },
    { id: 'ex8', name: 'Crucifixo', muscle_group: 'Peito', count: 8 },
  ];
}

function mockExerciseSessions() {
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (8 - i) * 3);
    return {
      workoutLogId: `mock-s-${i}`,
      date: d.toISOString(),
      maxCarga: 50 + i * 5 + Math.floor(Math.random() * 5),
      totalReps: 30 + Math.floor(Math.random() * 10),
      volume: (50 + i * 5) * 30,
      sets: [
        { weight_kg: 50 + i * 5, reps: 12, set_index: 0 },
        { weight_kg: 50 + i * 5, reps: 10, set_index: 1 },
        { weight_kg: 55 + i * 5, reps: 8, set_index: 2 },
      ],
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface WorkoutHistoryScreenProps {
  navigation?: any;
}

export default function WorkoutHistoryScreen({ navigation }: WorkoutHistoryScreenProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('calendario');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const selected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, selected && styles.tabItemSelected]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'calendario' && <CalendarioView userId={user?.id} />}
      {activeTab === 'recentes' && <RecentesView userId={user?.id} />}
      {activeTab === 'exercicio' && <ExercicioView userId={user?.id} />}
    </SafeAreaView>
  );
}

// ===========================================================================
// View 1 - Calendario
// ===========================================================================

function CalendarioView({ userId }: { userId?: string }) {
  const { logsMes, diasTreinou, statsMes, currentMonth, setCurrentMonth, loading } = useWorkoutHistory();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const today = new Date();
  const isCurrentMonth = currentMonth.year === today.getFullYear() && currentMonth.month === today.getMonth() + 1;
  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month);
  const firstDay = getFirstDayOfWeek(currentMonth.year, currentMonth.month);

  // Streak calculation
  const streak = (() => {
    let count = 0;
    const d = new Date(today);
    for (let i = 0; i < 60; i++) {
      if (diasTreinou.has(d.getDate()) && d.getMonth() + 1 === currentMonth.month && d.getFullYear() === currentMonth.year) {
        count++;
      } else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return count || (diasTreinou.size > 0 ? 1 : 0);
  })();

  // Weekly volume for bar chart
  const weeklyVolumes = (() => {
    const weeks: number[] = [0, 0, 0, 0, 0];
    logsMes.forEach((log) => {
      const day = new Date(log.workout_date).getDate();
      const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
      weeks[weekIdx] += log.volume_total || 0;
    });
    return weeks.filter((_, i) => i < Math.ceil(daysInMonth / 7));
  })();
  const maxWeekVol = Math.max(...weeklyVolumes, 1);

  const navigateMonth = (delta: number) => {
    let m = currentMonth.month + delta;
    let y = currentMonth.year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setCurrentMonth({ year: y, month: m });
    setSelectedDay(null);
  };

  // Filter logs for selected day
  const dayLogs = selectedDay
    ? logsMes.filter((l) => new Date(l.workout_date).getDate() === selectedDay)
    : [];

  const stats = [
    { icon: '\uD83C\uDFCB\uFE0F', value: statsMes.treinos, label: 'Treinos' },
    { icon: '\uD83D\uDCC8', value: `${statsMes.frequencia}%`, label: 'Frequência' },
    { icon: '\uD83D\uDD25', value: streak, label: 'Streak' },
    { icon: '\uD83D\uDCAA', value: `${(statsMes.volume / 1000).toFixed(1)}t`, label: 'Volume' },
  ];

  return (
    <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} style={styles.flex1}>
      {loading && <ActivityIndicator color={colors.orange} style={{ marginTop: 20 }} />}

      {/* Stats cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
        {stats.map((s, i) => (
          <View key={i} style={styles.statsCard}>
            <Text style={styles.statsIcon}>{s.icon}</Text>
            <Text style={styles.statsValue}>{s.value}</Text>
            <Text style={styles.statsLabel}>{s.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Month header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => navigateMonth(-1)}>
          <Text style={styles.monthArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS_PT[currentMonth.month - 1]} {currentMonth.year}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)}>
          <Text style={styles.monthArrow}>{'\u2192'}</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeadersRow}>
        {DAY_HEADERS.map((d, i) => (
          <View style={styles.calCell} key={i}>
            <Text style={styles.dayHeaderText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calGrid}>
        {Array.from({ length: firstDay }, (_, i) => (
          <View style={styles.calCell} key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const trained = diasTreinou.has(day);
          const isToday = isCurrentMonth && day === today.getDate();
          const isFuture = isCurrentMonth && day > today.getDate();
          const isSelected = selectedDay === day;

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.calCell,
                trained && styles.calCellTrained,
                isToday && styles.calCellToday,
                isSelected && styles.calCellSelected,
              ]}
              onPress={() => {
                if (trained) {
                  setSelectedDay(isSelected ? null : day);
                }
              }}
            >
              <Text style={[styles.calDayText, isFuture && styles.calDayMuted, isSelected && styles.calDaySelected]}>
                {day}
              </Text>
              {trained && <View style={styles.calDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Volume bar chart */}
      {weeklyVolumes.length > 0 && (
        <View style={styles.barChartSection}>
          <Text style={styles.sectionTitle}>Volume Semanal</Text>
          <View style={styles.barChartContainer}>
            {weeklyVolumes.map((vol, i) => (
              <View key={i} style={styles.barWrapper}>
                <Text style={styles.barValue}>{vol > 0 ? `${(vol / 1000).toFixed(1)}t` : ''}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${Math.max((vol / maxWeekVol) * 100, 4)}%` }]} />
                </View>
                <Text style={styles.barLabel}>S{i + 1}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Selected day workouts */}
      {selectedDay !== null && (
        <View style={styles.dayLogsSection}>
          <Text style={styles.sectionTitle}>Treinos em {selectedDay}/{currentMonth.month}</Text>
          {dayLogs.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum treino neste dia</Text>
          ) : (
            dayLogs.map((log) => (
              <View key={log.id} style={styles.card}>
                <Text style={styles.cardTitle}>{log.name}</Text>
                <View style={styles.cardStatsRow}>
                  <Text style={styles.cardStatOrange}>{Math.round((log.duration_seconds || 0) / 60)}min</Text>
                  <Text style={styles.cardStat}>{log.volume_total}kg</Text>
                  <Text style={styles.cardStat}>+{log.points_earned} pts</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ===========================================================================
// View 2 - Recentes
// ===========================================================================

function RecentesView({ userId }: { userId?: string }) {
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!userId) throw new Error('no user');
        const data = await fetchLogsRecentes(userId, 0, 20);
        setLogs(data.length > 0 ? (data as RecentLog[]) : mockRecentLogs());
      } catch {
        setLogs(mockRecentLogs());
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const renderItem = ({ item }: { item: RecentLog }) => {
    const expanded = expandedId === item.id;
    const durationMin = Math.round((item.duration_seconds || 0) / 60);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setExpandedId(expanded ? null : item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.flex1}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDate}>{formatDateShort(item.workout_date)}</Text>
          </View>
          <Text style={styles.cardDuration}>{durationMin}min</Text>
        </View>
        <View style={styles.cardStatsRow}>
          <Text style={styles.cardStat}>{item.volume_total?.toLocaleString()}kg</Text>
          <Text style={styles.cardStatOrange}>+{item.points_earned} pts</Text>
        </View>
        {expanded && (
          <View style={styles.expandedSection}>
            <Text style={styles.expandedHint}>Detalhes do treino indisponíveis no modo offline</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />;
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<Text style={styles.emptyText}>Nenhum treino registrado</Text>}
    />
  );
}

// ===========================================================================
// View 3 - Por Exercicio
// ===========================================================================

function ExercicioView({ userId }: { userId?: string }) {
  const [exercicios, setExercicios] = useState<FreqExercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<FreqExercise | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  const { sessions: realSessions, pr: realPr, evolucaoPct: realEvolucao, ultimaCarga: realUltCarga, ultimaReps: realUltReps, loading: loadingEx } =
    useExerciseHistory(selectedExercise?.id || null);

  // Use real data or mock fallback
  const useMock = realSessions.length === 0 && !loadingEx && selectedExercise;
  const mockSess = mockExerciseSessions();
  const sessions = useMock ? mockSess : realSessions;
  const pr = useMock ? Math.max(...mockSess.map(s => s.maxCarga)) : realPr;
  const evolucaoPct = useMock ? 25 : realEvolucao;
  const ultimaCarga = useMock ? mockSess[mockSess.length - 1].maxCarga : realUltCarga;

  useEffect(() => {
    (async () => {
      setLoadingList(true);
      try {
        if (!userId) throw new Error('no user');
        const data = await fetchExerciciosFrequentes(userId);
        const list = data.length > 0 ? (data as FreqExercise[]) : mockExercises();
        setExercicios(list);
        if (list.length > 0) setSelectedExercise(list[0]);
      } catch {
        const list = mockExercises();
        setExercicios(list);
        if (list.length > 0) setSelectedExercise(list[0]);
      } finally {
        setLoadingList(false);
      }
    })();
  }, [userId]);

  const filteredExercicios = exercicios.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  const last8 = sessions.slice(-8);
  const maxBar = Math.max(...last8.map(s => s.maxCarga), 1);
  const last6 = sessions.slice(-6);

  if (loadingList) {
    return <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.flex1}>
      {/* Exercise picker */}
      <TouchableOpacity style={styles.exercisePicker} onPress={() => setShowPicker(!showPicker)}>
        <View>
          <Text style={styles.exercisePickerName}>{selectedExercise?.name || 'Selecionar exercício'}</Text>
          <Text style={styles.exercisePickerGroup}>{selectedExercise?.muscle_group || ''}</Text>
        </View>
        <Text style={styles.exercisePickerArrow}>{showPicker ? '\u25B2' : '\u25BC'}</Text>
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerDropdown}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar exercício..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
          {filteredExercicios.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              style={[styles.pickerItem, selectedExercise?.id === ex.id && styles.pickerItemSelected]}
              onPress={() => {
                setSelectedExercise(ex);
                setShowPicker(false);
                setSearch('');
              }}
            >
              <Text style={styles.pickerItemName}>{ex.name}</Text>
              <Text style={styles.pickerItemGroup}>{ex.muscle_group}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loadingEx && <ActivityIndicator color={colors.orange} style={{ marginTop: 20 }} />}

      {selectedExercise && !loadingEx && (
        <>
          {/* 3 stats */}
          <View style={styles.exStatsRow}>
            <View style={styles.exStatCard}>
              <Text style={styles.exStatBadge}>{'\uD83C\uDFC6'}</Text>
              <Text style={styles.exStatValue}>{pr}kg</Text>
              <Text style={styles.exStatLabel}>PR</Text>
            </View>
            <View style={styles.exStatCard}>
              <Text style={styles.exStatBadge}>{'\uD83D\uDCC8'}</Text>
              <Text style={[styles.exStatValue, evolucaoPct >= 0 ? styles.textSuccess : styles.textDanger]}>
                {evolucaoPct >= 0 ? '+' : ''}{evolucaoPct}%
              </Text>
              <Text style={styles.exStatLabel}>Evolução</Text>
            </View>
            <View style={styles.exStatCard}>
              <Text style={styles.exStatBadge}>{'\uD83D\uDCAA'}</Text>
              <Text style={styles.exStatValue}>{ultimaCarga}kg</Text>
              <Text style={styles.exStatLabel}>{'Última carga'}</Text>
            </View>
          </View>

          {/* Weight progression bars */}
          <Text style={styles.sectionTitle}>Progressão de Carga</Text>
          <View style={styles.hBarContainer}>
            {last8.map((s, i) => {
              const widthPct = Math.max((s.maxCarga / maxBar) * 100, 8);
              return (
                <View key={i} style={styles.hBarRow}>
                  <Text style={styles.hBarDate}>{formatDateShort(s.date)}</Text>
                  <View style={styles.hBarTrack}>
                    <View style={[styles.hBarFill, { width: `${widthPct}%` }]} />
                  </View>
                  <Text style={styles.hBarValue}>{s.maxCarga}kg</Text>
                </View>
              );
            })}
          </View>

          {/* Session history table */}
          <Text style={styles.sectionTitle}>Histórico de Sessões</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Data</Text>
            <Text style={styles.tableHeaderCell}>Carga</Text>
            <Text style={styles.tableHeaderCell}>Reps</Text>
            <Text style={styles.tableHeaderCell}>Volume</Text>
          </View>
          {last6.reverse().map((s, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{formatDateShort(s.date)}</Text>
              <Text style={styles.tableCell}>{s.maxCarga}kg</Text>
              <Text style={styles.tableCell}>{s.totalReps}</Text>
              <Text style={styles.tableCell}>{s.volume}kg</Text>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
  flex1: {
    flex: 1,
  },

  // ---- Tab bar ----
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemSelected: {
    borderBottomColor: colors.orange,
  },
  tabLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#666',
  },
  tabLabelSelected: {
    color: colors.orange,
  },

  // ---- Stats cards (Calendario) ----
  statsScroll: {
    marginTop: spacing.lg,
  },
  statsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  statsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minWidth: 90,
  },
  statsIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  statsValue: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 24,
    color: colors.text,
  },
  statsLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },

  // ---- Month header ----
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

  // ---- Calendar grid ----
  dayHeadersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  dayHeaderText: {
    color: '#666',
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textAlign: 'center',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  calCell: {
    width: '14.28%' as any,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCellTrained: {
    backgroundColor: 'rgba(46,204,113,0.10)',
    borderRadius: 8,
  },
  calCellToday: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: 8,
  },
  calCellSelected: {
    backgroundColor: 'rgba(242,101,34,0.2)',
    borderRadius: 8,
  },
  calDayText: {
    color: colors.text,
    fontFamily: fonts.numbersBold,
    fontSize: 13,
  },
  calDayMuted: {
    color: '#444',
  },
  calDaySelected: {
    color: colors.orange,
  },
  calDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
    marginTop: 2,
  },

  // ---- Bar chart ----
  barChartSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: spacing.md,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%' as any,
    justifyContent: 'flex-end',
  },
  barValue: {
    fontFamily: fonts.numbersBold,
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
  },
  barTrack: {
    width: '100%' as any,
    height: '70%' as any,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: colors.orange,
    borderRadius: 6,
    width: '100%' as any,
  },
  barLabel: {
    fontFamily: fonts.numbersBold,
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },

  // ---- Day logs section ----
  dayLogsSection: {
    paddingHorizontal: spacing.lg,
  },

  // ---- Card (shared) ----
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  cardDate: {
    color: '#999',
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    marginTop: 4,
  },
  cardDuration: {
    color: colors.orange,
    fontFamily: fonts.numbersBold,
    fontSize: 14,
  },
  cardStatsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  cardStat: {
    color: '#999',
    fontFamily: fonts.numbersBold,
    fontSize: 12,
  },
  cardStatOrange: {
    color: colors.orange,
    fontFamily: fonts.numbersBold,
    fontSize: 12,
  },
  expandedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  expandedHint: {
    color: '#666',
    fontFamily: fonts.body,
    fontSize: 12,
  },

  // ---- FlatList content ----
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },

  // ---- Exercise view ----
  exercisePicker: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exercisePickerName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  exercisePickerGroup: {
    color: '#999',
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  exercisePickerArrow: {
    color: colors.orange,
    fontSize: 14,
  },
  pickerDropdown: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    padding: spacing.sm,
    maxHeight: 260,
  },
  searchInput: {
    backgroundColor: '#111',
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  pickerItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(242,101,34,0.1)',
  },
  pickerItemName: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  pickerItemGroup: {
    color: '#666',
    fontFamily: fonts.body,
    fontSize: 12,
  },

  // ---- Exercise stats ----
  exStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  exStatCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  exStatBadge: {
    fontSize: 20,
    marginBottom: 4,
  },
  exStatValue: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 20,
    color: colors.text,
  },
  exStatLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  textSuccess: {
    color: colors.success,
  },
  textDanger: {
    color: colors.danger,
  },

  // ---- Horizontal bars (exercise progression) ----
  hBarContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  hBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
  },
  hBarDate: {
    fontFamily: fonts.numbersBold,
    fontSize: 11,
    color: '#999',
    width: 44,
  },
  hBarTrack: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  hBarFill: {
    height: '100%' as any,
    backgroundColor: colors.orange,
    borderRadius: 6,
  },
  hBarValue: {
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    color: colors.text,
    width: 48,
    textAlign: 'right',
  },

  // ---- Session history table ----
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tableHeaderCell: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  tableCell: {
    flex: 1,
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    color: colors.text,
  },

  // ---- Empty ----
  emptyText: {
    color: '#666',
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 30,
  },
});
