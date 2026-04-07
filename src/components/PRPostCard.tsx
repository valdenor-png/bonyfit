import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, spacing, radius } from '../tokens';

// ─── Types ─────────────────────────────────────────────────────
interface PRPostCardProps {
  exercicio: string;
  cargaAnterior: number;
  cargaNova: number;
  comentario?: string;
}

// ─── Component ─────────────────────────────────────────────────
export default function PRPostCard({
  exercicio,
  cargaAnterior,
  cargaNova,
  comentario,
}: PRPostCardProps) {
  const diff = cargaNova - cargaAnterior;
  const diffSign = diff >= 0 ? '+' : '';

  return (
    <LinearGradient
      colors={['#DAA520', '#B8860B']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Header */}
      <Text style={styles.header}>🏆 NOVO RECORDE!</Text>

      {/* Exercise Name */}
      <Text style={styles.exercicio}>{exercicio}</Text>

      {/* Weight Transition */}
      <View style={styles.weightRow}>
        <Text style={styles.weightOld}>{cargaAnterior}kg</Text>
        <Text style={styles.arrow}> → </Text>
        <Text style={styles.weightNew}>{cargaNova}kg</Text>
        <View style={styles.diffBadge}>
          <Text style={styles.diffText}>
            {diffSign}{diff}kg
          </Text>
        </View>
      </View>

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
  exercicio: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weightOld: {
    fontSize: 20,
    fontFamily: fonts.numbersBold,
    color: 'rgba(255,255,255,0.7)',
  },
  arrow: {
    fontSize: 22,
    fontFamily: fonts.numbersBold,
    color: '#FFFFFF',
  },
  weightNew: {
    fontSize: 24,
    fontFamily: fonts.numbersExtraBold,
    color: '#FFFFFF',
  },
  diffBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 10,
  },
  diffText: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: '#FFFFFF',
  },
  comentario: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
