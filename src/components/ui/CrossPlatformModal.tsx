import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  type ModalProps,
} from 'react-native';

interface CrossPlatformModalProps {
  visible: boolean;
  transparent?: boolean;
  animationType?: ModalProps['animationType'];
  statusBarTranslucent?: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
}

/**
 * Cross-platform modal that works on both mobile and web.
 * - Mobile: uses native <Modal>
 * - Web: uses absolute-positioned overlay (avoids removeChild crash)
 */
export default function CrossPlatformModal({
  visible,
  transparent = true,
  animationType,
  statusBarTranslucent,
  onRequestClose,
  children,
}: CrossPlatformModalProps) {
  if (!visible) return null;

  // ── Mobile: use native Modal ──────────────────────────────
  if (Platform.OS !== 'web') {
    return (
      <Modal
        visible={visible}
        transparent={transparent}
        animationType={animationType}
        statusBarTranslucent={statusBarTranslucent}
        onRequestClose={onRequestClose}
      >
        {children}
      </Modal>
    );
  }

  // ── Web: absolute overlay ─────────────────────────────────
  return (
    <View style={styles.webOverlay}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});
