import React, { useEffect, useRef } from 'react';
import { Text, Animated, Easing } from 'react-native';
import type { TextStyle } from 'react-native';

interface Props {
  value: number;
  duration?: number;
  style?: TextStyle;
  suffix?: string;
  prefix?: string;
}

/**
 * Animated counter that interpolates from 0 to target value.
 */
export default function AnimatedNumber({
  value,
  duration = 1200,
  style,
  suffix = '',
  prefix = '',
}: Props) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animValue.setValue(0);
    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    Animated.timing(animValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animValue.removeListener(listener);
    };
  }, [value]);

  return (
    <Text style={style}>
      {prefix}{displayValue.toLocaleString('pt-BR')}{suffix}
    </Text>
  );
}
