import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, spacing, radius } from '../tokens';

interface RestTimerProps {
  totalSeconds: number;
  onComplete: () => void;
  nextExerciseName: string;
  nextSetInfo: string;
}

const RING_SIZE = 140;
const STROKE_WIDTH = 8;
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RestTimer({
  totalSeconds,
  onComplete,
  nextExerciseName,
  nextSetInfo,
}: RestTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDone = remaining <= 0;

  useEffect(() => {
    setRemaining(totalSeconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalSeconds]);

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const ringColor = isDone ? colors.success : colors.orange;

  return (
    <View style={styles.container}>
      {/* Progress Ring */}
      <View style={styles.ringWrapper}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          {/* Background track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={colors.elevated}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          {isDone ? (
            <Text style={styles.checkIcon}>✓</Text>
          ) : (
            <Text style={styles.timerText}>{formatTime(remaining)}</Text>
          )}
          {isDone && <Text style={styles.doneLabel}>Pronto!</Text>}
        </View>
      </View>

      {/* Warning card */}
      {!isDone && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            🔒 Descanso obrigatório. Aguarde o timer.
          </Text>
        </View>
      )}

      {/* Next set info card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Próxima série</Text>
        <Text style={styles.infoExercise}>{nextExerciseName}</Text>
        <Text style={styles.infoSet}>{nextSetInfo}</Text>
      </View>

      {/* Action button */}
      <Pressable
        onPress={isDone ? onComplete : undefined}
        disabled={!isDone}
        style={({ pressed }) => [
          styles.button,
          isDone ? styles.buttonActive : styles.buttonDisabled,
          isDone && pressed && styles.buttonPressed,
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            !isDone && styles.buttonTextDisabled,
          ]}
        >
          {isDone ? 'Iniciar próxima série' : `Aguarde ${remaining}s`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: colors.text,
    fontFamily: fonts.numbersExtraBold,
    fontSize: 34,
  },
  checkIcon: {
    color: colors.success,
    fontSize: 40,
    fontFamily: fonts.bodyBold,
  },
  doneLabel: {
    color: colors.success,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  warningCard: {
    backgroundColor: 'rgba(231,76,60,0.12)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xxl,
    width: '100%',
  },
  warningText: {
    color: colors.danger,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  infoLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoExercise: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    marginTop: spacing.xs,
  },
  infoSet: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  button: {
    marginTop: spacing.xxl,
    width: '100%',
    height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: colors.orange,
  },
  buttonPressed: {
    backgroundColor: colors.orangeDark,
  },
  buttonDisabled: {
    backgroundColor: colors.elevated,
  },
  buttonText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
});
