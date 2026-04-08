import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';

interface DropSetPanelProps {
  drops: Array<{ kg: string; reps: string }>;
  onUpdateDrop: (index: number, field: 'kg' | 'reps', value: string) => void;
  onAddDrop: () => void;
}

export default function DropSetPanel({ drops, onUpdateDrop, onAddDrop }: DropSetPanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>REDUÇÕES DO DROP SET</Text>

      {drops.map((drop, idx) => (
        <View key={idx} style={styles.dropRow}>
          <Text style={styles.indexNum}>{idx + 1}</Text>
          <TextInput
            style={styles.input}
            value={drop.kg}
            onChangeText={(v) => onUpdateDrop(idx, 'kg', v)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#444"
          />
          <Text style={styles.times}>×</Text>
          <TextInput
            style={styles.input}
            value={drop.reps}
            onChangeText={(v) => onUpdateDrop(idx, 'reps', v)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#444"
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={onAddDrop} activeOpacity={0.7}>
        <Text style={styles.addText}>+ adicionar redução</Text>
      </TouchableOpacity>
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
  dropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  indexNum: {
    fontFamily: fonts.numbers,
    fontSize: 12,
    color: '#444',
    width: 16,
    textAlign: 'center',
  },
  input: {
    width: 52,
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
  times: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#555',
  },
  addBtn: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(242,101,34,0.2)',
    borderStyle: 'dashed' as any,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#F26522',
  },
});
