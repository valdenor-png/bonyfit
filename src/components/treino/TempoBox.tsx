import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';

interface Props {
  seconds: number;
}

export default function TempoBox({ seconds }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.time}>{seconds}s</Text>
      <Text style={styles.label}>TEMPO POR REP (SEG)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    alignItems: 'center',
  },
  time: { fontSize: 36, fontFamily: fonts.numbersBold, color: '#F26522' },
  label: { fontSize: 11, fontFamily: fonts.bodyMedium, color: '#888', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },
});
