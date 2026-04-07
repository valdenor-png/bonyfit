import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';

// ─── Split Gradients ───────────────────────────────────────────
const SPLIT_GRADIENTS: Record<string, [string, string]> = {
  A: [colors.orange, colors.orangeDark],
  B: ['#3B82F6', '#1D4ED8'],
  C: ['#2ECC71', '#1A9B54'],
  D: ['#8B5CF6', '#6D28D9'],
};

// ─── Types ─────────────────────────────────────────────────────
interface WorkoutPostCardProps {
  splitLabel: string;
  splitNome: string;
  duracao: number;
  volume: number;
  exercicios: number;
  series: number;
  rating?: number;
  comentario?: string;
}

// ─── Component ─────────────────────────────────────────────────
export default function WorkoutPostCard({
  splitLabel,
  splitNome,
  duracao,
  volume,
  exercicios,
  series,
  rating,
  comentario,
}: WorkoutPostCardProps) {
  const gradient = SPLIT_GRADIENTS[splitLabel] || SPLIT_GRADIENTS.A;

  const renderStars = (count: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= count ? '★' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Header */}
      <Text style={styles.header}>🔥 TREINO COMPLETO</Text>

      {/* Split Info */}
      <Text style={styles.splitInfo}>
        {splitLabel} — {splitNome}
      </Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Text style={styles.stat}>⏱ {duracao}min</Text>
        <Text style={styles.statDivider}>|</Text>
        <Text style={styles.stat}>📊 {volume.toFixed(3)}kg</Text>
        <Text style={styles.statDivider}>|</Text>
        <Text style={styles.stat}>💪 {exercicios} exercicios</Text>
        <Text style={styles.statDivider}>|</Text>
        <Text style={styles.stat}>{series} series</Text>
      </View>

      {/* Rating */}
      {rating != null && rating > 0 && (
        <View style={styles.ratingRow}>{renderStars(rating)}</View>
      )}

      {/* Comment */}
      {comentario ? (
        <Text style={styles.comentario}>{comentario}</Text>
      ) : null}
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: 0,
  },
  header: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  splitInfo: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  stat: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: '#FFFFFF',
  },
  statDivider: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  star: {
    fontSize: 18,
    color: '#FFD700',
    marginRight: 2,
  },
  comentario: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
