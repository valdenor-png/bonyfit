import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';
import Skull from '../Skull';

interface Props {
  splitLabel?: string;
  splitName?: string;
  duration?: number;
  volume?: number;
  exercises?: number;
  sets?: number;
}

export default function WorkoutCard({
  splitLabel,
  splitName,
  duration,
  volume,
  exercises,
  sets,
}: Props) {
  const title = splitLabel && splitName
    ? `${splitLabel} — ${splitName}`
    : splitName || 'Treino';

  const volumeText = volume != null
    ? (volume >= 1000 ? (volume / 1000).toFixed(1).replace('.0', '') + 'k' : String(volume)) + ' kg'
    : null;

  return (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.titleRow}>
        <Skull size={16} color="#F26522" />
        <Text style={styles.titleText}>Treino completo</Text>
      </View>

      {/* Split name */}
      <Text style={styles.splitName}>{title}</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        {duration != null && (
          <Text style={styles.statText}>{duration} min</Text>
        )}
        {volumeText && (
          <Text style={styles.statText}>{volumeText}</Text>
        )}
        {exercises != null && (
          <Text style={styles.statText}>{exercises} exerc.</Text>
        )}
        {sets != null && (
          <Text style={styles.statText}>{sets} séries</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    borderLeftWidth: 3,
    borderLeftColor: '#F26522',
    padding: 14,
    marginTop: 10,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  splitName: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  statText: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
});
