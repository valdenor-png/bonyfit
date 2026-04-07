import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, spacing, radius } from '../tokens';

// ─── Types ─────────────────────────────────────────────────────
interface StreakPostCardProps {
  dias: number;
  comentario?: string;
}

// ─── Component ─────────────────────────────────────────────────
export default function StreakPostCard({
  dias,
  comentario,
}: StreakPostCardProps) {
  return (
    <LinearGradient
      colors={['#E74C3C', '#F26522']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Fire Pattern Background */}
      <View style={styles.firePattern}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <Text style={[styles.fireEmoji, styles.fireEmojiOffset1]}>🔥</Text>
        <Text style={[styles.fireEmoji, styles.fireEmojiOffset2]}>🔥</Text>
        <Text style={[styles.fireEmoji, styles.fireEmojiOffset3]}>🔥</Text>
        <Text style={[styles.fireEmoji, styles.fireEmojiOffset4]}>🔥</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.header}>🔥 STREAK</Text>
        <Text style={styles.bigNumber}>{dias}</Text>
        <Text style={styles.diasLabel}>DIAS!</Text>

        {/* Comment */}
        {comentario ? (
          <Text style={styles.comentario}>{comentario}</Text>
        ) : null}
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
    overflow: 'hidden',
    minHeight: 140,
  },
  firePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 48,
    position: 'absolute',
  },
  fireEmojiOffset1: {
    top: 10,
    left: 20,
    fontSize: 32,
  },
  fireEmojiOffset2: {
    top: 5,
    right: 30,
    fontSize: 40,
  },
  fireEmojiOffset3: {
    bottom: 10,
    left: 50,
    fontSize: 28,
  },
  fireEmojiOffset4: {
    bottom: 15,
    right: 15,
    fontSize: 36,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  bigNumber: {
    fontSize: 64,
    fontFamily: fonts.numbersExtraBold,
    color: '#FFFFFF',
    lineHeight: 72,
  },
  diasLabel: {
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    letterSpacing: 3,
    marginTop: -4,
  },
  comentario: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.md,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
