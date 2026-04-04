import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../tokens';
import ProgressRing from '../components/ProgressRing';

// ─── TYPES ──────────────────────────────────────────────
interface WaterEntry {
  id: string;
  time: string;
  amount: number;
}

interface DayData {
  day: string;
  amount: number;
}

// ─── MOCK DATA ──────────────────────────────────────────
const INITIAL_ENTRIES: WaterEntry[] = [
  { id: '1', time: '07:15', amount: 250 },
  { id: '2', time: '09:30', amount: 150 },
  { id: '3', time: '11:45', amount: 500 },
  { id: '4', time: '14:00', amount: 150 },
  { id: '5', time: '16:20', amount: 150 },
];

const WEEKLY_DATA: DayData[] = [
  { day: 'Seg', amount: 2600 },
  { day: 'Ter', amount: 2100 },
  { day: 'Qua', amount: 2800 },
  { day: 'Qui', amount: 1900 },
  { day: 'Sex', amount: 2500 },
  { day: 'Sáb', amount: 3000 },
  { day: 'Dom', amount: 1200 },
];

const QUICK_ADD = [
  { label: 'Copo', emoji: '\uD83E\uDD43', amount: 150 },
  { label: 'Copo grande', emoji: '\uD83E\uDD64', amount: 250 },
  { label: 'Garrafa', emoji: '\uD83C\uDF7E', amount: 500 },
  { label: 'Garrafão', emoji: '\uD83E\uDEB3', amount: 1000 },
];

function formatLiters(ml: number): string {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`;
  }
  return `${ml}ml`;
}

function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export default function AguaScreen() {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<WaterEntry[]>(INITIAL_ENTRIES);
  const [goal, setGoal] = useState(2500);

  const totalConsumed = entries.reduce((sum, e) => sum + e.amount, 0);
  const progress = Math.min(totalConsumed / goal, 1);

  const handleAdd = (amount: number) => {
    const newEntry: WaterEntry = {
      id: Date.now().toString(),
      time: getCurrentTime(),
      amount,
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remover', 'Deseja remover este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setEntries((prev) => prev.filter((e) => e.id !== id)) },
    ]);
  };

  const handleEditGoal = () => {
    const options = [2000, 2500, 3000, 3500, 4000];
    Alert.alert(
      'Meta diária',
      'Selecione sua meta de hidratação',
      options.map((ml) => ({
        text: `${ml}ml`,
        onPress: () => setGoal(ml),
      })),
    );
  };

  const maxWeekly = Math.max(...WEEKLY_DATA.map((d) => d.amount), goal);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hidratação</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Progress Ring */}
        <View style={styles.ringSection}>
          <ProgressRing progress={progress} size={200} strokeWidth={12} color={progress >= 1 ? colors.success : colors.info}>
            <View style={styles.ringContent}>
              <Text style={styles.ringAmount}>{formatLiters(totalConsumed)}</Text>
              <Text style={styles.ringGoal}>de {formatLiters(goal)}</Text>
            </View>
          </ProgressRing>
        </View>

        {/* Quick Add Buttons */}
        <Text style={styles.sectionTitle}>Adicionar água</Text>
        <View style={styles.quickAddRow}>
          {QUICK_ADD.map((item) => (
            <TouchableOpacity
              key={item.amount}
              style={styles.quickAddCard}
              onPress={() => handleAdd(item.amount)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAddEmoji}>{item.emoji}</Text>
              <Text style={styles.quickAddAmount}>+{item.amount}ml</Text>
              <Text style={styles.quickAddLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Log */}
        <Text style={styles.sectionTitle}>Hoje</Text>
        <View style={styles.logCard}>
          {entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.logRow}
              onLongPress={() => handleDelete(entry.id)}
              activeOpacity={0.8}
            >
              <View style={styles.logLeft}>
                <Ionicons name="water" size={18} color={colors.info} />
                <Text style={styles.logTime}>{entry.time}</Text>
              </View>
              <Text style={styles.logAmount}>+{entry.amount}ml</Text>
            </TouchableOpacity>
          ))}
          {entries.length === 0 && (
            <Text style={styles.emptyText}>Nenhum registro hoje</Text>
          )}
        </View>

        {/* Weekly Chart */}
        <Text style={styles.sectionTitle}>Semana</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            {WEEKLY_DATA.map((day) => {
              const barHeight = (day.amount / maxWeekly) * 120;
              const isGoalMet = day.amount >= goal;
              return (
                <View key={day.day} style={styles.chartCol}>
                  <Text style={styles.chartValue}>{formatLiters(day.amount)}</Text>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isGoalMet ? colors.success : colors.info,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartLabel, isGoalMet && { color: colors.success }]}>{day.day}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.goalLine}>
            <View style={styles.goalDash} />
            <Text style={styles.goalLineText}>Meta: {formatLiters(goal)}</Text>
          </View>
        </View>

        {/* Daily Goal Card */}
        <TouchableOpacity style={styles.goalCard} onPress={handleEditGoal} activeOpacity={0.7}>
          <View style={styles.goalCardLeft}>
            <Ionicons name="flag" size={20} color={colors.orange} />
            <View style={{ marginLeft: spacing.md }}>
              <Text style={styles.goalCardTitle}>Meta diária</Text>
              <Text style={styles.goalCardValue}>{formatLiters(goal)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  ringSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  ringContent: {
    alignItems: 'center',
  },
  ringAmount: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 40,
    color: colors.text,
  },
  ringGoal: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  quickAddCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  quickAddEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  quickAddAmount: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    color: colors.info,
  },
  quickAddLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  logCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logTime: {
    fontFamily: fonts.numbers,
    fontSize: 14,
    color: colors.textSecondary,
  },
  logAmount: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.info,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartValue: {
    fontFamily: fonts.numbers,
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 4,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    width: 20,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
  },
  goalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  goalDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: colors.textMuted,
  },
  goalLineText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalCardTitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  goalCardValue: {
    fontFamily: fonts.numbersBold,
    fontSize: 18,
    color: colors.text,
  },
});
