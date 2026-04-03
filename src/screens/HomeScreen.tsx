import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import Skull from '../components/Skull';
import ProgressRing from '../components/ProgressRing';
import UnitBubble from '../components/UnitBubble';

interface Props {
  navigation: any;
}

const MOCK_UNITS = [
  { id: '1', name: 'Centro', capacity: 120, current_count: 45 },
  { id: '2', name: 'Jaderlândia', capacity: 80, current_count: 62 },
  { id: '3', name: 'Nova Olinda', capacity: 100, current_count: 30 },
  { id: '4', name: 'Apeú', capacity: 60, current_count: 55 },
  { id: '5', name: 'Icuí', capacity: 90, current_count: 20 },
];

const MOCK_USER = {
  name: 'João',
  level: 'Ouro',
  points: 12500,
  streak: 15,
  todayWorkout: 'Peito + Tríceps + Ombro',
  ranking: 14,
};

export default function HomeScreen({ navigation }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate('PerfilPessoal')}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {MOCK_USER.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{MOCK_USER.name}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Skull size={16} color={colors.orange} />
          <Text style={styles.levelText}>{MOCK_USER.level}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{MOCK_USER.points.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pontos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {MOCK_USER.streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>#{MOCK_USER.ranking}</Text>
          <Text style={styles.statLabel}>Ranking</Text>
        </View>
      </View>

      {/* Today's workout card */}
      <TouchableOpacity
        style={styles.workoutCard}
        onPress={() => navigation.navigate('Treino')}
        activeOpacity={0.8}
      >
        <View style={styles.workoutLeft}>
          <Text style={styles.workoutLabel}>Treino de hoje</Text>
          <Text style={styles.workoutName}>{MOCK_USER.todayWorkout}</Text>
          <Text style={styles.workoutSub}>6 exercícios • ~50 min</Text>
        </View>
        <View style={styles.workoutBtn}>
          <Skull size={20} color="#FFFFFF" />
          <Text style={styles.workoutBtnText}>Iniciar</Text>
        </View>
      </TouchableOpacity>

      {/* Unit capacity */}
      <Text style={styles.sectionTitle}>Lotação das unidades</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bubbles}
      >
        {MOCK_UNITS.map((unit) => (
          <UnitBubble
            key={unit.id}
            name={unit.name}
            current={unit.current_count}
            capacity={unit.capacity}
          />
        ))}
      </ScrollView>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Acesso rápido</Text>
      <View style={styles.quickGrid}>
        <QuickAction icon="🏆" label="Ranking" onPress={() => navigation.navigate('Menu', { screen: 'Ranking' })} />
        <QuickAction icon="📊" label="Histórico" onPress={() => navigation.navigate('Menu', { screen: 'HistoricoTreino' })} />
        <QuickAction icon="🥗" label="Nutrição" onPress={() => navigation.navigate('Menu', { screen: 'Nutricao' })} />
        <QuickAction icon="👨‍🏫" label="Personais" onPress={() => navigation.navigate('Menu', { screen: 'Personal' })} />
        <QuickAction icon="🎯" label="Desafios" onPress={() => navigation.navigate('Menu', { screen: 'Desafios' })} />
        <QuickAction icon="🎁" label="Prêmios" onPress={() => navigation.navigate('Menu', { screen: 'Recompensas' })} />
      </View>
    </ScrollView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  avatarBtn: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    borderWidth: 2,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  headerCenter: { flex: 1 },
  greeting: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary },
  name: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  levelText: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.orange },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontFamily: fonts.numbersBold, color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 10, fontFamily: fonts.body, color: colors.textMuted },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(242, 101, 34, 0.2)',
    marginBottom: spacing.xxl,
  },
  workoutLeft: { flex: 1 },
  workoutLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginBottom: 4 },
  workoutName: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: 4 },
  workoutSub: { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  workoutBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  workoutBtnText: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.text },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  bubbles: { paddingHorizontal: spacing.xl, gap: spacing.lg, marginBottom: spacing.xxl },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  quickItem: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 11, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
});
