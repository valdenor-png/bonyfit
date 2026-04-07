import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, spacing, radius } from '../tokens';

// ─── Level Config ──────────────────────────────────────────────
const LEVEL_CONFIG: Record<string, { color: string; emoji: string }> = {
  Bronze: { color: '#CD7F32', emoji: '🥉' },
  Prata: { color: '#A0A0A0', emoji: '🥈' },
  Ouro: { color: '#DAA520', emoji: '🥇' },
  Platina: { color: '#6BB5C9', emoji: '💎' },
  Diamante: { color: '#5B9BD5', emoji: '💠' },
  Master: { color: '#9B59B6', emoji: '👑' },
};

// ─── Types ─────────────────────────────────────────────────────
interface LevelUpPostCardProps {
  nivelAnterior: string;
  nivelNovo: string;
}

// ─── Component ─────────────────────────────────────────────────
export default function LevelUpPostCard({
  nivelAnterior,
  nivelNovo,
}: LevelUpPostCardProps) {
  const prevConfig = LEVEL_CONFIG[nivelAnterior] || { color: '#999', emoji: '⭐' };
  const newConfig = LEVEL_CONFIG[nivelNovo] || { color: '#999', emoji: '⭐' };

  return (
    <LinearGradient
      colors={['#8B5CF6', '#6D28D9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Header */}
      <Text style={styles.header}>⬆️ SUBIU DE NIVEL!</Text>

      {/* Level Transition */}
      <View style={styles.transitionRow}>
        <View style={styles.levelBox}>
          <View style={[styles.badge, { backgroundColor: prevConfig.color + '33' }]}>
            <Text style={styles.levelEmoji}>{prevConfig.emoji}</Text>
          </View>
          <Text style={[styles.levelName, { color: prevConfig.color }]}>
            {nivelAnterior}
          </Text>
        </View>

        <Text style={styles.arrow}>→</Text>

        <View style={styles.levelBox}>
          <View style={[styles.badge, styles.badgeNew, { backgroundColor: newConfig.color + '33', borderColor: newConfig.color }]}>
            <Text style={styles.levelEmojiNew}>{newConfig.emoji}</Text>
          </View>
          <Text style={[styles.levelName, styles.levelNameNew, { color: newConfig.color }]}>
            {nivelNovo}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: 0,
    alignItems: 'center',
  },
  header: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  transitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  levelBox: {
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNew: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  levelEmoji: {
    fontSize: 28,
  },
  levelEmojiNew: {
    fontSize: 32,
  },
  levelName: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  levelNameNew: {
    fontSize: 15,
  },
  arrow: {
    fontSize: 28,
    fontFamily: fonts.numbersBold,
    color: '#FFFFFF',
    marginHorizontal: 4,
  },
});
