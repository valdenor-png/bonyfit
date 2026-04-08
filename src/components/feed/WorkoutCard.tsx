import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.trophyBox}>
          <Text style={styles.trophyIcon}>🏆</Text>
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.completeLabel}>Treino completo</Text>
          <Text style={styles.splitName}>{title}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {duration != null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{duration}</Text>
            <Text style={styles.statLabel}>min</Text>
          </View>
        )}
        {volume != null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {volume >= 1000 ? (volume / 1000).toFixed(1).replace('.0', '') + 'k' : volume}
            </Text>
            <Text style={styles.statLabel}>kg</Text>
          </View>
        )}
        {exercises != null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{exercises}</Text>
            <Text style={styles.statLabel}>exercícios</Text>
          </View>
        )}
        {sets != null && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{sets}</Text>
            <Text style={styles.statLabel}>séries</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trophyBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(242,101,34,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyIcon: {
    fontSize: 14,
  },
  titleCol: {
    flex: 1,
  },
  completeLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#F26522',
  },
  splitName: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.50)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.70)',
  },
  statLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.40)',
  },
});
