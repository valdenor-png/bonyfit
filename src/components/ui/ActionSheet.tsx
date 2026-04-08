import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import CrossPlatformModal from './CrossPlatformModal';
import { fonts } from '../../tokens';

// ─── Types ────────────────────────────────────────────────────
export interface ActionSheetOption {
  label: string;
  icon?: string;
  variant?: 'default' | 'danger';
}

export interface ActionSheetProps {
  visible: boolean;
  options: ActionSheetOption[];
  onSelect: (index: number) => void;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────
export default function ActionSheet({ visible, options, onSelect, onCancel }: ActionSheetProps) {
  const translateY = useRef(new Animated.Value(300)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosing.current = false;
      translateY.setValue(300);
      overlayOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 4,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const animateClose = (callback: () => void) => {
    if (isClosing.current) return;
    isClosing.current = true;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const handleSelect = (index: number) => {
    animateClose(() => onSelect(index));
  };

  const handleCancel = () => {
    animateClose(onCancel);
  };

  return (
    <CrossPlatformModal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleCancel}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
              {/* Options */}
              <View style={styles.sheet}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      index < options.length - 1 && styles.optionBorder,
                    ]}
                    onPress={() => handleSelect(index)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        option.variant === 'danger' && styles.optionDanger,
                      ]}
                    >
                      {option.icon ? `${option.icon}  ${option.label}` : option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Cancel */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
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
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  sheet: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  optionText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#F5F5F5',
  },
  optionDanger: {
    color: '#D83030',
  },
  cancelBtn: {
    marginTop: 8,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#AAAAAA',
  },
});
