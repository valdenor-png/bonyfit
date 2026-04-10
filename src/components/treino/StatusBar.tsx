import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';

interface Props {
  seriesFeitas: number;
  seriesTotal: number;
  exercicios: number;
  minutos: number;
  pontos: number;
}

export default function StatusBar({ seriesFeitas, seriesTotal, exercicios, minutos, pontos }: Props) {
  const items = [
    { value: `${seriesFeitas}/${seriesTotal}`, label: 'SÉRIES' },
    { value: `${exercicios}`, label: 'EXERCÍCIOS' },
    { value: `${minutos}`, label: 'MIN' },
    { value: `${pontos}`, label: 'PONTOS' },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.label} style={styles.card}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 16 },
  card: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  value: { fontSize: 20, fontFamily: fonts.numbersBold, color: '#F26522' },
  label: { fontSize: 10, fontFamily: fonts.bodyMedium, color: '#777', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
});
