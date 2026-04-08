import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface Props {
  name: string;
  initials: string;
  hasStory: boolean;
  isTraining: boolean;
  isAddStory?: boolean;
  onPress: () => void;
}

export default function StoryAvatar({
  name,
  initials,
  hasStory,
  isTraining,
  isAddStory,
  onPress,
}: Props) {
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTraining) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTraining]);

  if (isAddStory) {
    return (
      <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.addCircle}>
          <Text style={styles.addIcon}>+</Text>
        </View>
        <Text style={styles.labelMuted}>Você</Text>
      </TouchableOpacity>
    );
  }

  const borderColor = hasStory ? '#F26522' : 'rgba(255,255,255,0.10)';
  const borderWidth = hasStory ? 3 : 2;
  const bgColor = hasStory ? 'rgba(242,101,34,0.08)' : '#141414';

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.circle, { borderColor, borderWidth, backgroundColor: bgColor }]}>
        <Text style={styles.initials}>{initials}</Text>
        {isTraining && (
          <Animated.View style={[styles.trainingDot, { opacity: pulseOpacity }]} />
        )}
      </View>
      <Text style={hasStory ? styles.label : styles.labelMuted} numberOfLines={1}>
        {name.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 6,
    minWidth: 56,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.3)',
  },
  initials: {
    fontFamily: 'Sora_700Bold',
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trainingDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#0A0A0A',
  },
  label: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255,255,255,0.50)',
  },
  labelMuted: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255,255,255,0.35)',
  },
});
