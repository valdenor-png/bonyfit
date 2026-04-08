import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
  padding?: number;
}

/**
 * Glassmorphism card — visible on dark backgrounds.
 * Uses higher opacity bg + border for contrast on #0A0A0A.
 * Glow adds orange shadow/border.
 */
export default function GlassCard({ children, style, glow, padding = 18 }: GlassCardProps) {
  return (
    <View style={[styles.card, glow && styles.glow, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glow: {
    borderColor: 'rgba(242,101,34,0.25)',
    backgroundColor: 'rgba(242,101,34,0.06)',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#F26522',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
        }
      : { elevation: 6 }),
  },
});
