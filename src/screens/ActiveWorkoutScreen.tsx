import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  Platform,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../tokens';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

// ─── Types ────────────────────────────────────────────────────
interface WorkoutSet {
  id: string;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  prevWeight: number | null;
  prevReps: number | null;
}

interface WorkoutExercise {
  id: string;
  name: string;
  equipment: string;
  muscleGroup: string;
  sets: WorkoutSet[];
  restSeconds: number;
}

// ─── Helpers ──────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
  return `${Math.round(v)}kg`;
}

// ─── Initial mock exercises ───────────────────────────────────
function createInitialExercises(): WorkoutExercise[] {
  return [
    {
      id: uid(), name: 'Supino Reto com Barra', equipment: 'Barra', muscleGroup: 'Peito',
      restSeconds: 90,
      sets: [
        { id: uid(), weight: null, reps: null, completed: false, prevWeight: 60, prevReps: 12 },
        { id: uid(), weight: null, reps: null, completed: false, prevWeight: 60, prevReps: 12 },
        { id: uid(), weight: null, reps: null, completed: false, prevWeight: 55, prevReps: 10 },
        { id: uid(), weight: null, reps: null, completed: false, prevWeight: 55, prevReps: 10 },
      ],
    },
    {
      id: uid(), name: 'Rosca Direta com Barra', equipment: 'Barra', muscleGroup: 'Bíceps',
      restSeconds: 90,
      sets: [
        { id: uid(), weight: null, reps: null, completed: false, prevWeight: 30, prevReps: 12 },
        { id: uid(), weight: null, reps: null, completed: false, prevWeight: 30, prevReps: 10 },
        { id: uid(), weight: null, reps: null, completed: false, prevWeight: 25, prevReps: 10 },
      ],
    },
  ];
}

// ─── Component ────────────────────────────────────────────────
export default function ActiveWorkoutScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  // State
  const [workoutName] = useState('Treino A - Peito e Bíceps');
  const [exercises, setExercises] = useState<WorkoutExercise[]>(createInitialExercises);
  const [elapsed, setElapsed] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restSeconds, setRestSeconds] = useState(90);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Elapsed timer ──────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ─── Rest timer ─────────────────────────────────────────────
  const startRest = (secs: number) => {
    setRestSeconds(secs);
    setRestActive(true);
    if (restRef.current) clearInterval(restRef.current);
    let remaining = secs;
    restRef.current = setInterval(() => {
      remaining -= 1;
      setRestSeconds(remaining);
      if (remaining <= 0) {
        if (restRef.current) clearInterval(restRef.current);
        setRestActive(false);
        Vibration.vibrate([0, 300, 100, 300]);
      }
    }, 1000);
  };

  const stopRest = () => {
    if (restRef.current) clearInterval(restRef.current);
    setRestActive(false);
  };

  // ─── Calculated stats ───────────────────────────────────────
  const completedSets = exercises.flatMap((ex) => ex.sets.filter((s) => s.completed));
  const volumeTotal = completedSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
  const seriesTotal = completedSets.length;

  // ─── Set actions ────────────────────────────────────────────
  const updateWeight = (exId: string, setIdx: number, val: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.map((s, i) => (i === setIdx ? { ...s, weight: parseFloat(val) || null } : s)) }
          : ex
      )
    );
  };

  const updateReps = (exId: string, setIdx: number, val: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.map((s, i) => (i === setIdx ? { ...s, reps: parseInt(val) || null } : s)) }
          : ex
      )
    );
  };

  const toggleComplete = (exId: string, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exId) return ex;
        const newSets = ex.sets.map((s, i) => {
          if (i !== setIdx) return s;
          if (!s.completed && (!s.weight || !s.reps)) {
            Alert.alert('Preencha', 'Informe o peso e as repetições.');
            return s;
          }
          const nowCompleted = !s.completed;
          if (nowCompleted) {
            Vibration.vibrate(100);
            Keyboard.dismiss();
            startRest(ex.restSeconds);
          }
          return { ...s, completed: nowCompleted };
        });
        return { ...ex, sets: newSets };
      })
    );
  };

  const addSet = (exId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: [...ex.sets, { id: uid(), weight: null, reps: null, completed: false, prevWeight: null, prevReps: null }] }
          : ex
      )
    );
  };

  const removeExercise = (exId: string) => {
    Alert.alert('Remover exercício?', '', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => setExercises((prev) => prev.filter((ex) => ex.id !== exId)) },
    ]);
  };

  // ─── Finish ─────────────────────────────────────────────────
  const handleFinish = async () => {
    if (seriesTotal === 0) {
      Alert.alert('Nenhuma série', 'Complete pelo menos uma série.');
      return;
    }

    const exercisesCompleted = exercises.filter((ex) => ex.sets.some((s) => s.completed)).length;
    const points = seriesTotal * 15 + exercisesCompleted * 50 + 200;

    Alert.alert(
      'Finalizar Treino?',
      `${seriesTotal} séries · ${formatVolume(volumeTotal)} volume\n${exercisesCompleted} exercícios · +${points} pts`,
      [
        { text: 'Continuar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            try {
              const authUser = user || (await supabase.auth.getUser()).data?.user;
              if (authUser) {
                // Save workout log
                const { data: logData } = await supabase.from('workout_logs_v2').insert({
                  user_id: authUser.id,
                  name: workoutName,
                  started_at: new Date(Date.now() - elapsed * 1000).toISOString(),
                  finished_at: new Date().toISOString(),
                  duration_seconds: elapsed,
                  volume_total: volumeTotal,
                  points_earned: points,
                  workout_date: new Date().toISOString().split('T')[0],
                }).select('id').single();

                // Save sets
                if (logData) {
                  const setsToInsert = exercises.flatMap((ex) =>
                    ex.sets.filter((s) => s.completed).map((s, i) => ({
                      workout_log_id: logData.id,
                      exercise_id: ex.id,
                      set_index: i + 1,
                      weight_kg: s.weight,
                      reps: s.reps,
                      is_completed: true,
                    }))
                  );
                  if (setsToInsert.length > 0) {
                    await supabase.from('workout_sets').insert(setsToInsert);
                  }
                }

                // Update user points + streak
                const { data: userData } = await supabase
                  .from('users')
                  .select('total_points, current_streak, last_workout_date, total_workouts')
                  .eq('id', authUser.id)
                  .single();

                if (userData) {
                  const today = new Date().toISOString().split('T')[0];
                  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                  let streak = 1;
                  if (userData.last_workout_date === today) streak = userData.current_streak || 1;
                  else if (userData.last_workout_date === yesterday) streak = (userData.current_streak || 0) + 1;

                  let mult = 1.0;
                  if (streak >= 30) mult = 2.0;
                  else if (streak >= 14) mult = 1.5;
                  else if (streak >= 7) mult = 1.2;

                  const finalPts = Math.round(points * mult);

                  await supabase.from('users').update({
                    total_points: (userData.total_points || 0) + finalPts,
                    current_streak: streak,
                    last_workout_date: today,
                    total_workouts: (userData.total_workouts || 0) + 1,
                  }).eq('id', authUser.id);

                  // Auto-post to feed
                  await supabase.from('posts').insert({
                    user_id: authUser.id,
                    post_type: 'treino',
                    text: `Completou ${workoutName}! 💪`,
                    metadata: { duracao: Math.round(elapsed / 60), volume: volumeTotal, exercicios: exercisesCompleted, series: seriesTotal },
                  });
                }
              }
            } catch (err) {
              console.warn('Erro ao salvar:', err);
            }

            if (timerRef.current) clearInterval(timerRef.current);
            stopRest();
            navigation.goBack();
            Alert.alert('Treino finalizado! 💪', `+${points} pontos!`);
          },
        },
      ]
    );
  };

  // ─── Close/Discard ──────────────────────────────────────────
  const handleClose = () => {
    Alert.alert('Descartar treino?', 'Seu progresso será perdido.', [
      { text: 'Continuar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          if (timerRef.current) clearInterval(timerRef.current);
          stopRest();
          navigation.goBack();
        },
      },
    ]);
  };

  // ─── Render ─────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ═══ HEADER ═══ */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.timerText}>{formatTime(elapsed)}</Text>

          <TouchableOpacity onPress={handleFinish} style={styles.finishBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.finishText}>Finalizar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.workoutName}>{workoutName}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>TEMPO</Text>
            <Text style={styles.statValueOrange}>{Math.floor(elapsed / 60)}min</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>VOLUME</Text>
            <Text style={styles.statValue}>{formatVolume(volumeTotal)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SÉRIES</Text>
            <Text style={styles.statValue}>{seriesTotal}</Text>
          </View>
        </View>
      </View>

      {/* ═══ REST BANNER ═══ */}
      {restActive && (
        <TouchableOpacity style={styles.restBanner} onPress={stopRest}>
          <Text style={styles.restBannerText}>⏱ Descanso: {formatTime(restSeconds)}  (toque pra pular)</Text>
        </TouchableOpacity>
      )}

      {/* ═══ EXERCISES ═══ */}
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {exercises.map((ex) => (
          <View key={ex.id} style={styles.exerciseCard}>
            {/* Exercise header */}
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseMeta}>{ex.equipment} · {ex.muscleGroup}</Text>
              </View>
              <TouchableOpacity onPress={() => removeExercise(ex.id)} style={styles.moreBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.moreText}>⋯</Text>
              </TouchableOpacity>
            </View>

            {/* Table header */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableH, { width: 40, textAlign: 'center' }]}>SÉRIE</Text>
              <Text style={[styles.tableH, { flex: 1, textAlign: 'center' }]}>ANTERIOR</Text>
              <Text style={[styles.tableH, { width: 60, textAlign: 'center' }]}>KG</Text>
              <Text style={[styles.tableH, { width: 56, textAlign: 'center' }]}>REPS</Text>
              <Text style={[styles.tableH, { width: 40, textAlign: 'center' }]}>✓</Text>
            </View>

            {/* Set rows */}
            {ex.sets.map((set, si) => (
              <View key={set.id} style={[styles.tableRow, set.completed && styles.rowDone]}>
                <Text style={[styles.setNum, { width: 40 }]}>{si + 1}</Text>
                <Text style={[styles.prevText, { flex: 1 }]}>
                  {set.prevWeight && set.prevReps ? `${set.prevWeight}kg × ${set.prevReps}` : '—'}
                </Text>
                <TextInput
                  style={[styles.input, { width: 60 }, set.completed && styles.inputDone]}
                  value={set.weight?.toString() ?? ''}
                  onChangeText={(v) => updateWeight(ex.id, si, v)}
                  keyboardType="decimal-pad"
                  placeholder={set.prevWeight?.toString() ?? '0'}
                  placeholderTextColor="#444"
                  editable={!set.completed}
                />
                <TextInput
                  style={[styles.input, { width: 56 }, set.completed && styles.inputDone]}
                  value={set.reps?.toString() ?? ''}
                  onChangeText={(v) => updateReps(ex.id, si, v)}
                  keyboardType="number-pad"
                  placeholder={set.prevReps?.toString() ?? '0'}
                  placeholderTextColor="#444"
                  editable={!set.completed}
                />
                <TouchableOpacity
                  style={[styles.checkBtn, set.completed && styles.checkDone]}
                  onPress={() => toggleComplete(ex.id, si)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {set.completed && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              </View>
            ))}

            {/* Add set */}
            <TouchableOpacity onPress={() => addSet(ex.id)} style={styles.addSetBtn}>
              <Text style={styles.addSetText}>+ Adicionar Série</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add exercise */}
        <TouchableOpacity
          style={styles.addExBtn}
          onPress={() => (navigation as any).navigate('ExerciseSearch')}
        >
          <Text style={styles.addExText}>+ Adicionar Exercício</Text>
        </TouchableOpacity>

        {/* Discard */}
        <TouchableOpacity onPress={handleClose} style={styles.discardBtn}>
          <Text style={styles.discardText}>Descartar treino</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 12,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
    backgroundColor: colors.bg,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { padding: 8 },
  closeText: { color: colors.text, fontSize: 22 },
  timerText: { color: colors.text, fontFamily: fonts.numbersExtraBold, fontSize: 26 },
  finishBtn: { backgroundColor: colors.orange, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.sm },
  finishText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 },
  workoutName: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, textAlign: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.md },
  statItem: { alignItems: 'center' },
  statLabel: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  statValueOrange: { color: colors.orange, fontFamily: fonts.numbersBold, fontSize: 16, marginTop: 2 },
  statValue: { color: colors.text, fontFamily: fonts.numbersBold, fontSize: 16, marginTop: 2 },

  // Rest banner
  restBanner: { backgroundColor: 'rgba(242,101,34,0.12)', paddingVertical: 10, alignItems: 'center' },
  restBannerText: { color: colors.orange, fontFamily: fonts.numbersBold, fontSize: 14 },

  // Scroll
  scroll: { flex: 1 },

  // Exercise
  exerciseCard: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: 0.5, borderBottomColor: colors.elevated },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  exerciseName: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 16 },
  exerciseMeta: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  moreBtn: { padding: 8 },
  moreText: { color: colors.textMuted, fontSize: 20 },

  // Table
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 4 },
  tableH: { color: colors.textMuted, fontFamily: fonts.bodyMedium, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowDone: { opacity: 0.5 },
  setNum: { color: colors.textMuted, fontFamily: fonts.numbersBold, fontSize: 14, textAlign: 'center' },
  prevText: { color: colors.textMuted, fontFamily: fonts.numbers, fontSize: 13, textAlign: 'center' },
  input: {
    backgroundColor: colors.elevated,
    borderRadius: 6,
    color: colors.text,
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  inputDone: { backgroundColor: 'rgba(46,204,113,0.15)', color: colors.success },

  // Check
  checkBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Add set
  addSetBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  addSetText: { color: colors.orange, fontFamily: fonts.bodyMedium, fontSize: 13 },

  // Add exercise
  addExBtn: { margin: spacing.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.orange + '40', borderRadius: radius.md, borderStyle: 'dashed' as any, alignItems: 'center' },
  addExText: { color: colors.orange, fontFamily: fonts.bodyMedium, fontSize: 14 },

  // Discard
  discardBtn: { padding: spacing.lg, alignItems: 'center' },
  discardText: { color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 14 },
});
