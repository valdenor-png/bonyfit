import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { fonts } from '../../tokens';

interface Props {
  progress: number; // 0-1
}

export default function ProgressBar({ progress }: Props) {
  const pct = Math.round(progress * 100);
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  bar: { flex: 1, height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#F26522', borderRadius: 2 },
  pct: { color: '#F26522', fontSize: 12, fontFamily: fonts.bodyBold, width: 36, textAlign: 'right' },
});
