import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  TextInput,
  KeyboardTypeOptions,
} from 'react-native';
import CrossPlatformModal from './CrossPlatformModal';
import { fonts } from '../../tokens';

// ─── Types ────────────────────────────────────────────────────
export interface PromptModalProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  keyboardType?: KeyboardTypeOptions;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────
export default function PromptModal({
  visible,
  title,
  message,
  placeholder,
  defaultValue = '',
  confirmLabel = 'Confirmar',
  keyboardType = 'default',
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      setValue(defaultValue);
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
  const handleConfirm = () => animateClose(() => onConfirm(value));

  return (
    <CrossPlatformModal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleCancel}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.modal,
                { opacity: modalOpacity, transform: [{ scale: scaleAnim }] },
              ]}
            >
              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message ? <Text style={styles.message}>{message}</Text> : null}

              {/* Input */}
              <TextInput
                style={[styles.input, focused && styles.inputFocused]}
                value={value}
                onChangeText={setValue}
                placeholder={placeholder}
                placeholderTextColor="#555555"
                keyboardType={keyboardType}
                autoFocus
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />

              {/* Buttons */}
              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
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
    </CrossPlatformModal>
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
  title: {
    fontFamily: fonts.numbersBold,
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#888888',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#0A0A0A',
    color: '#F5F5F5',
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 16,
  },
  inputFocused: {
    borderColor: '#F26522',
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
    backgroundColor: '#F26522',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
