import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import type { SetStatus } from '../types/workout';

interface SetRowProps {
  setNumber: number;
  reps: number;
  weight: number;
  restSeconds: number;
  status: SetStatus;
  pointsEarned?: number;
}

export default function SetRow({
  setNumber,
  reps,
  weight,
  restSeconds,
  status,
  pointsEarned = 15,
}: SetRowProps) {
  const numberBg =
    status === 'done'
      ? colors.success
      : status === 'current'
        ? colors.orange
        : colors.elevated;

  const numberColor =
    status === 'pending' ? colors.textSecondary : colors.text;

  return (
    <View
      style={[
        styles.row,
        status === 'current' && styles.rowCurrent,
      ]}
    >
      {/* Set number */}
      <View style={[styles.numberBox, { backgroundColor: numberBg }]}>
        <Text style={[styles.numberText, { color: numberColor }]}>
          {status === 'done' ? '✓' : setNumber}
        </Text>
      </View>

      {/* Main info */}
      <View style={styles.info}>
        <Text
          style={[
            styles.repsText,
            status === 'done' && styles.repsTextDone,
            status === 'current' && styles.repsTextCurrent,
          ]}
        >
          {reps} reps — {weight}kg
        </Text>
        <Text style={styles.restText}>Descanso {restSeconds}s</Text>
      </View>

      {/* Status indicator */}
      <View style={styles.statusArea}>
        {status === 'done' && (
          <Text style={styles.pointsText}>+{pointsEarned}</Text>
        )}
        {status === 'current' && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>AGORA</Text>
          </View>
        )}
        {status === 'pending' && (
          <View style={styles.pendingDot} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowCurrent: {
    backgroundColor: 'rgba(242,101,34,0.08)',
    borderRadius: radius.md,
    borderBottomWidth: 0,
    marginVertical: spacing.xs,
  },
  numberBox: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  repsText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  repsTextDone: {
    color: colors.success,
  },
  repsTextCurrent: {
    color: colors.text,
  },
  restText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  statusArea: {
    marginLeft: spacing.md,
    alignItems: 'flex-end',
    minWidth: 44,
  },
  pointsText: {
    color: colors.success,
    fontFamily: fonts.numbersBold,
    fontSize: 13,
  },
  currentBadge: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  currentBadgeText: {
    color: colors.text,
    fontFamily: fonts.numbersBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
});
