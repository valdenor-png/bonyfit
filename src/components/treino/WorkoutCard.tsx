import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../../tokens';

interface Props {
  title: string;
  subtitle: string;
  muscles: string[];
  onPress: () => void;
}

export default function WorkoutCard({ title, subtitle, muscles, onPress }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>TREINO DE HOJE</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.chips}>
        {muscles.map((m) => (
          <View key={m} style={styles.chip}>
            <Text style={styles.chipText}>{m}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.btnText}>Ver treino</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
  },
  label: {
    color: colors.orange,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: fonts.body, color: '#999', marginBottom: 10 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  chip: { backgroundColor: '#2A2A2A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipText: { color: '#CCC', fontSize: 12, fontFamily: fonts.body },
  btn: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: colors.orange, fontSize: 14, fontFamily: fonts.bodyBold },
});
