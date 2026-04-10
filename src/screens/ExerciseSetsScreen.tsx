import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../tokens';
import { useTreinoStore } from '../stores/treinoStore';
import SetTypePills from '../components/treino/SetTypePills';
import TempoBox from '../components/treino/TempoBox';
import SetRow from '../components/treino/SetRow';
import ExerciseNav from '../components/treino/ExerciseNav';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

export default function ExerciseSetsScreen({ navigation, route }: any) {
  const { exerciseIdx: initialIdx } = route.params;
  const {
    exercises, treinoIniciado, workoutName, inicioTimestamp,
    toggleSerie, updateSerieWeight, updateSerieReps,
    getSeriesConcluidas, getSeriesTotais, getPontos,
  } = useTreinoStore();

  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const { user } = useAuth();

  const exercise = exercises[currentIdx];
  if (!exercise) {
    navigation.goBack();
    return null;
  }

  const prevEx = currentIdx > 0 ? exercises[currentIdx - 1] : null;
  const nextEx = currentIdx < exercises.length - 1 ? exercises[currentIdx + 1] : null;
  const isLast = currentIdx === exercises.length - 1;
  const completedSets = exercise.sets.filter(s => s.completed).length;

  // Rest timer state
  const [restActive, setRestActive] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRestTimer = () => {
    const restSec = exercise.setType === 'tempo' ? 120 : exercise.restSeconds || 90;
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

  const podeMarcarSerie = useTreinoStore((s) => s.podeMarcarSerie);

  const handleToggle = (setIdx: number) => {
    const set = exercise.sets[setIdx];
    if (set.completed) {
      toggleSerie(currentIdx, setIdx); // uncomplete
      return;
    }
    if (!set.weight || !set.reps) {
      Alert.alert('Preencha', 'Insira peso e repetições antes de marcar.');
      return;
    }
    const { pode, aguardar } = podeMarcarSerie(currentIdx, exercise.setType);
    if (!pode) {
      if (aguardar > 0) {
        Alert.alert('Aguarde', `Espere ${aguardar}s antes de completar a próxima série.`);
      } else {
        Alert.alert('Bloqueado', 'Gamificação suspensa. Procure a recepção.');
      }
      return;
    }
    toggleSerie(currentIdx, setIdx);
    startRestTimer();
  };

  const handleFinish = async () => {
    const allDone = exercises.every(ex => ex.sets.every(s => s.completed));
    const confirm = allDone
      ? true
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Finalizar treino?',
            `${getSeriesConcluidas()}/${getSeriesTotais()} séries concluídas. Deseja finalizar?`,
            [
              { text: 'Continuar', onPress: () => resolve(false) },
              { text: 'Finalizar', onPress: () => resolve(true), style: 'default' },
            ]
          );
        });

    if (!confirm) return;

    try {
      const authUser = user || (await supabase.auth.getUser()).data?.user;
      if (!authUser) return;

      const elapsed = inicioTimestamp ? Math.floor((Date.now() - inicioTimestamp) / 1000) : 0;
      const volumeTotal = exercises.reduce((sum, ex) =>
        sum + ex.sets.filter(s => s.completed).reduce((s2, set) => s2 + (set.weight || 0) * (set.reps || 0), 0), 0);

      const { data: logData, error: logError } = await supabase.from('workout_logs_v2').insert({
        user_id: authUser.id,
        name: workoutName || 'Treino',
        started_at: new Date(inicioTimestamp || Date.now()).toISOString(),
        finished_at: new Date().toISOString(),
        duration_seconds: elapsed,
        volume_total: volumeTotal,
        points_earned: getPontos(),
        workout_date: new Date().toISOString().split('T')[0],
      }).select('id').single();

      if (logError) {
        Alert.alert('Erro', `Treino não salvo: ${logError.message}`);
        return;
      }

      // Save sets
      if (logData) {
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const setsToInsert = exercises.flatMap((ex) =>
          ex.sets.filter(s => s.completed).map((s, i) => ({
            workout_log_id: logData.id,
            ...(ex.dbId && UUID_RE.test(ex.dbId) ? { exercise_id: ex.dbId } : {}),
            exercise_name: ex.name,
            set_index: i + 1,
            weight_kg: s.weight,
            reps: s.reps,
            is_completed: true,
          }))
        );
        if (setsToInsert.length > 0) {
          await supabase.from('workout_sets').insert(setsToInsert);
        }

        // Gamification (best-effort)
        try {
          await supabase.functions.invoke('completar-treino', {
            body: { workout_log_id: logData.id },
          });
        } catch {}
      }

      // Auto-post
      const exercisesCompleted = exercises.filter(ex => ex.sets.some(s => s.completed)).length;
      await supabase.from('posts').insert({
        user_id: authUser.id,
        post_type: 'treino',
        text: `Completou ${workoutName}! 💪`,
        metadata: { duracao: Math.round(elapsed / 60), volume: volumeTotal, exercicios: exercisesCompleted, series: getSeriesConcluidas() },
      });

      useAuth.getState().loadUser();
      useTreinoStore.getState().resetTreino();
      navigation.navigate('TreinoMain');
    } catch (err: any) {
      Alert.alert('Erro', 'Falha ao salvar treino.');
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
        {/* Set type pills (read-only) */}
        <SetTypePills active={exercise.setType} />

        {/* Tempo box */}
        {exercise.setType === 'tempo' && exercise.tempoPerRep && (
          <TempoBox seconds={exercise.tempoPerRep} />
        )}

        {/* Rest timer */}
        {restActive && (
          <View style={styles.restBox}>
            <Text style={styles.restTime}>{restRemaining}s</Text>
            <Text style={styles.restLabel}>DESCANSO</Text>
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
            editable={treinoIniciado}
            onToggle={() => handleToggle(si)}
            onWeightChange={(v) => updateSerieWeight(currentIdx, si, v)}
            onRepsChange={(v) => updateSerieReps(currentIdx, si, v)}
          />
        ))}

        {/* Rest info */}
        <Text style={styles.restInfo}>
          Descanso: {exercise.setType === 'tempo' ? '120s' : `${exercise.restSeconds || 90}s`} entre séries
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
  restBox: { backgroundColor: '#1A1A1A', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 16, alignItems: 'center' },
  restTime: { fontSize: 32, fontFamily: fonts.numbersBold, color: colors.orange },
  restLabel: { fontSize: 10, fontFamily: fonts.bodyMedium, color: '#888', textTransform: 'uppercase', marginTop: 4 },
  restInfo: { textAlign: 'center', color: '#666', fontSize: 11, fontFamily: fonts.body, marginTop: 8, marginBottom: 12 },
});
