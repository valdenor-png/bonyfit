import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  Bronze:   { bg: 'rgba(205,127,50,0.12)', color: '#CD7F32' },
  Prata:    { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
  Ouro:     { bg: 'rgba(242,101,34,0.12)', color: '#F26522' },
  Platina:  { bg: 'rgba(229,228,226,0.1)', color: '#E5E4E2' },
  Diamante: { bg: 'rgba(185,242,255,0.1)', color: '#B9F2FF' },
  Master:   { bg: 'rgba(255,215,0,0.15)', color: '#FFD700' },
};

interface Props {
  level: string;
}

export default function LevelBadge({ level }: Props) {
  const style = BADGE_STYLES[level] || BADGE_STYLES.Bronze;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.color }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  text: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    fontWeight: '600',
  },
});
