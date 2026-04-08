import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts } from '../../tokens';
import { getLevelFromPoints } from '../../constants/levels';

interface Props {
  points: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export default function XPRing({ points, size = 90, strokeWidth = 5, showLabel = true }: Props) {
  const { level, progress, remaining, nextLevel } = getLevelFromPoints(points);
  const animProgress = useRef(new Animated.Value(0)).current;

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: progress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  // AnimatedCircle workaround — use listener
  const [dashOffset, setDashOffset] = React.useState(circumference);
  useEffect(() => {
    const id = animProgress.addListener(({ value }) => {
      setDashOffset(circumference * (1 - value));
    });
    return () => animProgress.removeListener(id);
  }, [circumference]);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={level.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </Svg>
        {/* Center label */}
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[styles.levelName, { color: level.color }]}>{level.name}</Text>
          <Text style={styles.pointsText}>{points.toLocaleString('pt-BR')}</Text>
        </View>
      </View>
      {showLabel && nextLevel && (
        <Text style={styles.remainingText}>
          {remaining.toLocaleString('pt-BR')} XP para {nextLevel.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelName: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  pointsText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 1,
  },
  remainingText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
  },
});
