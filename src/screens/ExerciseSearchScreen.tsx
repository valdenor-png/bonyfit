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
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { supabase } from '../services/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExerciseItem {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  secondary_muscles: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MUSCLE_GROUPS = [
  'Todos',
  'Peito',
  'Costas',
  'Ombro',
  'Bíceps',
  'Tríceps',
  'Perna',
  'Glúteo',
  'Abdômen',
  'Cardio',
];

// ---------------------------------------------------------------------------
// Mock exercises (fallback when Supabase is unavailable)
// ---------------------------------------------------------------------------

const MOCK_EXERCISES: ExerciseItem[] = [
  { id: '1', name: 'Supino Reto', muscle_group: 'Peito', equipment: 'Barra', secondary_muscles: 'Tríceps, Ombro' },
  { id: '2', name: 'Supino Inclinado', muscle_group: 'Peito', equipment: 'Halter', secondary_muscles: 'Ombro' },
  { id: '3', name: 'Crucifixo', muscle_group: 'Peito', equipment: 'Halter', secondary_muscles: null },
  { id: '4', name: 'Puxada Frontal', muscle_group: 'Costas', equipment: 'Cabo', secondary_muscles: 'Bíceps' },
  { id: '5', name: 'Remada Curvada', muscle_group: 'Costas', equipment: 'Barra', secondary_muscles: 'Bíceps' },
  { id: '6', name: 'Remada Unilateral', muscle_group: 'Costas', equipment: 'Halter', secondary_muscles: null },
  { id: '7', name: 'Desenvolvimento', muscle_group: 'Ombro', equipment: 'Halter', secondary_muscles: 'Tríceps' },
  { id: '8', name: 'Elevação Lateral', muscle_group: 'Ombro', equipment: 'Halter', secondary_muscles: null },
  { id: '9', name: 'Rosca Direta', muscle_group: 'Bíceps', equipment: 'Barra', secondary_muscles: null },
  { id: '10', name: 'Rosca Martelo', muscle_group: 'Bíceps', equipment: 'Halter', secondary_muscles: null },
  { id: '11', name: 'Tríceps Pulley', muscle_group: 'Tríceps', equipment: 'Cabo', secondary_muscles: null },
  { id: '12', name: 'Tríceps Francês', muscle_group: 'Tríceps', equipment: 'Halter', secondary_muscles: null },
  { id: '13', name: 'Agachamento', muscle_group: 'Perna', equipment: 'Barra', secondary_muscles: 'Glúteo' },
  { id: '14', name: 'Leg Press', muscle_group: 'Perna', equipment: 'Máquina', secondary_muscles: 'Glúteo' },
  { id: '15', name: 'Cadeira Extensora', muscle_group: 'Perna', equipment: 'Máquina', secondary_muscles: null },
  { id: '16', name: 'Hip Thrust', muscle_group: 'Glúteo', equipment: 'Barra', secondary_muscles: 'Perna' },
  { id: '17', name: 'Abdominal Crunch', muscle_group: 'Abdômen', equipment: 'Peso corporal', secondary_muscles: null },
  { id: '18', name: 'Esteira', muscle_group: 'Cardio', equipment: 'Máquina', secondary_muscles: null },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExerciseSearchScreenProps {
  navigation?: any;
  route?: any;
}

export default function ExerciseSearchScreen({ navigation }: ExerciseSearchScreenProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Todos');
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- load exercises ----
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group, equipment, secondary_muscles')
        .order('name');

      if (error || !data || data.length === 0) {
        setExercises(MOCK_EXERCISES);
      } else {
        setExercises(data as ExerciseItem[]);
      }
    } catch {
      setExercises(MOCK_EXERCISES);
    } finally {
      setLoading(false);
    }
  };

  // ---- filtering ----
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      searchText.length === 0 ||
      ex.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesGroup =
      selectedGroup === 'Todos' || ex.muscle_group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  // ---- handlers ----
  const handleSelectExercise = (exercise: ExerciseItem) => {
    // If we came from ActiveWorkout, pass exercise back
    if (navigation) {
      navigation.navigate('ActiveWorkout', { addedExercise: exercise });
    }
  };

  const handleBack = () => {
    if (navigation) navigation.goBack();
  };

  // ---- render item ----
  const renderExerciseItem = useCallback(
    ({ item }: { item: ExerciseItem }) => (
      <TouchableOpacity style={styles.exerciseItem} onPress={() => handleSelectExercise(item)}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.exerciseMeta}>
          <Text style={styles.exerciseMuscle}>{item.muscle_group}</Text>
          <Text style={styles.exerciseEquipment}>{item.equipment}</Text>
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Nenhum exercício encontrado</Text>
    </View>
  );

  // ---- main render ----
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar Exercício</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="🔍 Buscar exercício..."
          placeholderTextColor={colors.textMuted}
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
          const isSelected = selectedGroup === group;
          return (
            <TouchableOpacity
              key={group}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelectedGroup(group)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {group}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create custom exercise */}
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonText}>Criar exercício personalizado</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ---- header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 70,
  },
  backText: {
    color: colors.orange,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  headerTitle: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    textAlign: 'center',
  },

  // ---- search ----
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },

  // ---- chips ----
  chipsScroll: {
    maxHeight: 48,
  },
  chipsContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  chipText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.text,
  },

  // ---- list ----
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  exerciseItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  exerciseName: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  exerciseMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: spacing.md,
  },
  exerciseMuscle: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  exerciseEquipment: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },

  // ---- empty ----
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 15,
  },

  // ---- loading ----
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- create ----
  createButton: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  createButtonText: {
    color: colors.orange,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});
