import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';
import Skull from '../components/Skull';

type TabKey = 'geral' | 'unidade' | 'mensal';

interface RankingEntry {
  id: string;
  position: number;
  name: string;
  level: string;
  streak: number;
  points: number;
}

const MOCK_MY_STATS = {
  position: 14,
  totalUsers: 342,
  points: 12500,
  streak: 15,
  level: 'Ouro',
};

const MOCK_RANKING: RankingEntry[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  position: i + 1,
  name: i === 13 ? 'Você' : `${String.fromCharCode(65 + (i % 26))}***${String.fromCharCode(97 + ((i * 3) % 26))} ${String.fromCharCode(65 + ((i * 7) % 26))}.`,
  level: i < 3 ? 'Diamante' : i < 8 ? 'Platina' : i < 15 ? 'Ouro' : 'Prata',
  streak: Math.max(1, 30 - i * 2),
  points: Math.max(1000, 50000 - i * 2200),
}));

const TABS: { key: TabKey; label: string }[] = [
  { key: 'geral', label: 'geral' },
  { key: 'unidade', label: 'unidade' },
  { key: 'mensal', label: 'mensal' },
];

export default function RankingScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('geral');

  return (
    <View style={styles.container}>
      {/* My stats card */}
      <LinearGradient
        colors={[colors.orangeDark, colors.orange]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.myCard}
      >
        <View style={styles.skullDecor}>
          <Skull size={80} color="#FFFFFF" opacity={0.08} />
        </View>
        <View style={styles.positionRow}>
          <Text style={styles.positionNumber}>#{MOCK_MY_STATS.position}</Text>
          <Text style={styles.positionTotal}>de {MOCK_MY_STATS.totalUsers}</Text>
        </View>
        <View style={styles.myStats}>
          <View style={styles.myStat}>
            <Text style={styles.myStatLabel}>Pontos</Text>
            <Text style={styles.myStatValue}>{MOCK_MY_STATS.points.toLocaleString()}</Text>
          </View>
          <View style={styles.myStat}>
            <Text style={styles.myStatLabel}>Streak</Text>
            <Text style={styles.myStatValue}>🔥 {MOCK_MY_STATS.streak}</Text>
          </View>
          <View style={styles.myStat}>
            <Text style={styles.myStatLabel}>Nível</Text>
            <Text style={styles.myStatValue}>{MOCK_MY_STATS.level}</Text>
          </View>
        </View>
      </LinearGradient>

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

      {/* Ranking list */}
      <FlatList
        data={MOCK_RANKING}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isTop3 = item.position <= 3;
          const isMe = item.name === 'Você';
          return (
            <View style={[styles.rankCard, isMe && styles.rankCardMe]}>
              <View style={[styles.posCircle, isTop3 && styles.posCircleTop]}>
                <Text style={[styles.posText, isTop3 && styles.posTextTop]}>
                  {item.position}
                </Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={[styles.rankName, isMe && styles.rankNameMe]}>
                  {item.name}
                </Text>
                <Text style={styles.rankSub}>
                  {item.level} • 🔥 {item.streak}
                </Text>
              </View>
              <Text style={styles.rankPoints}>
                {item.points.toLocaleString()}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  myCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.pill,
    padding: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  skullDecor: { position: 'absolute', top: -10, right: -10 },
  positionRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.lg },
  positionNumber: { fontSize: 40, fontFamily: fonts.numbersExtraBold, color: colors.text },
  positionTotal: { fontSize: 14, fontFamily: fonts.body, color: 'rgba(255,255,255,0.7)' },
  myStats: { flexDirection: 'row', justifyContent: 'space-between' },
  myStat: { alignItems: 'center' },
  myStatLabel: { fontSize: 11, fontFamily: fonts.body, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  myStatValue: { fontSize: 18, fontFamily: fonts.numbersBold, color: colors.text },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    padding: spacing.xs,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.orange },
  tabText: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  tabTextActive: { color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  rankCardMe: { borderWidth: 1, borderColor: 'rgba(242, 101, 34, 0.3)' },
  posCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posCircleTop: { backgroundColor: 'rgba(242, 101, 34, 0.3)' },
  posText: { fontSize: 13, fontFamily: fonts.numbersBold, color: colors.textSecondary },
  posTextTop: { color: colors.orange },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  rankNameMe: { color: colors.orange },
  rankSub: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2 },
  rankPoints: { fontSize: 15, fontFamily: fonts.numbersBold, color: colors.orange },
});
