import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, fonts, spacing } from '../tokens';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  sublabel?: string;
  style?: ViewStyle;
}

const TRACK_W = 44;
const TRACK_H = 24;
const THUMB_SIZE = 20;
const TRACK_RADIUS = 12;
const THUMB_TRAVEL = TRACK_W - THUMB_SIZE - 4; // 2px padding each side

export default function Toggle({
  value,
  onValueChange,
  label,
  sublabel,
  style,
}: ToggleProps) {
  const translateX = useRef(new Animated.Value(value ? THUMB_TRAVEL : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? THUMB_TRAVEL : 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 16,
    }).start();
  }, [value, translateX]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onValueChange(!value)}
      style={[styles.row, style]}
    >
      {(label || sublabel) && (
        <View style={styles.labels}>
          {label && <Text style={styles.label}>{label}</Text>}
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      )}
      <View
        style={[
          styles.track,
          { backgroundColor: value ? colors.orange : colors.elevated },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX }] },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labels: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  sublabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_RADIUS,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.text,
  },
});
