import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';

const TYPES = [
  { key: 'normal', label: 'Normal' },
  { key: 'dropset', label: 'Drop Set' },
  { key: 'tempo', label: 'Tempo' },
  { key: 'failure', label: 'Até Falha' },
] as const;

interface Props {
  active: string;
}

export default function SetTypePills({ active }: Props) {
  return (
    <View style={styles.container}>
      {TYPES.map((t) => (
        <View key={t.key} style={[styles.pill, t.key === active && styles.pillActive]}>
          <Text style={[styles.pillText, t.key === active && styles.pillTextActive]}>
            {t.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginBottom: 12, flexWrap: 'wrap' },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#222' },
  pillActive: { backgroundColor: '#F26522' },
  pillText: { fontSize: 12, fontFamily: fonts.bodyBold, color: '#888' },
  pillTextActive: { color: '#FFF' },
});
