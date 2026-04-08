import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';

interface SetTypeBadgeProps {
  setNumber: number;
  type: string;
  onPress: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; shortLabel: string; bg: string; border: string; text: string }> = {
  normal:       { label: '',      shortLabel: '',      bg: 'transparent', border: '#F26522', text: '#F5F5F5' },
  aquecimento:  { label: 'AQ',    shortLabel: 'AQUEC', bg: '#1A2A3A',    border: '#4A9EDB', text: '#7BBEF5' },
  preparatoria: { label: 'PR',    shortLabel: 'PREP',  bg: '#0F2A20',    border: '#2D9B6E', text: '#5DCAA5' },
  drop:         { label: 'DR',    shortLabel: 'DROP',  bg: '#2A2010',    border: '#D4940F', text: '#F5C24A' },
  rir:          { label: 'RIR',   shortLabel: 'RIR',   bg: '#2A1510',    border: '#D85A30', text: '#F09060' },
};

export default function SetTypeBadge({ setNumber, type, onPress }: SetTypeBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.normal;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const displayText = type === 'normal' ? String(setNumber) : config.label;

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.badge,
            {
              backgroundColor: config.bg,
              borderColor: config.border,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: config.text }]}>{displayText}</Text>
        </Animated.View>
      </Pressable>
      {type !== 'normal' && (
        <Text style={styles.tinyLabel}>{config.shortLabel}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 40,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
  },
  tinyLabel: {
    fontFamily: fonts.numbersBold,
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
