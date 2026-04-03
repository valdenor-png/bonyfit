import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../tokens';

type MaskType = 'cpf' | 'phone';

interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  mask?: MaskType;
  secureTextEntry?: boolean;
  style?: ViewStyle;
}

function applyMask(text: string, mask: MaskType): string {
  const digits = text.replace(/\D/g, '');

  if (mask === 'cpf') {
    return digits
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  if (mask === 'phone') {
    if (digits.length <= 10) {
      return digits
        .slice(0, 10)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  return text;
}

function unmask(text: string): string {
  return text.replace(/\D/g, '');
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  mask,
  secureTextEntry,
  style,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const hasValue = value.length > 0;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || hasValue ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFocused, hasValue, labelAnim]);

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 6],
  });

  const labelSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 12],
  });

  const handleChangeText = (text: string) => {
    if (mask) {
      const masked = applyMask(text, mask);
      onChangeText(masked);
    } else {
      onChangeText(text);
    }
  };

  const keyboardTypeForMask = (): TextInputProps['keyboardType'] => {
    if (mask === 'cpf' || mask === 'phone') return 'numeric';
    return rest.keyboardType;
  };

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        style,
      ]}
    >
      <Animated.Text
        style={[
          styles.label,
          { top: labelTop, fontSize: labelSize },
          isFocused && styles.labelFocused,
        ]}
      >
        {label}
      </Animated.Text>
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        placeholder={isFocused && !hasValue ? placeholder : undefined}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardTypeForMask()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.input}
        selectionColor={colors.orange}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.elevated,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    justifyContent: 'center',
    minHeight: 56,
  },
  containerFocused: {
    borderColor: colors.orange,
  },
  label: {
    position: 'absolute',
    left: 16,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  labelFocused: {
    color: colors.orange,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    paddingTop: 8,
    paddingBottom: 0,
    margin: 0,
  },
});
