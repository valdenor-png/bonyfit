import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import ProgressRing from './ProgressRing';
import { colors, fonts, spacing, radius } from '../tokens';

const PRESETS = [30, 60, 90, 120, 180];

interface RestTimerOverlayProps {
  initialSeconds?: number;
  visible: boolean;
  onDismiss: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPreset(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = seconds / 60;
  return `${m}min`;
}

export default function RestTimerOverlay({
  initialSeconds = 90,
  visible,
  onDismiss,
}: RestTimerOverlayProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start/reset timer when totalSeconds changes or overlay becomes visible
  useEffect(() => {
    if (!visible) {
      clearTimer();
      return;
    }

    setRemaining(totalSeconds);
    setIsRunning(true);
    clearTimer();

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          Vibration.vibrate([0, 300, 100, 300]);
          // Auto-dismiss after vibration
          setTimeout(() => {
            onDismiss();
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [totalSeconds, visible, clearTimer, onDismiss]);

  const handlePreset = (seconds: number) => {
    setTotalSeconds(seconds);
  };

  const handleAdjust = (delta: number) => {
    setRemaining((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      return next;
    });
    setTotalSeconds((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      return next;
    });
  };

  const handleSkip = () => {
    clearTimer();
    onDismiss();
  };

  if (!visible) return null;

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        {/* Circular countdown */}
        <ProgressRing
          progress={progress}
          size={160}
          strokeWidth={8}
          color={colors.orange}
        >
          <Text style={styles.timeText}>{formatTime(remaining)}</Text>
        </ProgressRing>

        {/* Preset buttons */}
        <View style={styles.presetsRow}>
          {PRESETS.map((sec) => (
            <TouchableOpacity
              key={sec}
              style={[
                styles.presetChip,
                totalSeconds === sec && styles.presetChipActive,
              ]}
              onPress={() => handlePreset(sec)}
            >
              <Text
                style={[
                  styles.presetText,
                  totalSeconds === sec && styles.presetTextActive,
                ]}
              >
                {formatPreset(sec)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Adjust buttons */}
        <View style={styles.adjustRow}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => handleAdjust(-15)}
          >
            <Text style={styles.adjustText}>-15s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => handleAdjust(15)}
          >
            <Text style={styles.adjustText}>+15s</Text>
          </TouchableOpacity>
        </View>

        {/* Skip button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    width: '100%',
  },
  timeText: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 36,
    color: colors.text,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  presetChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  presetChipActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  presetText: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  presetTextActive: {
    color: colors.text,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  adjustButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.elevated,
  },
  adjustText: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.text,
  },
  skipButton: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  skipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.orange,
  },
});
