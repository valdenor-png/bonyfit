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

interface Props {
  navigation: any;
}

const MOCK_USER = {
  name: 'João Silva',
  memberSince: 'Janeiro 2025',
  level: 'Ouro',
  totalWorkouts: 87,
  points: 12500,
  streak: 15,
};

const ACHIEVEMENTS = [
  { emoji: '🔥', label: 'Streak 7d', unlocked: true },
  { emoji: '💪', label: 'Primeiro treino', unlocked: true },
  { emoji: '🏆', label: 'Top 10', unlocked: true },
  { emoji: '⚡', label: 'Madrugador', unlocked: true },
  { emoji: '👑', label: 'Diamante', unlocked: false },
  { emoji: '🎯', label: 'Streak 30d', unlocked: false },
  { emoji: '💎', label: '100 treinos', unlocked: false },
  { emoji: '🌟', label: '50k pontos', unlocked: false },
  { emoji: '🔱', label: 'Lenda', unlocked: false },
];

export default function ProfileScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Settings icon */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{MOCK_USER.name[0]}</Text>
        </View>
        <Text style={styles.name}>{MOCK_USER.name}</Text>
        <Text style={styles.memberSince}>Membro desde {MOCK_USER.memberSince}</Text>
        <View style={styles.levelBadge}>
          <Skull size={14} color={colors.orange} />
          <Text style={styles.levelText}>{MOCK_USER.level}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_USER.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Treinos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_USER.points.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pontos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>🔥 {MOCK_USER.streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Conquistas</Text>
      <View style={styles.achievements}>
        {ACHIEVEMENTS.map((a, i) => (
          <View
            key={i}
            style={[styles.achievement, !a.unlocked && styles.achievementLocked]}
          >
            <Text style={[styles.achievementEmoji, !a.unlocked && styles.achievementEmojiLocked]}>
              {a.emoji}
            </Text>
            <Text style={[styles.achievementLabel, !a.unlocked && styles.achievementLabelLocked]}>
              {a.label}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', paddingVertical: spacing.lg },
  settingsIcon: { fontSize: 24, color: colors.textSecondary },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(242, 101, 34, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(242, 101, 34, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 32, fontFamily: fonts.bodyBold, color: colors.orange },
  name: { fontSize: 22, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.xs },
  memberSince: { fontSize: 13, fontFamily: fonts.body, color: colors.textMuted, marginBottom: spacing.md },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  levelText: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.orange },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontFamily: fonts.numbersBold, color: colors.text, marginBottom: 4 },
  statLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted },
  statDivider: { width: 1, backgroundColor: colors.elevated },
  sectionTitle: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.lg },
  achievements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  achievement: {
    width: '30%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  achievementLocked: { opacity: 0.35 },
  achievementEmoji: { fontSize: 28 },
  achievementEmojiLocked: {},
  achievementLabel: { fontSize: 11, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  achievementLabelLocked: {},
});
