import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts, spacing } from '../tokens';
import ProgressRing from './ProgressRing';

interface UnitBubbleProps {
  /** Current number of people in the unit */
  current: number;
  /** Maximum capacity of the unit */
  capacity: number;
  /** Display name of the gym unit */
  name: string;
  style?: ViewStyle;
}

export default function UnitBubble({
  current,
  capacity,
  name,
  style,
}: UnitBubbleProps) {
  const progress = capacity > 0 ? current / capacity : 0;

  return (
    <View style={[styles.container, style]}>
      <ProgressRing progress={progress} size={56} strokeWidth={4}>
        <Text style={styles.count}>{current}</Text>
      </ProgressRing>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  count: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 16,
    color: colors.text,
  },
  name: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
