import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Animated,
} from 'react-native';
import { fonts } from '../../tokens';

// ─── Types ────────────────────────────────────────────────────
export interface ConfirmModalProps {
  visible: boolean;
  icon?: 'warning' | 'trash' | 'logout' | 'success' | 'info';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

// ─── Icon config ──────────────────────────────────────────────
const ICON_MAP: Record<string, { bg: string; emoji: string; color?: string }> = {
  warning: { bg: '#2A1510', emoji: '\u26A0\uFE0F' },
  trash:   { bg: '#2A1510', emoji: '\uD83D\uDDD1' },
  logout:  { bg: '#2A1510', emoji: '\uD83D\uDEAA' },
  success: { bg: '#0F2A20', emoji: '\u2713', color: '#2D9B6E' },
  info:    { bg: '#0A1A2A', emoji: '\u2139', color: '#3B82F6' },
};

// ─── Component ────────────────────────────────────────────────
export default function ConfirmModal({
  visible,
  icon,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      overlayAnim.setValue(0);
      scaleAnim.setValue(0.9);
      modalOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const animateClose = (callback: () => void) => {
    if (isClosing.current) return;
    isClosing.current = true;

    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const handleCancel = () => animateClose(onCancel);
  const handleConfirm = () => animateClose(onConfirm);

  const iconConfig = icon ? ICON_MAP[icon] : null;
  const showCancel = cancelLabel !== '';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleCancel}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.modal,
                { opacity: modalOpacity, transform: [{ scale: scaleAnim }] },
              ]}
            >
              {/* Icon */}
              {iconConfig && (
                <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                  <Text
                    style={[
                      styles.iconEmoji,
                      iconConfig.color ? { color: iconConfig.color } : undefined,
                    ]}
                  >
                    {iconConfig.emoji}
                  </Text>
                </View>
              )}

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Buttons */}
              <View style={styles.buttonsRow}>
                {showCancel && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelText}>{cancelLabel}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    confirmVariant === 'danger' ? styles.confirmDanger : styles.confirmPrimary,
                    !showCancel && { flex: 1 },
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
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
  modal: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 20,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    maxWidth: 320,
    width: '85%',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  title: {
    fontFamily: fonts.numbersBold,
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: '#AAAAAA',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmDanger: {
    backgroundColor: '#D83030',
  },
  confirmPrimary: {
    backgroundColor: '#F26522',
  },
  confirmText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
