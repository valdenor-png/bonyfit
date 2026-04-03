import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import ProgressRing from './ProgressRing';

interface TopBarProps {
  elapsed: number;
  progress: number;
  completedSets: number;
  totalSets: number;
  points: number;
  lastPointsGained: number;
  pointsAnim: Animated.Value;
  pointsOpacity: Animated.Value;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TopBar({
  elapsed,
  progress,
  completedSets,
  totalSets,
  points,
  lastPointsGained,
  pointsAnim,
  pointsOpacity,
}: TopBarProps) {
  return (
    <View style={styles.container}>
      {/* Time Column */}
      <View style={styles.column}>
        <Text style={styles.sublabel}>Na academia</Text>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
      </View>

      {/* Progress Ring Column */}
      <View style={styles.columnCenter}>
        <ProgressRing progress={progress} size={46} strokeWidth={3.5} color={colors.orange}>
          <Text style={styles.ringText}>
            {completedSets}/{totalSets}
          </Text>
        </ProgressRing>
      </View>

      {/* Points Column */}
      <View style={styles.columnRight}>
        <Text style={styles.sublabel}>Pontos</Text>
        <View style={styles.pointsRow}>
          <Text style={styles.pointsValue}>{points}</Text>
          {lastPointsGained > 0 && (
            <Animated.Text
              style={[
                styles.pointsPopup,
                {
                  opacity: pointsOpacity,
                  transform: [{ translateY: pointsAnim }],
                },
              ]}
            >
              +{lastPointsGained}
            </Animated.Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  column: { flex: 1, alignItems: 'flex-start' },
  columnCenter: { alignItems: 'center', paddingHorizontal: spacing.sm },
  columnRight: { flex: 1, alignItems: 'flex-end' },
  sublabel: { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, marginBottom: 2 },
  timer: { fontFamily: fonts.numbersBold, fontSize: 18, color: colors.text },
  ringText: { fontFamily: fonts.numbersBold, fontSize: 10, color: colors.text },
  pointsRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  pointsValue: { fontFamily: fonts.numbersExtraBold, fontSize: 18, color: colors.orange },
  pointsPopup: {
    position: 'absolute',
    right: -30,
    top: -5,
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    color: colors.success,
  },
});
