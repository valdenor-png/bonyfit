import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';

interface RIRPanelProps {
  rir: string;
  onUpdateRIR: (value: string) => void;
}

export default function RIRPanel({ rir, onUpdateRIR }: RIRPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>REPETIÇÕES NA RESERVA</Text>

      <View style={styles.row}>
        <Text style={styles.label}>RIR</Text>
        <TextInput
          style={styles.input}
          value={rir}
          onChangeText={onUpdateRIR}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#444"
        />
      </View>

      <Text style={styles.note}>Quantas reps você ainda conseguiria fazer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    paddingLeft: 52,
    paddingRight: 16,
    paddingVertical: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    color: '#888',
  },
  input: {
    width: 64,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    color: '#F5F5F5',
    fontFamily: fonts.numbers,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 6,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#555',
    marginTop: 6,
  },
});
