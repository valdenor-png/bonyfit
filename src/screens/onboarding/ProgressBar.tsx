import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../tokens';

interface ProgressBarProps {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            { backgroundColor: i < step ? colors.orange : colors.elevated },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
});
