import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Platform,
  Vibration,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../tokens';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import SetTypeBadge from '../components/workout/SetTypeBadge';
import SetTypeModal from '../components/workout/SetTypeModal';
import DropSetPanel from '../components/workout/DropSetPanel';
import RIRPanel from '../components/workout/RIRPanel';
import { useUI } from '../hooks/useUI';
import ConfettiBurst, { ConfettiBurstRef } from '../components/ui/ConfettiBurst';

// ─── Types ────────────────────────────────────────────────────
interface WorkoutSet {
  id: string;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  prevWeight: number | null;
  prevReps: number | null;
  type: string;
  drops: Array<{ kg: string; reps: string }>;
  rir: string;
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
        { id: uid(), weight: 60, reps: 12, completed: false, prevWeight: 60, prevReps: 12, type: 'normal', drops: [], rir: '' },
        { id: uid(), weight: 60, reps: 12, completed: false, prevWeight: 60, prevReps: 12, type: 'normal', drops: [], rir: '' },
        { id: uid(), weight: 55, reps: 10, completed: false, prevWeight: 55, prevReps: 10, type: 'normal', drops: [], rir: '' },
        { id: uid(), weight: 55, reps: 10, completed: false, prevWeight: 55, prevReps: 10, type: 'normal', drops: [], rir: '' },
      ],
    },
    {
      id: uid(), name: 'Rosca Direta com Barra', equipment: 'Barra', muscleGroup: 'Bíceps',
      restSeconds: 90,
      sets: [
        { id: uid(), weight: 30, reps: 12, completed: false, prevWeight: 30, prevReps: 12, type: 'normal', drops: [], rir: '' },
        { id: uid(), weight: 30, reps: 10, completed: false, prevWeight: 30, prevReps: 10, type: 'normal', drops: [], rir: '' },
        { id: uid(), weight: 25, reps: 10, completed: false, prevWeight: 25, prevReps: 10, type: 'normal', drops: [], rir: '' },
      ],
    },
  ];
}

// ─── Component ────────────────────────────────────────────────
export default function ActiveWorkoutScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const confettiRef = React.useRef<ConfettiBurstRef>(null);
  const { confirm, toast } = useUI();
  const [errorSetId, setErrorSetId] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedSetInfo, setSelectedSetInfo] = useState<{ exId: string; setIdx: number; currentType: string; setNum: number } | null>(null);

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
  const totalSetsCount = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const progressPercentage = totalSetsCount > 0 ? Math.round((seriesTotal / totalSetsCount) * 100) : 0;

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
    const ex = exercises.find((e) => e.id === exId);
    if (!ex) return;
    const set = ex.sets[setIdx];
    if (!set) return;

    // Validate before completing
    if (!set.completed && (!set.weight || !set.reps)) {
      // Flash error on the set
      setErrorSetId(set.id);
      setTimeout(() => setErrorSetId(null), 1200);
      return;
    }

    const nowCompleted = !set.completed;
    if (nowCompleted) {
      try { Vibration.vibrate(100); } catch {}
      if (Platform.OS !== 'web') { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
      Keyboard.dismiss();
      startRest(ex.restSeconds);
    }

    setExercises((prev) =>
      prev.map((e) =>
        e.id === exId
          ? { ...e, sets: e.sets.map((s, i) => (i === setIdx ? { ...s, completed: nowCompleted } : s)) }
          : e
      )
    );
  };

  const addSet = (exId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? { ...ex, sets: [...ex.sets, { id: uid(), weight: null, reps: null, completed: false, prevWeight: null, prevReps: null, type: 'normal', drops: [], rir: '' }] }
          : ex
      )
    );
  };

  const handleSetTypeChange = (type: string) => {
    if (!selectedSetInfo) return;
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === selectedSetInfo.exId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === selectedSetInfo.setIdx
                  ? { ...s, type, drops: type === 'drop' ? (s.drops.length ? s.drops : [{ kg: '', reps: '' }]) : s.drops }
                  : s
              ),
            }
          : ex
      )
    );
    setShowTypeModal(false);
  };

  const handleUpdateDrop = (exId: string, setIdx: number, dropIdx: number, field: 'kg' | 'reps', value: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === setIdx
                  ? { ...s, drops: s.drops.map((d, di) => (di === dropIdx ? { ...d, [field]: value } : d)) }
                  : s
              ),
            }
          : ex
      )
    );
  };

  const handleAddDrop = (exId: string, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === setIdx ? { ...s, drops: [...s.drops, { kg: '', reps: '' }] } : s
              ),
            }
          : ex
      )
    );
  };

  const handleUpdateRIR = (exId: string, setIdx: number, value: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) => (i === setIdx ? { ...s, rir: value } : s)),
            }
          : ex
      )
    );
  };

  const removeExercise = async (exId: string) => {
    const remove = await confirm({
      icon: 'trash',
      title: 'Remover exercício?',
      message: 'Este exercício será removido do treino.',
      confirmLabel: 'Remover',
      confirmVariant: 'danger',
    });
    if (remove) setExercises((prev) => prev.filter((ex) => ex.id !== exId));
  };

  // ─── Finish ─────────────────────────────────────────────────
  const handleFinish = async () => {
    if (seriesTotal === 0) {
      await confirm({
        icon: 'info',
        title: 'Nenhuma série',
        message: 'Complete pelo menos uma série.',
        confirmLabel: 'OK',
        cancelLabel: '',
        confirmVariant: 'primary',
      });
      return;
    }

    const exercisesCompleted = exercises.filter((ex) => ex.sets.some((s) => s.completed)).length;
    const points = seriesTotal * 15 + exercisesCompleted * 50 + 200;

    const doFinish = async () => {
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

                // Gamificação server-side via Edge Function
                if (logData) {
                  const { data: gamifResult, error: gamifError } = await supabase.functions.invoke('completar-treino', {
                    body: { workout_log_id: logData.id },
                  });
                  if (gamifError) console.warn('Gamificação falhou:', gamifError);
                }

                // Auto-post to feed
                await supabase.from('posts').insert({
                  user_id: authUser.id,
                  post_type: 'treino',
                  text: `Completou ${workoutName}! 💪`,
                  metadata: { duracao: Math.round(elapsed / 60), volume: volumeTotal, exercicios: exercisesCompleted, series: seriesTotal },
                });
              }
            } catch (err) {
              console.warn('Erro ao salvar:', err);
              Alert.alert('Erro ao salvar', 'Seu treino não foi registrado. Verifique sua conexão e tente novamente.');
            }

            // Refresh user data so Home picks up updated total_workouts/points/streak
            useAuth.getState().loadUser();

            if (timerRef.current) clearInterval(timerRef.current);
            stopRest();
            navigation.goBack();
            toast({ type: 'success', title: 'Treino finalizado! 💪', message: `+${points} pontos` });
    };

    const shouldFinish = await confirm({
      icon: 'success',
      title: 'Finalizar Treino?',
      message: `${seriesTotal} séries \u00B7 ${formatVolume(volumeTotal)} volume\n${exercisesCompleted} exercícios \u00B7 +${points} pts`,
      confirmLabel: 'Finalizar',
      cancelLabel: 'Continuar',
      confirmVariant: 'primary',
    });
    if (shouldFinish) {
      if (Platform.OS !== 'web') { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
            confettiRef.current?.fire();
      doFinish();
    }
  };

  // ─── Close/Discard ──────────────────────────────────────────
  const handleClose = async () => {
    const discard = await confirm({
      icon: 'warning',
      title: 'Descartar treino?',
      message: 'Seu progresso não será salvo.',
      confirmLabel: 'Descartar',
      cancelLabel: 'Continuar',
      confirmVariant: 'danger',
    });
    if (discard) {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRest();
      navigation.goBack();
    }
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

      {/* ═══ PROGRESS BAR ═══ */}
      <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, marginHorizontal: 20, marginBottom: 8 }}>
        <View style={{ height: 3, backgroundColor: '#F26522', borderRadius: 2, width: `${progressPercentage}%` }} />
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
              <View key={set.id}>
                <View style={[styles.tableRow, set.completed && styles.rowDone]}>
                  <SetTypeBadge
                    setNumber={si + 1}
                    type={set.type}
                    onPress={() => {
                      setSelectedSetInfo({ exId: ex.id, setIdx: si, currentType: set.type, setNum: si + 1 });
                      setShowTypeModal(true);
                    }}
                  />
                  <Text style={[styles.prevText, { flex: 1 }]}>
                    {set.prevWeight && set.prevReps ? `${set.prevWeight}kg × ${set.prevReps}` : '—'}
                  </Text>
                  <TextInput
                    style={[styles.input, { width: 60 }, set.completed && styles.inputDone, errorSetId === set.id && styles.inputError]}
                    value={set.weight?.toString() ?? ''}
                    onChangeText={(v) => updateWeight(ex.id, si, v)}
                    keyboardType="decimal-pad"
                    placeholder={set.prevWeight?.toString() ?? '0'}
                    placeholderTextColor="#444"
                    editable={!set.completed}
                  />
                  <TextInput
                    style={[styles.input, { width: 56 }, set.completed && styles.inputDone, errorSetId === set.id && styles.inputError]}
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
                {set.type === 'drop' && (
                  <DropSetPanel
                    drops={set.drops}
                    onUpdateDrop={(dropIdx, field, value) => handleUpdateDrop(ex.id, si, dropIdx, field, value)}
                    onAddDrop={() => handleAddDrop(ex.id, si)}
                  />
                )}
                {set.type === 'rir' && (
                  <RIRPanel
                    rir={set.rir}
                    onUpdateRIR={(value) => handleUpdateRIR(ex.id, si, value)}
                  />
                )}
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

      <SetTypeModal
        visible={showTypeModal}
        currentType={selectedSetInfo?.currentType || 'normal'}
        setNumber={selectedSetInfo?.setNum || 1}
        onSelect={handleSetTypeChange}
        onClose={() => setShowTypeModal(false)}
      />
      <ConfettiBurst ref={confettiRef} />
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
  timerText: { color: colors.text, fontFamily: fonts.numbersExtraBold, fontSize: 26, textShadowColor: 'rgba(242,101,34,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
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
  inputError: { borderWidth: 2, borderColor: colors.danger },

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
