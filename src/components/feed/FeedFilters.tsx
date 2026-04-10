  import React from 'react';
  import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

  type FeedTab = 'pra_voce' | 'unidade' | 'seguindo';

  interface Props {
    activeTab: FeedTab;
    onChangeTab: (tab: FeedTab) => void;
  }

  const TABS: { key: FeedTab; label: string }[] = [
    { key: 'pra_voce', label: 'Pra você' },
    { key: 'unidade', label: 'Unidade' },
    { key: 'seguindo', label: 'Seguindo' },
  ];

  export default function FeedFilters({ activeTab, onChangeTab }: Props) {
    return (
      <View style={styles.container}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const label = tab.key === 'unidade' && isActive
            ? 'Unidade ▾'
            : tab.label;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onChangeTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 20,
      marginBottom: 6,
    },
    pill: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.10)',
      backgroundColor: 'transparent',
    },
    pillActive: {
      backgroundColor: '#F26522',
      borderColor: '#F26522',
    },
    pillText: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans_500Medium',
      color: 'rgba(255,255,255,0.45)',
    },
    pillTextActive: {
      color: '#FFFFFF',
    },
  });
