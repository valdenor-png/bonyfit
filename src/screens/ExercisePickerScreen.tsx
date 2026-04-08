import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing } from '../tokens';
import { useExerciseSearch, ExerciseResult } from '../hooks/useExerciseSearch';
import ExerciseBrowseCard from '../components/ExerciseBrowseCard';

const BODY_PARTS = [
  { key: 'all', label: 'Todos' },
  { key: 'Peito', label: 'Peito' },
  { key: 'Costas Média', label: 'Costas' },
  { key: 'Dorsal', label: 'Dorsal' },
  { key: 'Ombros', label: 'Ombros' },
  { key: 'Bíceps', label: 'Bíceps' },
  { key: 'Tríceps', label: 'Tríceps' },
  { key: 'Quadríceps', label: 'Quadríceps' },
  { key: 'Posterior de Coxa', label: 'Posterior' },
  { key: 'Glúteos', label: 'Glúteos' },
  { key: 'Panturrilha', label: 'Panturrilha' },
  { key: 'Abdômen', label: 'Abdômen' },
];

export default function ExercisePickerScreen({ navigation, route }: any) {
  const onSelect = route?.params?.onSelect;
  const [search, setSearch] = useState('');
  const [selectedPart, setSelectedPart] = useState('all');

  const { exercises, loading, hasMore, loadMore } = useExerciseSearch({
    bodyPart: selectedPart === 'all' ? undefined : selectedPart,
    search: search.length >= 2 ? search : undefined,
    limit: 40,
  });

  const handleSelect = (exercise: ExerciseResult) => {
    if (onSelect) {
      onSelect(exercise);
    }
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: ExerciseResult }) => (
    <ExerciseBrowseCard
      name={item.name}
      namePt={item.name_pt}
      muscle={item.target_muscle_pt || item.body_part_pt || item.muscle_group}
      equipment={item.equipment_pt || item.equipment}
      imageUrl={item.image_url}
      onPress={() => handleSelect(item)}
      onInfoPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar exercício..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {BODY_PARTS.map((bp) => {
          const active = selectedPart === bp.key;
          return (
            <TouchableOpacity
              key={bp.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedPart(bp.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{bp.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count */}
      <Text style={styles.count}>
        {exercises.length} exercício{exercises.length !== 1 ? 's' : ''}
      </Text>

      {/* List */}
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.orange} size="large" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nenhum exercício encontrado</Text>
            </View>
          )
        }
        ListFooterComponent={
          hasMore && exercises.length > 0 ? (
            <ActivityIndicator color={colors.orange} style={{ paddingVertical: 16 }} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.body,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipsScroll: {
    maxHeight: 50,
    marginTop: 12,
  },
  chipsContent: {
    paddingHorizontal: 12,
    gap: 6,
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipActive: {
    backgroundColor: '#F26522',
    borderColor: '#F26522',
  },
  chipText: {
    color: '#999',
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  count: {
    color: '#666',
    fontSize: 12,
    fontFamily: fonts.body,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontFamily: fonts.body,
  },
});
