import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fonts, radius, spacing } from '../tokens';

type PillVariant = 'filled' | 'outline';

interface PillProps {
  text: string;
  color?: string;
  variant?: PillVariant;
  style?: ViewStyle;
}

export default function Pill({
  text,
  color = colors.orange,
  variant = 'filled',
  style,
}: PillProps) {
  const isFilled = variant === 'filled';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isFilled ? color : 'transparent',
          borderColor: color,
          borderWidth: isFilled ? 0 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isFilled ? colors.text : color },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
});
