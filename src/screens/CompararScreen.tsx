import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { Ionicons } from '@expo/vector-icons';

type TabKey = 'corpo' | 'treino' | 'pontos';

interface Friend {
  id: string;
  name: string;
  initials: string;
  body: { weight: number; bodyFat: number; chest: number; arm: number; waist: number };
  workout: { total: number; avgPerWeek: number; volume: number; streak: number };
  weeklyPoints: number[];
}

const MY_DATA: Friend = {
  id: 'me',
  name: 'Voce',
  initials: 'VS',
  body: { weight: 78, bodyFat: 15.2, chest: 102, arm: 38, waist: 82 },
  workout: { total: 156, avgPerWeek: 4.2, volume: 48500, streak: 12 },
  weeklyPoints: [320, 450, 280, 510],
};

const FRIENDS: Friend[] = [
  {
    id: 'f1',
    name: 'Rafael L.',
    initials: 'RL',
    body: { weight: 85, bodyFat: 18.5, chest: 108, arm: 40, waist: 88 },
    workout: { total: 203, avgPerWeek: 5.1, volume: 62000, streak: 22 },
    weeklyPoints: [410, 380, 520, 490],
  },
  {
    id: 'f2',
    name: 'Ana M.',
    initials: 'AM',
    body: { weight: 62, bodyFat: 22.0, chest: 88, arm: 28, waist: 68 },
    workout: { total: 98, avgPerWeek: 3.5, volume: 22000, streak: 5 },
    weeklyPoints: [180, 220, 310, 250],
  },
  {
    id: 'f3',
    name: 'Carlos P.',
    initials: 'CP',
    body: { weight: 92, bodyFat: 20.1, chest: 112, arm: 42, waist: 94 },
    workout: { total: 310, avgPerWeek: 5.8, volume: 85000, streak: 45 },
    weeklyPoints: [580, 620, 540, 600],
  },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'corpo', label: 'Corpo' },
  { key: 'treino', label: 'Treino' },
  { key: 'pontos', label: 'Pontos' },
];

interface Props {
  navigation: any;
}

function MetricRow({
  label,
  myValue,
  friendValue,
  unit,
  lowerIsBetter = false,
}: {
  label: string;
  myValue: number;
  friendValue: number;
  unit: string;
  lowerIsBetter?: boolean;
}) {
  const myWins = lowerIsBetter ? myValue <= friendValue : myValue >= friendValue;
  const friendWins = !myWins;

  return (
    <View style={styles.metricRow}>
      <View style={[styles.metricValue, myWins && styles.metricWinner]}>
        <Text style={[styles.metricNumber, myWins && styles.metricNumberWin]}>
          {myValue.toLocaleString()}
        </Text>
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={[styles.metricValue, friendWins && styles.metricWinner]}>
        <Text style={[styles.metricNumberFriend, friendWins && styles.metricNumberWin]}>
          {friendValue.toLocaleString()}
        </Text>
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
    </View>
  );
}

export default function CompararScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('corpo');
  const [selectedFriend, setSelectedFriend] = useState<Friend>(FRIENDS[0]);

  const weekLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  const maxPoints = Math.max(
    ...MY_DATA.weeklyPoints,
    ...selectedFriend.weeklyPoints
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comparar Progresso</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Friend selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.friendSelector}
      >
        {FRIENDS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.friendCircle,
              selectedFriend.id === f.id && styles.friendCircleActive,
            ]}
            onPress={() => setSelectedFriend(f)}
          >
            <Text
              style={[
                styles.friendInitials,
                selectedFriend.id === f.id && styles.friendInitialsActive,
              ]}
            >
              {f.initials}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.vsText}>
        Voce vs <Text style={styles.vsName}>{selectedFriend.name}</Text>
      </Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Column headers */}
        <View style={styles.columnHeaders}>
          <Text style={styles.columnYou}>Voce</Text>
          <Text style={styles.columnLabel} />
          <Text style={styles.columnFriend}>{selectedFriend.name.split(' ')[0]}</Text>
        </View>

        {activeTab === 'corpo' && (
          <>
            <MetricRow
              label="Peso"
              myValue={MY_DATA.body.weight}
              friendValue={selectedFriend.body.weight}
              unit="kg"
            />
            <MetricRow
              label="% Gordura"
              myValue={MY_DATA.body.bodyFat}
              friendValue={selectedFriend.body.bodyFat}
              unit="%"
              lowerIsBetter
            />
            <MetricRow
              label="Peito"
              myValue={MY_DATA.body.chest}
              friendValue={selectedFriend.body.chest}
              unit="cm"
            />
            <MetricRow
              label="Braco"
              myValue={MY_DATA.body.arm}
              friendValue={selectedFriend.body.arm}
              unit="cm"
            />
            <MetricRow
              label="Cintura"
              myValue={MY_DATA.body.waist}
              friendValue={selectedFriend.body.waist}
              unit="cm"
              lowerIsBetter
            />
          </>
        )}

        {activeTab === 'treino' && (
          <>
            <MetricRow
              label="Total Treinos"
              myValue={MY_DATA.workout.total}
              friendValue={selectedFriend.workout.total}
              unit=""
            />
            <MetricRow
              label="Media/Sem"
              myValue={MY_DATA.workout.avgPerWeek}
              friendValue={selectedFriend.workout.avgPerWeek}
              unit="x"
            />
            <MetricRow
              label="Volume Total"
              myValue={MY_DATA.workout.volume}
              friendValue={selectedFriend.workout.volume}
              unit="kg"
            />
            <MetricRow
              label="Streak"
              myValue={MY_DATA.workout.streak}
              friendValue={selectedFriend.workout.streak}
              unit="dias"
            />
          </>
        )}

        {activeTab === 'pontos' && (
          <View style={styles.chartContainer}>
            {weekLabels.map((label, idx) => {
              const myPts = MY_DATA.weeklyPoints[idx];
              const friendPts = selectedFriend.weeklyPoints[idx];
              const myH = maxPoints > 0 ? (myPts / maxPoints) * 120 : 0;
              const friendH = maxPoints > 0 ? (friendPts / maxPoints) * 120 : 0;

              return (
                <View key={label} style={styles.chartWeek}>
                  <View style={styles.chartBars}>
                    <View style={styles.chartBarWrapper}>
                      <Text style={styles.chartBarValue}>{myPts}</Text>
                      <View
                        style={[
                          styles.chartBar,
                          styles.chartBarMy,
                          { height: myH },
                        ]}
                      />
                    </View>
                    <View style={styles.chartBarWrapper}>
                      <Text style={styles.chartBarValue}>{friendPts}</Text>
                      <View
                        style={[
                          styles.chartBar,
                          styles.chartBarFriend,
                          { height: friendH },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.chartLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'pontos' && (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.orange }]} />
              <Text style={styles.legendText}>Voce</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.text }]} />
              <Text style={styles.legendText}>{selectedFriend.name}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 50,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  // Friend selector
  friendSelector: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  friendCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  friendCircleActive: {
    borderColor: colors.orange,
  },
  friendInitials: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
  },
  friendInitialsActive: {
    color: colors.orange,
  },
  vsText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  vsName: {
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.orange,
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  // Column headers
  columnHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  columnYou: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
    width: 80,
    textAlign: 'center',
  },
  columnLabel: {
    flex: 1,
  },
  columnFriend: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    width: 80,
    textAlign: 'center',
  },
  // Metric rows
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  metricValue: {
    width: 80,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  metricWinner: {
    backgroundColor: 'rgba(242,101,34,0.1)',
  },
  metricNumber: {
    fontSize: 18,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
  metricNumberFriend: {
    fontSize: 18,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },
  metricNumberWin: {
    color: colors.orange,
  },
  metricUnit: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  metricLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  // Points chart
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    marginTop: spacing.sm,
  },
  chartWeek: {
    alignItems: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 140,
  },
  chartBarWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    fontSize: 10,
    fontFamily: fonts.numbersBold,
    color: colors.textMuted,
    marginBottom: 4,
  },
  chartBar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarMy: {
    backgroundColor: colors.orange,
  },
  chartBarFriend: {
    backgroundColor: colors.text,
    opacity: 0.7,
  },
  chartLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
});
