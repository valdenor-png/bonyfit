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
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SetType = 'normal' | 'warmup' | 'drop_set' | 'failure';

const SET_TYPE_ORDER: SetType[] = ['normal', 'warmup', 'drop_set', 'failure'];

interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weight: string;
  reps: string;
  completed: boolean;
  previousWeight: string | null;
  previousReps: string | null;
}

interface WorkoutExercise {
  id: string;
  name: string;
  equipment: string;
  note: string;
  restSeconds: number;
  sets: WorkoutSet[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

const formatTimer = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatVolume = (vol: number): string =>
  vol >= 1000 ? `${(vol / 1000).toFixed(1)}t` : `${vol}kg`;

const formatRestTimer = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const formatRestDisplay = (secs: number): string => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function createMockExercises(): WorkoutExercise[] {
  const prevSupino = [
    { w: '60', r: '12' },
    { w: '60', r: '12' },
    { w: '55', r: '10' },
    { w: '55', r: '10' },
  ];
  const prevRosca = [
    { w: '30', r: '12' },
    { w: '30', r: '10' },
    { w: '25', r: '10' },
  ];

  return [
    {
      id: generateId(),
      name: 'Supino Reto com Barra',
      equipment: 'Barra',
      note: '',
      restSeconds: 90,
      sets: prevSupino.map((p, i) => ({
        id: generateId(),
        setNumber: i + 1,
        type: 'normal' as SetType,
        weight: '',
        reps: '',
        completed: false,
        previousWeight: p.w,
        previousReps: p.r,
      })),
    },
    {
      id: generateId(),
      name: 'Rosca Direta com Barra',
      equipment: 'Barra',
      note: '',
      restSeconds: 90,
      sets: prevRosca.map((p, i) => ({
        id: generateId(),
        setNumber: i + 1,
        type: 'normal' as SetType,
        weight: '',
        reps: '',
        completed: false,
        previousWeight: p.w,
        previousReps: p.r,
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

export default function ActiveWorkoutScreen({
  navigation: navProp,
}: ActiveWorkoutScreenProps) {
  const nav = navProp || useNavigation();
  const { user } = useAuth();

  // ---- state ----
  const [workoutName] = useState('Treino A - Peito e Biceps');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exercises, setExercises] = useState<WorkoutExercise[]>(
    createMockExercises,
  );
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- derived stats ----
  const completedSets = exercises.flatMap((ex) =>
    ex.sets.filter((s) => s.completed),
  );
  const totalVolume = completedSets.reduce((acc, s) => {
    const w = parseFloat(s.weight) || 0;
    const r = parseFloat(s.reps) || 0;
    return acc + w * r;
  }, 0);
  const totalCompletedSets = completedSets.length;

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
            if (nowCompleted) startRestTimer(ex.restSeconds);
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

  const cycleSetType = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            const currentIdx = SET_TYPE_ORDER.indexOf(s.type);
            const nextIdx = (currentIdx + 1) % SET_TYPE_ORDER.length;
            return { ...s, type: SET_TYPE_ORDER[nextIdx] };
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
              type: 'normal' as SetType,
              weight: '',
              reps: '',
              completed: false,
              previousWeight: null,
              previousReps: null,
            },
          ],
        };
      }),
    );
  };

  const addExercise = () => {
    if (nav) {
      try {
        nav.navigate('ExerciseSearch');
      } catch {
        Alert.alert(
          'Adicionar Exercicio',
          'Navegacao para busca de exercicios sera implementada em breve.',
        );
      }
    } else {
      Alert.alert(
        'Adicionar Exercicio',
        'Navegacao para busca de exercicios sera implementada em breve.',
      );
    }
  };

  const handleFinish = async () => {
    const totalExercises = exercises.filter((ex) =>
      ex.sets.some((s) => s.completed),
    ).length;
    const points = totalCompletedSets * 15 + totalExercises * 50 + 200;

    if (user) {
      try {
        // 1. Salvar sessão de treino
        const { data: logData } = await supabase.from('workout_logs_v2').insert({
          user_id: user.id,
          name: workoutName,
          started_at: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
          finished_at: new Date().toISOString(),
          duration_seconds: elapsedSeconds,
          volume_total: totalVolume,
          points_earned: points,
          workout_date: new Date().toISOString().split('T')[0],
        }).select('id').single();

        // 2. Salvar séries individuais
        if (logData) {
          const setsToInsert: any[] = [];
          exercises.forEach((ex) => {
            ex.sets.forEach((s, i) => {
              if (s.completed) {
                setsToInsert.push({
                  workout_log_id: logData.id,
                  exercise_id: ex.id,
                  set_index: i + 1,
                  set_type: s.type || 'normal',
                  weight_kg: s.weight || null,
                  reps: s.reps || null,
                  is_completed: true,
                });
              }
            });
          });
          if (setsToInsert.length > 0) {
            await supabase.from('workout_sets').insert(setsToInsert);
          }
        }

        // 3. Atualizar pontos e streak do usuário
        const { data: userData } = await supabase
          .from('users')
          .select('total_points, current_streak, last_workout_date, total_workouts')
          .eq('id', user.id)
          .single();

        if (userData) {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          let newStreak = 1;
          if (userData.last_workout_date === today) {
            newStreak = userData.current_streak || 1;
          } else if (userData.last_workout_date === yesterday) {
            newStreak = (userData.current_streak || 0) + 1;
          }

          let multiplier = 1.0;
          if (newStreak >= 30) multiplier = 2.0;
          else if (newStreak >= 14) multiplier = 1.5;
          else if (newStreak >= 7) multiplier = 1.2;

          const finalPoints = Math.round(points * multiplier);

          await supabase.from('users').update({
            total_points: (userData.total_points || 0) + finalPoints,
            current_streak: newStreak,
            last_workout_date: today,
            total_workouts: (userData.total_workouts || 0) + 1,
          }).eq('id', user.id);
        }

        // 4. Postar automaticamente no feed
        const exerciseNames = exercises
          .filter((ex) => ex.sets.some((s) => s.completed))
          .slice(0, 3)
          .map((ex) => ex.name)
          .join(', ');
        const moreCount = totalExercises - 3;
        const feedText = `Completou ${workoutName}! 💪 ${totalExercises} exercícios, ${totalCompletedSets} séries, ${formatVolume(totalVolume)} de volume.${moreCount > 0 ? `\n${exerciseNames} e mais ${moreCount}` : `\n${exerciseNames}`}`;

        await supabase.from('posts').insert({
          user_id: user.id,
          text: feedText,
          hashtags: ['#BonyFit', '#Treino'],
        });

      } catch (err) {
        console.warn('Erro ao salvar treino:', err);
      }
    }

    Alert.alert(
      'Treino Finalizado! 🏆',
      `Duração: ${formatTimer(elapsedSeconds)}\nSéries completas: ${totalCompletedSets}\nVolume total: ${formatVolume(totalVolume)}\nPontos: +${points} pts`,
      [{ text: 'OK', onPress: () => { nav.goBack(); } }],
    );
  };

  const handleDiscard = () => {
    Alert.alert('Descartar treino?', 'Todo o progresso sera perdido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          if (restRef.current) clearInterval(restRef.current);
          nav.goBack();
        },
      },
    ]);
  };

  const handleClose = () => {
    Alert.alert(
      'Sair do treino?',
      'Voce tem um treino em andamento. Deseja descartar?',
      [
        { text: 'Continuar Treino', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            if (restRef.current) clearInterval(restRef.current);
            nav.goBack();
          },
        },
      ],
    );
  };

  // ---- set label ----
  const getSetLabel = (set: WorkoutSet): { text: string; color: string } => {
    switch (set.type) {
      case 'warmup':
        return { text: 'W', color: '#3B82F6' };
      case 'drop_set':
        return { text: 'D', color: '#A855F7' };
      case 'failure':
        return { text: 'F', color: '#EF4444' };
      default:
        return { text: String(set.setNumber), color: '#666666' };
    }
  };

  // ---- previous display ----
  const getPreviousDisplay = (set: WorkoutSet): string => {
    if (set.previousWeight && set.previousReps) {
      return `${set.previousWeight}kg \u00D7 ${set.previousReps}`;
    }
    return '\u2014';
  };

  // ---- render ----
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* ============ HEADER ============ */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>{'\u2715'}</Text>
          </TouchableOpacity>

          {/* Timer center */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
          </View>

          {/* Finalizar button */}
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>Finalizar</Text>
          </TouchableOpacity>
        </View>

        {/* Workout name */}
        <Text style={styles.workoutName} numberOfLines={1}>
          {workoutName}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tempo</Text>
            <Text style={styles.statValue}>
              {Math.floor(elapsedSeconds / 60)}min
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValueWhite}>{formatVolume(totalVolume)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Series</Text>
            <Text style={styles.statValueWhite}>{totalCompletedSets}</Text>
          </View>
        </View>
      </View>

      {/* ============ REST TIMER BANNER ============ */}
      {restTimerActive && (
        <View style={styles.restBanner}>
          <Text style={styles.restBannerIcon}>{'\u23F1'}</Text>
          <Text style={styles.restBannerText}>
            Descanso: {formatRestTimer(restSeconds)}
          </Text>
        </View>
      )}

      {/* ============ EXERCISES SCROLL ============ */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {exercises.map((exercise, exIndex) => (
          <View key={exercise.id}>
            {/* Separator between exercises */}
            {exIndex > 0 && <View style={styles.exerciseSeparator} />}

            {/* ---- Exercise block ---- */}
            <View style={styles.exerciseBlock}>
              {/* Exercise name + menu */}
              <View style={styles.exerciseHeaderRow}>
                <View style={styles.exerciseNameContainer}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseEquipment}>
                    {exercise.equipment}
                  </Text>
                </View>
                <TouchableOpacity style={styles.menuButton}>
                  <Text style={styles.menuButtonText}>{'\u22EF'}</Text>
                </TouchableOpacity>
              </View>

              {/* Notes */}
              <TouchableOpacity style={styles.notesArea}>
                <Text style={styles.notesPlaceholder}>
                  {exercise.note || 'Adicionar nota...'}
                </Text>
              </TouchableOpacity>

              {/* Rest timer link */}
              <TouchableOpacity style={styles.restTimerLink}>
                <Text style={styles.restTimerLinkText}>
                  {'\u23F1'} Rest Timer: {formatRestDisplay(exercise.restSeconds)}
                </Text>
              </TouchableOpacity>

              {/* Table header */}
              <View style={styles.tableHeader}>
                <View style={styles.colSerie}>
                  <Text style={styles.tableHeaderText}>SERIE</Text>
                </View>
                <View style={styles.colAnterior}>
                  <Text style={styles.tableHeaderText}>ANTERIOR</Text>
                </View>
                <View style={styles.colKg}>
                  <Text style={styles.tableHeaderText}>KG</Text>
                </View>
                <View style={styles.colReps}>
                  <Text style={styles.tableHeaderText}>REPS</Text>
                </View>
                <View style={styles.colCheck}>
                  <Text style={styles.tableHeaderText}>{'\u2713'}</Text>
                </View>
              </View>

              {/* Set rows */}
              {exercise.sets.map((set) => {
                const label = getSetLabel(set);
                return (
                  <View
                    key={set.id}
                    style={[
                      styles.setRow,
                      set.completed && styles.setRowCompleted,
                    ]}
                  >
                    {/* Serie number */}
                    <TouchableOpacity
                      style={styles.colSerie}
                      onLongPress={() => cycleSetType(exercise.id, set.id)}
                    >
                      <Text
                        style={[
                          styles.setNumberText,
                          {
                            color: label.color,
                            fontFamily:
                              set.type !== 'normal'
                                ? fonts.numbersBold
                                : fonts.numbersBold,
                          },
                        ]}
                      >
                        {label.text}
                      </Text>
                    </TouchableOpacity>

                    {/* Anterior */}
                    <View style={styles.colAnterior}>
                      <Text style={styles.previousText}>
                        {getPreviousDisplay(set)}
                      </Text>
                    </View>

                    {/* KG input */}
                    <View style={styles.colKg}>
                      <TextInput
                        style={styles.inputKg}
                        value={set.weight}
                        onChangeText={(v) =>
                          updateSetField(exercise.id, set.id, 'weight', v)
                        }
                        keyboardType="numeric"
                        placeholder={set.previousWeight || '\u2014'}
                        placeholderTextColor="#444444"
                        selectTextOnFocus
                      />
                    </View>

                    {/* Reps input */}
                    <View style={styles.colReps}>
                      <TextInput
                        style={styles.inputReps}
                        value={set.reps}
                        onChangeText={(v) =>
                          updateSetField(exercise.id, set.id, 'reps', v)
                        }
                        keyboardType="numeric"
                        placeholder={set.previousReps || '\u2014'}
                        placeholderTextColor="#444444"
                        selectTextOnFocus
                      />
                    </View>

                    {/* Check button */}
                    <View style={styles.colCheck}>
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          set.completed && styles.checkButtonCompleted,
                        ]}
                        onPress={() =>
                          toggleSetCompleted(exercise.id, set.id)
                        }
                        activeOpacity={0.7}
                      >
                        {set.completed && (
                          <Text style={styles.checkIcon}>{'\u2713'}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Add set button */}
              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => addSet(exercise.id)}
              >
                <Text style={styles.addSetText}>+ Adicionar Serie</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* ============ ADD EXERCISE BUTTON ============ */}
        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={addExercise}
        >
          <Text style={styles.addExerciseText}>+ Adicionar Exercicio</Text>
        </TouchableOpacity>

        {/* ============ DISCARD BUTTON ============ */}
        <TouchableOpacity
          style={styles.discardButton}
          onPress={handleDiscard}
        >
          <Text style={styles.discardText}>Descartar Treino</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const COL_SERIE_WIDTH = 48;
const COL_KG_WIDTH = 64;
const COL_REPS_WIDTH = 54;
const COL_CHECK_WIDTH = 40;

const styles = StyleSheet.create({
  // ---- container ----
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  // ---- header ----
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: fonts.body,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontFamily: fonts.numbersExtraBold,
    fontSize: 20,
  },
  finishButton: {
    backgroundColor: '#F26522',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  workoutName: {
    color: '#999999',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statLabel: {
    color: '#666666',
    fontFamily: fonts.body,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    color: '#F26522',
    fontFamily: fonts.numbersBold,
    fontSize: 14,
  },
  statValueWhite: {
    color: '#FFFFFF',
    fontFamily: fonts.numbersBold,
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#333333',
  },

  // ---- rest banner ----
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(242,101,34,0.12)',
    paddingVertical: 10,
    gap: 6,
  },
  restBannerIcon: {
    fontSize: 14,
  },
  restBannerText: {
    color: '#F26522',
    fontFamily: fonts.numbersBold,
    fontSize: 14,
  },

  // ---- scroll ----
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },

  // ---- exercise separator ----
  exerciseSeparator: {
    height: 1,
    backgroundColor: '#1A1A1A',
    marginVertical: spacing.lg,
  },

  // ---- exercise block ----
  exerciseBlock: {
    marginBottom: spacing.sm,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  exerciseNameContainer: {
    flex: 1,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    marginBottom: 2,
  },
  exerciseEquipment: {
    color: '#666666',
    fontFamily: fonts.body,
    fontSize: 13,
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    color: '#999999',
    fontSize: 20,
    fontFamily: fonts.bodyBold,
  },

  // ---- notes ----
  notesArea: {
    marginBottom: spacing.sm,
    paddingVertical: 6,
  },
  notesPlaceholder: {
    color: '#444444',
    fontFamily: fonts.body,
    fontSize: 13,
  },

  // ---- rest timer link ----
  restTimerLink: {
    marginBottom: spacing.md,
    paddingVertical: 4,
  },
  restTimerLinkText: {
    color: '#F26522',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },

  // ---- table header ----
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingVertical: 4,
  },
  tableHeaderText: {
    color: '#555555',
    fontFamily: fonts.numbersBold,
    fontSize: 11,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // ---- column widths ----
  colSerie: {
    width: COL_SERIE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colAnterior: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colKg: {
    width: COL_KG_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colReps: {
    width: COL_REPS_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colCheck: {
    width: COL_CHECK_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- set row ----
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    marginBottom: 2,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(74,222,128,0.08)',
  },
  setNumberText: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    textAlign: 'center',
  },
  previousText: {
    color: '#555555',
    fontFamily: fonts.numbersBold,
    fontSize: 13,
  },

  // ---- inputs ----
  inputKg: {
    width: 60,
    height: 36,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    color: '#FFFFFF',
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  inputReps: {
    width: 50,
    height: 36,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    color: '#FFFFFF',
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
  },

  // ---- check button ----
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#333333',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    lineHeight: 16,
  },

  // ---- add set ----
  addSetButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  addSetText: {
    color: '#F26522',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },

  // ---- add exercise ----
  addExerciseButton: {
    borderWidth: 1,
    borderColor: '#F26522',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  addExerciseText: {
    color: '#F26522',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },

  // ---- discard ----
  discardButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: spacing.xxl,
  },
  discardText: {
    color: '#EF4444',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});
