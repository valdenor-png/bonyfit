import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import Button from '../components/Button';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Treino A - Peito / Tríceps',
    description: 'Foco em hipertrofia com volume moderado',
    exercises: [
      { id: 'e1', name: 'Supino Reto', sets: 4, reps: '8-10' },
      { id: 'e2', name: 'Supino Inclinado Halteres', sets: 4, reps: '10-12' },
      { id: 'e3', name: 'Crucifixo Máquina', sets: 3, reps: '12-15' },
      { id: 'e4', name: 'Cross Over', sets: 3, reps: '12-15' },
      { id: 'e5', name: 'Tríceps Corda', sets: 3, reps: '12-15' },
      { id: 'e6', name: 'Tríceps Testa', sets: 3, reps: '10-12' },
    ],
  },
  {
    id: '2',
    name: 'Treino B - Costas / Bíceps',
    description: 'Ênfase em puxadas e remadas',
    exercises: [
      { id: 'e7', name: 'Puxada Frontal', sets: 4, reps: '8-10' },
      { id: 'e8', name: 'Remada Curvada', sets: 4, reps: '8-10' },
      { id: 'e9', name: 'Remada Unilateral', sets: 3, reps: '10-12' },
      { id: 'e10', name: 'Pulldown Corda', sets: 3, reps: '12-15' },
      { id: 'e11', name: 'Rosca Direta Barra', sets: 3, reps: '10-12' },
      { id: 'e12', name: 'Rosca Martelo', sets: 3, reps: '12-15' },
    ],
  },
  {
    id: '3',
    name: 'Treino C - Perna / Glúteo',
    exercises: [
      { id: 'e13', name: 'Agachamento Livre', sets: 4, reps: '8-10' },
      { id: 'e14', name: 'Leg Press 45°', sets: 4, reps: '10-12' },
      { id: 'e15', name: 'Cadeira Extensora', sets: 3, reps: '12-15' },
      { id: 'e16', name: 'Mesa Flexora', sets: 3, reps: '12-15' },
    ],
  },
];

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);

  const handleStartWorkout = (template: Template) => {
    // TODO: navigate to ActiveWorkoutScreen with template.exercises pre-loaded
    Alert.alert('Iniciar Treino', `Iniciando "${template.name}" com ${template.exercises.length} exercícios.`);
  };

  const handleLongPress = (template: Template) => {
    Alert.alert(template.name, 'O que deseja fazer?', [
      {
        text: 'Editar',
        onPress: () => {
          // TODO: navigate to edit screen
        },
      },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setTemplates((prev) => prev.filter((t) => t.id !== template.id));
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleNewRoutine = () => {
    // TODO: navigate to create template screen
    Alert.alert('Nova Rotina', 'Criar nova rotina de treino');
  };

  const exercisePreview = (exercises: Exercise[]): string => {
    return exercises.map((e) => e.name).join(', ');
  };

  const renderTemplate = ({ item }: { item: Template }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <Text style={styles.cardName}>{item.name}</Text>
      {item.description ? (
        <Text style={styles.cardDescription}>{item.description}</Text>
      ) : null}
      <Text style={styles.cardExercises} numberOfLines={1}>
        {exercisePreview(item.exercises)}
      </Text>
      <Text style={styles.cardCount}>
        {item.exercises.length} exercícios
      </Text>
      <View style={styles.cardActions}>
        <Button
          title="Iniciar Treino"
          variant="outline"
          onPress={() => handleStartWorkout(item)}
          style={styles.startButton}
        />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Crie sua primeira rotina de treino!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Treinos</Text>
        <TouchableOpacity style={styles.newButton} onPress={handleNewRoutine}>
          <Text style={styles.newButtonText}>+ Nova Rotina</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        renderItem={renderTemplate}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    color: colors.text,
  },
  newButton: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  newButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardName: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  cardDescription: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardExercises: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  cardCount: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cardActions: {
    marginTop: spacing.md,
  },
  startButton: {
    minHeight: 38,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
