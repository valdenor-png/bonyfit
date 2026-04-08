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
 * Glassmorphism card.
 * Uses semi-transparent background with subtle border.
 * Glow adds orange shadow (iOS only).
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
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  glow: {
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#F26522',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        }
      : { elevation: 8 }),
  },
});
