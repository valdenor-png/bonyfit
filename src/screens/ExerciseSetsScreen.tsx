import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../tokens';
import { useTreinoStore } from '../stores/treinoStore';
import { useUI } from '../hooks/useUI';
import SetTypePills from '../components/treino/SetTypePills';
import TempoBox from '../components/treino/TempoBox';
import SetRow from '../components/treino/SetRow';
import ExerciseNav from '../components/treino/ExerciseNav';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

export default function ExerciseSetsScreen({ navigation, route }: any) {
  const { exerciseIdx: initialIdx } = route.params;
  const {
    exercises, treinoIniciado, workoutName, inicioTimestamp, workoutLogId,
    toggleSerie, updateSerieWeight, updateSerieReps,
    getSeriesConcluidas, getSeriesTotais, getPontos, podeMarcarSerie,
    setWorkoutLogId,
  } = useTreinoStore();

  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useUI();

  const exercise = exercises[currentIdx];
  if (!exercise) {
    navigation.goBack();
    return null;
  }

  const prevEx = currentIdx > 0 ? exercises[currentIdx - 1] : null;
  const nextEx = currentIdx < exercises.length - 1 ? exercises[currentIdx + 1] : null;
  const isLast = currentIdx === exercises.length - 1;

  // ── Rest timer ─────────────────────────────────────────────
  const [restActive, setRestActive] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DESCANSO: Record<string, number> = { normal: 90, dropset: 60, tempo: 120, failure: 90 };

  const startRestTimer = () => {
    const restSec = DESCANSO[exercise.setType] ?? 90;
    setRestRemaining(restSec);
    setRestActive(true);
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current!);
          setRestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, []);

  // ── Ensure workout_log exists ──────────────────────────────
  const ensureWorkoutLog = async (): Promise<string | null> => {
    if (workoutLogId) return workoutLogId;

    const authUser = user || (await supabase.auth.getUser()).data?.user;
    if (!authUser) return null;

    const elapsed = inicioTimestamp ? Math.floor((Date.now() - inicioTimestamp) / 1000) : 0;
    const { data, error } = await supabase.from('workout_logs_v2').insert({
      user_id: authUser.id,
      name: workoutName || 'Treino',
      started_at: new Date(inicioTimestamp || Date.now()).toISOString(),
      duration_seconds: elapsed,
      volume_total: 0,
      points_earned: 0,
      workout_date: new Date().toISOString().split('T')[0],
    }).select('id').single();

    if (error || !data) {
      Alert.alert('Erro', `Não foi possível iniciar o registro: ${error?.message}`);
      return null;
    }

    setWorkoutLogId(data.id);
    return data.id;
  };

  // ── Complete set via Edge Function ─────────────────────────
  const handleToggle = async (setIdx: number) => {
    const set = exercise.sets[setIdx];

    // Can't uncomplete — backend already registered
    if (set.completed) return;

    if (!set.weight || !set.reps) {
      Alert.alert('Preencha', 'Insira peso e repetições antes de marcar.');
      return;
    }

    // Client-side cooldown check (UX only — backend revalidates)
    const { pode, aguardar } = podeMarcarSerie(exercise.setType);
    if (!pode) {
      Alert.alert('Aguarde', `Espere ${aguardar}s antes da próxima série.`);
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const logId = await ensureWorkoutLog();
      if (!logId) { setSubmitting(false); return; }

      // Call Edge Function — ALL validation happens server-side
      const { data, error } = await supabase.functions.invoke('registrar-serie', {
        body: {
          workout_log_id: logId,
          exercise_name: exercise.name,
          exercise_db_id: exercise.dbId || undefined,
          set_index: setIdx + 1,
          kg_real: set.weight,
          reps_real: set.reps,
          set_type: exercise.setType,
        },
      });

      if (error) {
        // Parse error from Edge Function response
        let msg = 'Erro ao registrar série';
        try {
          const body = typeof error === 'object' && error.message ? error.message : String(error);
          msg = body;
        } catch {}
        Alert.alert('Bloqueado', msg);
        setSubmitting(false);
        return;
      }

      // Parse response
      const result = data?.data ?? data;

      // Server approved — update local store
      toggleSerie(currentIdx, setIdx);
      startRestTimer();

      if (result?.exercicio_completo) {
        toast({ type: 'success', title: 'Exercício completo!', message: `+${result.pontos_ganhos} pts` });
      } else {
        toast({ type: 'success', title: 'Série registrada', message: `+${result?.pontos_ganhos ?? 15} pts` });
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao registrar série.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Finish workout via Edge Function ───────────────────────
  const handleFinish = async () => {
    const allDone = exercises.every(ex => ex.sets.every(s => s.completed));
    const doFinish = allDone
      ? true
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Finalizar treino?',
            `${getSeriesConcluidas()}/${getSeriesTotais()} séries concluídas. Deseja finalizar?`,
            [
              { text: 'Continuar', onPress: () => resolve(false) },
              { text: 'Finalizar', onPress: () => resolve(true) },
            ]
          );
        });

    if (!doFinish) return;

    const logId = workoutLogId;
    if (!logId) {
      Alert.alert('Erro', 'Treino não foi iniciado corretamente.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('finalizar-treino', {
        body: { workout_log_id: logId },
      });

      const result = data?.data ?? data;

      if (result?.status === 'invalidado') {
        Alert.alert(
          'Treino Invalidado',
          'Seu treino foi invalidado por padrão suspeito. Os pontos foram removidos.',
          [{ text: 'OK', onPress: () => { useTreinoStore.getState().resetTreino(); navigation.navigate('TreinoMain'); } }]
        );
        return;
      }

      // Auto-post to feed
      const authUser = user || (await supabase.auth.getUser()).data?.user;
      if (authUser) {
        const exercisesCompleted = exercises.filter(ex => ex.sets.some(s => s.completed)).length;
        const elapsed = inicioTimestamp ? Math.floor((Date.now() - inicioTimestamp) / 1000) : 0;
        const volumeTotal = exercises.reduce((sum, ex) =>
          sum + ex.sets.filter(s => s.completed).reduce((s2, set) => s2 + (set.weight || 0) * (set.reps || 0), 0), 0);

        await supabase.from('posts').insert({
          user_id: authUser.id,
          post_type: 'treino',
          text: `Completou ${workoutName}! 💪`,
          metadata: { duracao: Math.round(elapsed / 60), volume: volumeTotal, exercicios: exercisesCompleted, series: getSeriesConcluidas() },
        }).catch(() => {});
      }

      useAuth.getState().loadUser();
      useTreinoStore.getState().resetTreino();

      const status = result?.status ?? 'parcial';
      const bonus = result?.pontos_bonus ?? 0;

      if (status === 'completo') {
        Alert.alert('Treino Completo! 🎉', `+${bonus} pontos bônus!`, [
          { text: 'OK', onPress: () => navigation.navigate('TreinoMain') },
        ]);
      } else {
        Alert.alert('Treino Finalizado', `${getSeriesConcluidas()} séries registradas.`, [
          { text: 'OK', onPress: () => navigation.navigate('TreinoMain') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Erro', 'Falha ao finalizar treino.');
    } finally {
      setSubmitting(false);
    }
  };

  const navTo = (idx: number) => setCurrentIdx(idx);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{exercise.name}</Text>
        <View style={styles.muscleBadge}>
          <Text style={styles.muscleBadgeText}>{exercise.muscleGroup}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Set type pills (read-only for aluno) */}
        <SetTypePills active={exercise.setType} />

        {/* Tempo box */}
        {exercise.setType === 'tempo' && exercise.tempoPerRep && (
          <TempoBox seconds={exercise.tempoPerRep} />
        )}

        {/* Rest timer (obrigatório — sem botão pular) */}
        {restActive && (
          <View style={styles.restBox}>
            <Text style={styles.restTime}>{restRemaining}s</Text>
            <Text style={styles.restLabel}>DESCANSO OBRIGATÓRIO</Text>
          </View>
        )}

        {/* Column header */}
        <View style={styles.colHeader}>
          <Text style={[styles.colText, { width: 40 }]}>SÉRIE</Text>
          <Text style={[styles.colText, { flex: 1 }]}>
            KG × REPS{exercise.setType === 'tempo' ? ' × TEMPO' : ''}
          </Text>
          <Text style={[styles.colText, { width: 36, textAlign: 'center' }]}>✓</Text>
        </View>

        {/* Sets */}
        {exercise.sets.map((set, si) => (
          <SetRow
            key={set.id}
            index={si}
            weight={set.weight}
            reps={set.reps}
            tempoSeconds={set.tempoSeconds}
            completed={set.completed}
            showTempo={exercise.setType === 'tempo'}
            editable={treinoIniciado && !submitting}
            onToggle={() => handleToggle(si)}
            onWeightChange={(v) => updateSerieWeight(currentIdx, si, v)}
            onRepsChange={(v) => updateSerieReps(currentIdx, si, v)}
          />
        ))}

        {/* Rest info */}
        <Text style={styles.restInfo}>
          Descanso: {DESCANSO[exercise.setType] ?? 90}s entre séries (obrigatório)
        </Text>

        {/* Exercise navigation */}
        <ExerciseNav
          prevName={prevEx?.name}
          nextName={nextEx?.name}
          isLast={isLast}
          onPrev={() => navTo(currentIdx - 1)}
          onNext={() => navTo(currentIdx + 1)}
          onFinish={handleFinish}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text, flex: 1 },
  muscleBadge: { backgroundColor: 'rgba(242,101,34,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  muscleBadgeText: { color: colors.orange, fontSize: 11, fontFamily: fonts.bodyBold },
  content: { paddingTop: 8 },
  colHeader: { flexDirection: 'row', paddingHorizontal: 28, marginBottom: 8 },
  colText: { fontSize: 10, fontFamily: fonts.bodyMedium, color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 },
  restBox: { backgroundColor: '#1A1A1A', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.orange },
  restTime: { fontSize: 36, fontFamily: fonts.numbersBold, color: colors.orange },
  restLabel: { fontSize: 10, fontFamily: fonts.bodyBold, color: '#888', textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 },
  restInfo: { textAlign: 'center', color: '#666', fontSize: 11, fontFamily: fonts.body, marginTop: 8, marginBottom: 12 },
});
