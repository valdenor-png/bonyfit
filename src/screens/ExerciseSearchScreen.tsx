import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { supabase } from '../services/supabase';

// ─── Types ──────────────────────────────────────────────────────

interface ExerciseItem {
  id: string;
  name: string;
  name_pt: string | null;
  muscle_group: string;
  equipment: string;
  equipment_pt: string | null;
  image_url: string | null;
  body_part_pt: string | null;
  target_muscle_pt: string | null;
}

// ─── Muscle group filters ───────────────────────────────────────

const MUSCLE_GROUPS = [
  { key: 'all', label: 'Todos' },
  { key: 'Peito', label: 'Peito' },
  { key: 'Costas', label: 'Costas' },
  { key: 'Dorsal', label: 'Dorsal' },
  { key: 'Ombros', label: 'Ombros' },
  { key: 'Bíceps', label: 'Bíceps' },
  { key: 'Tríceps', label: 'Tríceps' },
  { key: 'Quadríceps', label: 'Quadríceps' },
  { key: 'Posterior de Coxa', label: 'Posterior' },
  { key: 'Glúteos', label: 'Glúteos' },
  { key: 'Panturrilha', label: 'Panturrilha' },
  { key: 'Abdômen', label: 'Abdômen' },
  { key: 'Antebraço', label: 'Antebraço' },
  { key: 'Trapézio', label: 'Trapézio' },
];

// ─── Component ──────────────────────────────────────────────────

interface Props {
  navigation?: any;
  route?: any;
}

export default function ExerciseSearchScreen({ navigation }: Props) {
  const [searchText, setSearchText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, name_pt, muscle_group, equipment, equipment_pt, image_url, body_part_pt, target_muscle_pt')
        .order('name');

      if (!error && data && data.length > 0) {
        setExercises(data as ExerciseItem[]);
      }
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────
  const filteredExercises = exercises.filter((ex) => {
    const displayName = ex.name_pt || ex.name;
    const matchesSearch =
      searchText.length === 0 ||
      displayName.toLowerCase().includes(searchText.toLowerCase()) ||
      ex.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesGroup =
      selectedGroup === 'all' ||
      ex.muscle_group === selectedGroup ||
      ex.body_part_pt === selectedGroup ||
      ex.target_muscle_pt === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  // ── Handlers ───────────────────────────────────────────────────
  const handleSelectExercise = (exercise: ExerciseItem) => {
    if (navigation) {
      navigation.navigate('ActiveWorkout', { addedExercise: exercise });
    }
  };

  const handleViewDetail = (exerciseId: string) => {
    if (navigation) {
      navigation.navigate('ExerciseDetail', { exerciseId });
    }
  };

  // ── Render item ────────────────────────────────────────────────
  const renderExerciseItem = useCallback(
    ({ item }: { item: ExerciseItem }) => {
      const displayName = item.name_pt || item.name;
      const musclePt = item.target_muscle_pt || item.body_part_pt || item.muscle_group;
      const equipPt = item.equipment_pt || item.equipment;

      return (
        <TouchableOpacity
          style={styles.exerciseCard}
          onPress={() => handleSelectExercise(item)}
          activeOpacity={0.7}
        >
          {/* Image */}
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.exerciseImage} resizeMode="cover" />
          ) : (
            <View style={styles.exercisePlaceholder}>
              <Text style={styles.exercisePlaceholderText}>{'\u{1F3CB}\u{FE0F}'}</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName} numberOfLines={2}>{displayName}</Text>
            <View style={styles.exerciseTags}>
              {musclePt ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{musclePt}</Text>
                </View>
              ) : null}
              {equipPt ? (
                <View style={styles.tagSecondary}>
                  <Text style={styles.tagSecondaryText}>{equipPt}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Info button */}
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => handleViewDetail(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.infoBtnText}>{'\u{2139}\u{FE0F}'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercícios</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar exercício..."
          placeholderTextColor="#666666"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Muscle group chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {MUSCLE_GROUPS.map((group) => {
          const isSelected = selectedGroup === group.key;
          return (
            <TouchableOpacity
              key={group.key}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelectedGroup(group.key)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {group.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count */}
      <Text style={styles.countText}>
        {filteredExercises.length} exercício{filteredExercises.length !== 1 ? 's' : ''}
      </Text>

      {/* Exercise list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>{'\u{1F50D}'}</Text>
              <Text style={styles.emptyText}>Nenhum exercício encontrado</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 40,
  },
  backText: {
    color: colors.text,
    fontSize: 22,
  },
  headerTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    textAlign: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  // Chips
  chipsScroll: {
    maxHeight: 48,
  },
  chipsContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  chipText: {
    color: '#999999',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  // Count
  countText: {
    color: '#666666',
    fontFamily: fonts.body,
    fontSize: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Exercise card
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  exerciseImage: {
    width: 72,
    height: 72,
  },
  exercisePlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exercisePlaceholderText: {
    fontSize: 24,
  },
  exerciseInfo: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    marginBottom: 6,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(242,101,34,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    color: colors.orange,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  tagSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagSecondaryText: {
    color: '#888888',
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  infoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoBtnText: {
    fontSize: 18,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: '#666666',
    fontFamily: fonts.body,
    fontSize: 14,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
