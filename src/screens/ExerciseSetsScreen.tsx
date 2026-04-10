import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors, fonts } from '../tokens';
import { useTreinoStore } from '../stores/treinoStore';
import { useUI } from '../hooks/useUI';
import SetRow from '../components/treino/SetRow';
import ExerciseNav from '../components/treino/ExerciseNav';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

const DESCANSO: Record<string, number> = { normal: 90, aq: 15, pr: 120, dropset: 10, rir: 90, tempo: 120, failure: 90 };

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
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [showPR, setShowPR] = useState(false);
  const { user } = useAuth();
  const { toast } = useUI();

  const exercise = exercises[currentIdx];
  if (!exercise) { navigation.goBack(); return null; }

  const prevEx = currentIdx > 0 ? exercises[currentIdx - 1] : null;
  const nextEx = currentIdx < exercises.length - 1 ? exercises[currentIdx + 1] : null;
  const isLast = currentIdx === exercises.length - 1;

  const completedSets = exercise.sets.filter(s => s.completed);
  const allDoneThisEx = completedSets.length === exercise.sets.length && exercise.sets.length > 0;
  const currentSetIdx = exercise.sets.findIndex(s => !s.completed);

  // Volume total
  const volumeTotal = exercises.reduce((sum, ex) =>
    sum + ex.sets.filter(s => s.completed).reduce((s2, set) => s2 + (set.weight || 0) * (set.reps || 0), 0), 0);

  // ── Rest timer ─────────────────────────────────────────────
  const [restActive, setRestActive] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRestTimer = (type: string) => {
    const restSec = DESCANSO[type] ?? 90;
    setRestRemaining(restSec);
    setRestTotal(restSec);
    setRestActive(true);
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev <= 1) { clearInterval(restTimerRef.current!); setRestActive(false); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestActive(false);
    setRestRemaining(0);
  };

  useEffect(() => {
    return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
  }, []);

  // ── Ensure workout_log exists ──────────────────────────────
  const ensureWorkoutLog = async (): Promise<string | null> => {
    if (workoutLogId) return workoutLogId;
    const authUser = user || (await supabase.auth.getUser()).data?.user;
    if (!authUser) return null;
    const deviceId = Constants.installationId ?? `${Platform.OS}-${Constants.sessionId ?? 'unknown'}`;
    const { data, error } = await supabase.from('workout_logs_v2').insert({
      user_id: authUser.id,
      name: workoutName || 'Treino',
      started_at: new Date(inicioTimestamp || Date.now()).toISOString(),
      duration_seconds: 0, volume_total: 0, points_earned: 0,
      workout_date: new Date().toISOString().split('T')[0],
      device_id: deviceId,
    }).select('id').single();
    if (error || !data) { Alert.alert('Erro', `Não foi possível iniciar: ${error?.message}`); return null; }
    setWorkoutLogId(data.id);
    return data.id;
  };

  // ── Complete set via Edge Function ─────────────────────────
  const handleToggle = async (setIdx: number) => {
    const set = exercise.sets[setIdx];
    if (set.completed) return;
    if (!set.weight || !set.reps) { Alert.alert('Preencha', 'Insira reps e peso antes de marcar.'); return; }

    const { pode, aguardar } = podeMarcarSerie(exercise.setType);
    if (!pode) { Alert.alert('Aguarde', `Espere ${aguardar}s antes da próxima série.`); return; }
    if (submitting) return;
    setSubmitting(true);

    try {
      const logId = await ensureWorkoutLog();
      if (!logId) { setSubmitting(false); return; }

      const deviceId = Constants.installationId ?? `${Platform.OS}-${Constants.sessionId ?? 'unknown'}`;
      const { data, error } = await supabase.functions.invoke('registrar-serie', {
        body: {
          workout_log_id: logId,
          exercise_name: exercise.name,
          exercise_db_id: exercise.dbId || undefined,
          set_index: setIdx + 1,
          kg_real: set.weight,
          reps_real: set.reps,
          set_type: exercise.setType,
          device_id: deviceId,
        },
      });

      if (error) {
        const msg = typeof error === 'object' && error.message ? error.message : String(error);
        Alert.alert('Bloqueado', msg);
        setSubmitting(false);
        return;
      }

      const result = data?.data ?? data;
      toggleSerie(currentIdx, setIdx);
      startRestTimer(exercise.setType);

      // Check PR
      if (set.weight && set.prevWeight && set.weight > set.prevWeight) {
        setShowPR(true);
        setTimeout(() => setShowPR(false), 4000);
      }

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

  // ── Finish workout ─────────────────────────────────────────
  const handleFinish = async () => {
    const allDone = exercises.every(ex => ex.sets.every(s => s.completed));
    const doFinish = allDone ? true : await new Promise<boolean>((resolve) => {
      Alert.alert('Finalizar treino?', `${getSeriesConcluidas()}/${getSeriesTotais()} séries concluídas.`, [
        { text: 'Continuar', onPress: () => resolve(false) },
        { text: 'Finalizar', onPress: () => resolve(true) },
      ]);
    });
    if (!doFinish) return;

    const logId = workoutLogId;
    if (!logId) { Alert.alert('Erro', 'Treino não iniciado.'); return; }
    setSubmitting(true);

    try {
      const { data } = await supabase.functions.invoke('finalizar-treino', { body: { workout_log_id: logId } });
      const result = data?.data ?? data;

      if (result?.status === 'invalidado') {
        Alert.alert('Treino Invalidado', 'Padrão suspeito detectado. Pontos removidos.', [
          { text: 'OK', onPress: () => { useTreinoStore.getState().resetTreino(); navigation.navigate('TreinoMain'); } },
        ]);
        return;
      }

      const authUser = user || (await supabase.auth.getUser()).data?.user;
      if (authUser) {
        const elapsed = inicioTimestamp ? Math.floor((Date.now() - inicioTimestamp) / 1000) : 0;
        await supabase.from('posts').insert({
          user_id: authUser.id, post_type: 'treino',
          text: `Completou ${workoutName}! 💪`,
          metadata: { duracao: Math.round(elapsed / 60), volume: volumeTotal, exercicios: exercises.filter(ex => ex.sets.some(s => s.completed)).length, series: getSeriesConcluidas() },
        }).catch(() => {});
      }

      useAuth.getState().loadUser();
      useTreinoStore.getState().resetTreino();
      const bonus = result?.pontos_bonus ?? 0;
      Alert.alert(result?.status === 'completo' ? 'Treino Completo! 🎉' : 'Treino Finalizado',
        result?.status === 'completo' ? `+${bonus} pontos bônus!` : `${getSeriesConcluidas()} séries registradas.`,
        [{ text: 'OK', onPress: () => navigation.navigate('TreinoMain') }]
      );
    } catch { Alert.alert('Erro', 'Falha ao finalizar.'); }
    finally { setSubmitting(false); }
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <View style={styles.root}>
      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{exercise.name}</Text>
          <Text style={styles.headerMuscle}>{exercise.muscleGroup}</Text>
        </View>
        <View style={styles.headerThumb}>
          <Ionicons name="barbell-outline" size={24} color="#888" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Rest Timer ──────────────────────────────────────── */}
        {restActive && (
          <View style={styles.restCard}>
            <Text style={[styles.restTime, restRemaining <= 5 && { color: '#EF4444' }]}>{fmtTime(restRemaining)}</Text>
            <Text style={styles.restLabel}>DESCANSO</Text>
            <TouchableOpacity style={styles.skipBtn} onPress={skipRest}>
              <Text style={styles.skipBtnText}>Pular</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── PR Banner ───────────────────────────────────────── */}
        {showPR && (
          <View style={styles.prBanner}>
            <Text style={styles.prIcon}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.prTitle}>NOVO PR!</Text>
              <Text style={styles.prSub}>Você bateu seu recorde de carga!</Text>
            </View>
            <Text style={styles.prPts}>+50 pts</Text>
          </View>
        )}

        {/* ── Sets ────────────────────────────────────────────── */}
        {exercise.sets.map((set, si) => (
          <SetRow
            key={set.id}
            index={si}
            weight={set.weight}
            reps={set.reps}
            completed={set.completed}
            isCurrent={si === currentSetIdx}
            setType={exercise.setType}
            prevWeight={set.prevWeight}
            prevReps={set.prevReps}
            editable={treinoIniciado && !submitting && !restActive}
            onToggle={() => handleToggle(si)}
            onWeightChange={(v) => updateSerieWeight(currentIdx, si, v)}
            onRepsChange={(v) => updateSerieReps(currentIdx, si, v)}
          />
        ))}

        {/* ── Note ────────────────────────────────────────────── */}
        {!showNote ? (
          <TouchableOpacity onPress={() => setShowNote(true)} style={styles.noteToggle}>
            <Text style={styles.noteToggleText}>📝 Adicionar nota...</Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Ex: dor no ombro, subir carga..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={2}
            maxLength={500}
          />
        )}

        {/* ── Exercise Nav ────────────────────────────────────── */}
        <ExerciseNav
          prevName={prevEx?.name}
          nextName={nextEx?.name}
          isLast={isLast}
          onPrev={() => { setCurrentIdx(currentIdx - 1); setShowNote(false); setNote(''); }}
          onNext={() => { setCurrentIdx(currentIdx + 1); setShowNote(false); setNote(''); }}
          onFinish={handleFinish}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Volume Bar + CTA ──────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <View style={styles.volumeRow}>
          <View>
            <Text style={styles.volumeLabel}>VOLUME TOTAL</Text>
            <Text style={styles.volumeValue}>{volumeTotal.toLocaleString('pt-BR')}<Text style={styles.volumeUnit}> kg</Text></Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.ctaBtn,
            allDoneThisEx && styles.ctaBtnDone,
            (restActive || submitting) && styles.ctaBtnDisabled,
          ]}
          onPress={() => {
            if (allDoneThisEx) {
              if (isLast) handleFinish();
              else { setCurrentIdx(currentIdx + 1); setShowNote(false); setNote(''); }
            } else if (currentSetIdx >= 0) {
              handleToggle(currentSetIdx);
            }
          }}
          disabled={restActive || submitting}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaBtnText}>
            {allDoneThisEx
              ? (isLast ? '✓ Finalizar Treino' : '✓ Próximo Exercício →')
              : `Concluir Série ${completedSets.length + 1}/${exercise.sets.length}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: fonts.numbersBold, color: '#FFF' },
  headerMuscle: { fontSize: 12, fontFamily: fonts.bodyBold, color: '#F26522', marginTop: 2 },
  headerThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },

  content: { paddingTop: 12 },

  // Rest timer
  restCard: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 14, marginHorizontal: 16, marginBottom: 12, padding: 20, alignItems: 'center' },
  restTime: { fontSize: 26, fontFamily: fonts.numbersBold, color: '#FFF' },
  restLabel: { fontSize: 11, fontFamily: fonts.bodyBold, color: '#888', textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 },
  skipBtn: { marginTop: 10, borderWidth: 1, borderColor: '#888', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 20 },
  skipBtnText: { color: '#888', fontSize: 12, fontFamily: fonts.bodyMedium },

  // PR Banner
  prBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12, padding: 12,
    borderRadius: 12, borderWidth: 1, borderColor: '#F2652255',
    backgroundColor: '#F2652210',
  },
  prIcon: { fontSize: 24 },
  prTitle: { fontSize: 13, fontFamily: fonts.numbersBold, color: '#F26522' },
  prSub: { fontSize: 11, fontFamily: fonts.body, color: '#888' },
  prPts: { fontSize: 14, fontFamily: fonts.numbersBold, color: '#F26522' },

  // Note
  noteToggle: { paddingHorizontal: 20, paddingVertical: 8 },
  noteToggleText: { fontSize: 12, fontFamily: fonts.body, color: '#888' },
  noteInput: {
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: 12,
    marginHorizontal: 16, marginBottom: 8, padding: 12,
    color: '#FFF', fontSize: 13, fontFamily: fonts.body,
    minHeight: 50, textAlignVertical: 'top',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: '#2A2A2A',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28,
  },
  volumeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  volumeLabel: { fontSize: 10, fontFamily: fonts.bodyBold, color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  volumeValue: { fontSize: 18, fontFamily: fonts.numbersBold, color: '#F26522' },
  volumeUnit: { fontSize: 11, color: '#888' },

  ctaBtn: { backgroundColor: '#F26522', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaBtnDone: { backgroundColor: '#22C55E' },
  ctaBtnDisabled: { backgroundColor: '#2A2A2A' },
  ctaBtnText: { color: '#FFF', fontSize: 16, fontFamily: fonts.numbersBold },
});
