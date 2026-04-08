import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { fonts } from '../../tokens';

// ─── Types ────────────────────────────────────────────────────
export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

// ─── Component ────────────────────────────────────────────────
export default function LoadingOverlay({ visible, message = 'Carregando...' }: LoadingOverlayProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      rotateAnim.setValue(0);
      animRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
    }

    return () => {
      animRef.current?.stop();
    };
  }, [visible]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#2A2A2A',
    borderTopColor: '#F26522',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 12,
  },
});
