import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import type { ExerciseProgress } from '../types/workout';

interface ExerciseCardProps {
  exerciseProgress: ExerciseProgress;
  index: number;
  onPress: (exerciseProgress: ExerciseProgress) => void;
}

export default function ExerciseCard({
  exerciseProgress,
  index,
  onPress,
}: ExerciseCardProps) {
  const { exercise, status, setsCompleted, totalSets, pointsEarned } =
    exerciseProgress;

  const progressRatio = totalSets > 0 ? setsCompleted / totalSets : 0;

  const circleStyle = [
    styles.circle,
    status === 'in_progress' && styles.circleInProgress,
    status === 'completed' && styles.circleCompleted,
    status === 'skipped' && styles.circleSkipped,
  ];

  const circleContent = () => {
    if (status === 'completed') {
      return <Text style={styles.circleCheck}>✓</Text>;
    }
    if (status === 'skipped') {
      return <Text style={styles.circleSkipIcon}>↺</Text>;
    }
    return <Text style={styles.circleNumber}>{index + 1}</Text>;
  };

  return (
    <Pressable
      onPress={() => onPress(exerciseProgress)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={circleStyle}>{circleContent()}</View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={styles.detail}>
          {exercise.muscle_group} · {totalSets} séries × {exercise.reps} reps
        </Text>

        {status === 'in_progress' && (
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]}
            />
          </View>
        )}
      </View>

      <View style={styles.right}>
        {status === 'completed' ? (
          <Text style={styles.checkLabel}>✓</Text>
        ) : (
          <Text style={styles.points}>+{pointsEarned > 0 ? pointsEarned : 50}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    opacity: 0.85,
    backgroundColor: colors.elevated,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInProgress: {
    backgroundColor: colors.orange,
  },
  circleCompleted: {
    backgroundColor: colors.success,
  },
  circleSkipped: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.orange,
  },
  circleNumber: {
    color: colors.textSecondary,
    fontFamily: fonts.numbersBold,
    fontSize: 15,
  },
  circleCheck: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  circleSkipIcon: {
    color: colors.orange,
    fontSize: 18,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  detail: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.elevated,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.orange,
    borderRadius: 2,
  },
  right: {
    marginLeft: spacing.md,
    alignItems: 'flex-end',
  },
  points: {
    color: colors.orange,
    fontFamily: fonts.numbersBold,
    fontSize: 14,
  },
  checkLabel: {
    color: colors.success,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
  },
});
