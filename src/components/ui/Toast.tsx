import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { fonts } from '../../tokens';

// ─── Types ────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  onDismiss: () => void;
}

// ─── Type config ──────────────────────────────────────────────
const TYPE_MAP: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: '#0F2A20', border: '#2D9B6E44', icon: '✓', iconColor: '#2D9B6E' },
  error:   { bg: '#2A1510', border: '#D8303044', icon: '!', iconColor: '#D83030' },
  info:    { bg: '#1A2030', border: '#4A9EDB44', icon: 'ℹ', iconColor: '#4A9EDB' },
  warning: { bg: '#2A2010', border: '#D4940F44', icon: '⚠', iconColor: '#D4940F' },
};

// ─── Component ────────────────────────────────────────────────
export default function Toast({ visible, type, title, message, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      translateY.setValue(-40);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 4,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3s
      timerRef.current = setTimeout(() => {
        animateOut();
      }, 3000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -40,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  const config = TYPE_MAP[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: config.iconColor + '22' }]}>
        <Text style={[styles.iconText, { color: config.iconColor }]}>{config.icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
});
