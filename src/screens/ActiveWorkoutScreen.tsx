import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SetType = 'warmup' | 'normal' | 'drop' | 'failure';

interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weight: string;
  reps: string;
  completed: boolean;
  previous: string | null; // e.g. "60×12"
}

interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: WorkoutSet[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimer(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ---------------------------------------------------------------------------
// Set-type indicator color
// ---------------------------------------------------------------------------

const setTypeColors: Record<SetType, string | null> = {
  warmup: '#3B82F6',
  normal: null,
  drop: '#A855F7',
  failure: '#E74C3C',
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function createMockExercises(): WorkoutExercise[] {
  return [
    {
      id: generateId(),
      name: 'Supino Reto',
      muscleGroup: 'Peito',
      sets: [1, 2, 3].map((n) => ({
        id: generateId(),
        setNumber: n,
        type: 'normal' as SetType,
        weight: '',
        reps: '',
        completed: false,
        previous: '60×12',
      })),
    },
    {
      id: generateId(),
      name: 'Rosca Direta',
      muscleGroup: 'Bíceps',
      sets: [1, 2, 3].map((n) => ({
        id: generateId(),
        setNumber: n,
        type: 'normal' as SetType,
        weight: '',
        reps: '',
        completed: false,
        previous: '60×12',
      })),
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActiveWorkoutScreenProps {
  navigation?: any;
  route?: any;
}

export default function ActiveWorkoutScreen({ navigation }: ActiveWorkoutScreenProps) {
  // ---- state ----
  const [workoutName] = useState('Treino A');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(createMockExercises);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- workout timer ----
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ---- rest timer ----
  const startRestTimer = useCallback((seconds: number = 90) => {
    if (restRef.current) clearInterval(restRef.current);
    setRestSeconds(seconds);
    setRestTimerActive(true);
    restRef.current = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          setRestTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ---- handlers ----
  const toggleSetCompleted = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            const nowCompleted = !s.completed;
            if (nowCompleted) startRestTimer(90);
            return { ...s, completed: nowCompleted };
          }),
        };
      }),
    );
  };

  const updateSetField = (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string,
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            return { ...s, [field]: value };
          }),
        };
      }),
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const nextNum = ex.sets.length + 1;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: generateId(),
              setNumber: nextNum,
              type: 'normal',
              weight: '',
              reps: '',
              completed: false,
              previous: null,
            },
          ],
        };
      }),
    );
  };

  const addExercise = () => {
    if (navigation) {
      navigation.navigate('ExerciseSearch');
    }
  };

  const handleFinish = () => {
    const completedSets = exercises.flatMap((ex) => ex.sets.filter((s) => s.completed));
    const totalVolume = completedSets.reduce((acc, s) => {
      const w = parseFloat(s.weight) || 0;
      const r = parseFloat(s.reps) || 0;
      return acc + w * r;
    }, 0);
    const totalSets = completedSets.length;
    const totalExercises = exercises.filter((ex) => ex.sets.some((s) => s.completed)).length;
    const points = totalSets * 15 + totalExercises * 50 + 200;

    Alert.alert(
      'Treino Finalizado!',
      `Duração: ${formatTimer(elapsedSeconds)}\nSéries completas: ${totalSets}\nVolume total: ${totalVolume.toLocaleString()}kg\nPontos: +${points} pts`,
      [
        {
          text: 'OK',
          onPress: () => {
            // workoutStore.finishWorkout(...)
            if (navigation) navigation.goBack();
          },
        },
      ],
    );
  };

  const handleDiscard = () => {
    Alert.alert('Descartar treino?', 'Todo o progresso será perdido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          if (navigation) navigation.goBack();
        },
      },
    ]);
  };

  // ---- render helpers ----
  const renderSetRow = (exercise: WorkoutExercise, set: WorkoutSet) => {
    const dotColor = setTypeColors[set.type];
    return (
      <View style={styles.setRow} key={set.id}>
        {/* Set type dot + number */}
        <View style={styles.setNumberCell}>
          {dotColor && <View style={[styles.setTypeDot, { backgroundColor: dotColor }]} />}
          <Text style={styles.setNumberText}>{set.setNumber}</Text>
        </View>

        {/* Previous */}
        <View style={styles.previousCell}>
          <Text style={styles.previousText}>{set.previous ?? '—'}</Text>
        </View>

        {/* Weight input */}
        <TextInput
          style={styles.input}
          value={set.weight}
          onChangeText={(v) => updateSetField(exercise.id, set.id, 'weight', v)}
          keyboardType="numeric"
          placeholder="—"
          placeholderTextColor={colors.textMuted}
        />

        {/* Reps input */}
        <TextInput
          style={[styles.input, { width: 50 }]}
          value={set.reps}
          onChangeText={(v) => updateSetField(exercise.id, set.id, 'reps', v)}
          keyboardType="numeric"
          placeholder="—"
          placeholderTextColor={colors.textMuted}
        />

        {/* Checkmark */}
        <TouchableOpacity
          style={[
            styles.checkButton,
            set.completed && styles.checkButtonCompleted,
          ]}
          onPress={() => toggleSetCompleted(exercise.id, set.id)}
        >
          {set.completed && <Text style={styles.checkIcon}>✓</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  const renderExerciseCard = (exercise: WorkoutExercise) => (
    <View style={styles.exerciseCard} key={exercise.id}>
      {/* Name + badge */}
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.muscleBadge}>
          <Text style={styles.muscleBadgeText}>{exercise.muscleGroup}</Text>
        </View>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { width: 36 }]}>#</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>ANTERIOR</Text>
        <Text style={[styles.tableHeaderText, { width: 60 }]}>KG</Text>
        <Text style={[styles.tableHeaderText, { width: 50 }]}>REPS</Text>
        <Text style={[styles.tableHeaderText, { width: 36 }]}>✓</Text>
      </View>

      {/* Set rows */}
      {exercise.sets.map((set) => renderSetRow(exercise, set))}

      {/* Add set */}
      <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(exercise.id)}>
        <Text style={styles.addSetText}>+ Adicionar série</Text>
      </TouchableOpacity>
    </View>
  );

  // ---- main render ----
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {workoutName}
        </Text>
        <Text style={styles.headerTimer}>{formatTimer(elapsedSeconds)}</Text>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      {/* Rest timer banner */}
      {restTimerActive && (
        <View style={styles.restBanner}>
          <Text style={styles.restBannerText}>
            Descanso: {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
          </Text>
        </View>
      )}

      {/* Exercises */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {exercises.map(renderExerciseCard)}

        {/* Add exercise */}
        <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
          <Text style={styles.addExerciseText}>+ Adicionar exercício</Text>
        </TouchableOpacity>

        {/* Discard */}
        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
          <Text style={styles.discardText}>Descartar treino</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  headerTimer: {
    color: colors.text,
    fontFamily: fonts.numbersExtraBold,
    fontSize: 18,
    marginHorizontal: spacing.md,
  },
  finishButton: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  finishButtonText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },

  // ---- rest banner ----
  restBanner: {
    backgroundColor: 'rgba(242,101,34,0.15)',
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  restBannerText: {
    color: colors.orange,
    fontFamily: fonts.numbersBold,
    fontSize: 14,
  },

  // ---- scroll ----
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 80,
  },

  // ---- exercise card ----
  exerciseCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exerciseName: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    flex: 1,
  },
  muscleBadge: {
    backgroundColor: 'rgba(242,101,34,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  muscleBadgeText: {
    color: colors.orange,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },

  // ---- table header ----
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tableHeaderText: {
    color: colors.textMuted,
    fontFamily: fonts.numbersBold,
    fontSize: 11,
    textAlign: 'center',
  },

  // ---- set row ----
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  setNumberCell: {
    width: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  setNumberText: {
    color: colors.text,
    fontFamily: fonts.numbersBold,
    fontSize: 14,
  },
  previousCell: {
    flex: 1,
    alignItems: 'center',
  },
  previousText: {
    color: colors.textMuted,
    fontFamily: fonts.numbersBold,
    fontSize: 13,
  },
  input: {
    width: 60,
    height: 36,
    backgroundColor: '#2A2A2A',
    borderRadius: radius.sm,
    color: colors.text,
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 4,
    paddingHorizontal: spacing.xs,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  checkIcon: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },

  // ---- add set ----
  addSetButton: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  addSetText: {
    color: colors.orange,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },

  // ---- add exercise ----
  addExerciseButton: {
    borderWidth: 1.5,
    borderColor: '#333333',
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  addExerciseText: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },

  // ---- discard ----
  discardButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.xxl,
  },
  discardText: {
    color: '#E74C3C',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});
