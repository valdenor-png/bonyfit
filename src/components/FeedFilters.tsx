import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing } from '../tokens';

// ─── Types ─────────────────────────────────────────────────────
const FILTERS = ['Pra Voce', 'Unidade', 'Seguindo'] as const;

interface FeedFiltersProps {
  selected: string;
  onSelect: (filter: string) => void;
}

// ─── Component ─────────────────────────────────────────────────
export default function FeedFilters({ selected, onSelect }: FeedFiltersProps) {
  return (
    <View style={styles.container}>
      {FILTERS.map((f) => {
        const isActive = selected === f;
        return (
          <TouchableOpacity
            key={f}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: spacing.sm,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
  },
  tabActive: {
    backgroundColor: colors.orange,
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
});
