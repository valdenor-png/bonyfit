import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  count: number;
}

export default function LiveFriendsBadge({ count }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [count]);

  if (count === 0) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity }]} />
      <Text style={styles.text}>
        {count} {count === 1 ? 'amigo treinando agora' : 'amigos treinando agora'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  text: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#22C55E',
  },
});
