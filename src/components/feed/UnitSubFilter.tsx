import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';

export interface UnitOption {
  id: string | null; // null = "Todas"
  name: string;
}

interface Props {
  visible: boolean;
  units: UnitOption[];
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string | null) => void;
}

export default function UnitSubFilter({ visible, units, selectedUnitId, onSelectUnit }: Props) {
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [visible]);

  const selectedName = units.find((u) => u.id === selectedUnitId)?.name || 'Todas';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          maxHeight: heightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 120],
          }),
          opacity: heightAnim,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {units.map((unit) => {
          const isActive = selectedUnitId === unit.id;
          return (
            <TouchableOpacity
              key={unit.id ?? 'todas'}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onSelectUnit(unit.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {unit.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {selectedUnitId && (
        <Text style={styles.indicator}>Mostrando feed da {selectedName}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  scrollContent: {
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: 'rgba(242,101,34,0.10)',
    borderColor: 'rgba(242,101,34,0.25)',
  },
  pillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255,255,255,0.35)',
  },
  pillTextActive: {
    color: '#F26522',
  },
  indicator: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 10,
  },
});
