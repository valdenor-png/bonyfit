import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { colors, fonts, spacing } from '../tokens';
import { useTreinoStore } from '../stores/treinoStore';
import StatusBar from '../components/treino/StatusBar';
import ProgressBar from '../components/treino/ProgressBar';
import ExerciseListItem from '../components/treino/ExerciseListItem';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

export default function WorkoutDetailScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const {
    treinoIniciado, inicioTimestamp, workoutName, exercises,
    iniciarTreino, getSeriesConcluidas, getSeriesTotais, getPontos, getExerciseStatus,
  } = useTreinoStore();

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (!treinoIniciado || !inicioTimestamp) return;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - inicioTimestamp) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [treinoIniciado, inicioTimestamp]);

  const seriesFeitas = getSeriesConcluidas();
  const seriesTotal = getSeriesTotais();
  const pontos = getPontos();
  const progress = seriesTotal > 0 ? seriesFeitas / seriesTotal : 0;
  const minutos = Math.floor(elapsed / 60);

  const [checkinOk, setCheckinOk] = useState<boolean | null>(null);
  const [checkingCheckin, setCheckingCheckin] = useState(false);

  // Check catraca on mount
  useEffect(() => {
    (async () => {
      setCheckingCheckin(true);
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', user?.id)
        .gte('created_at', today)
        .lt('created_at', today + 'T23:59:59Z')
        .maybeSingle();
      setCheckinOk(!!data);
      setCheckingCheckin(false);
    })();
  }, [user?.id]);

  const getDeviceId = () => {
    return Constants.installationId ?? `${Platform.OS}-${Constants.sessionId ?? 'unknown'}`;
  };

  const handleStart = () => {
    if (checkinOk === false) {
      Alert.alert('Sem entrada registrada', 'Passe na catraca da academia antes de iniciar o treino.');
      return;
    }
    iniciarTreino();
  };

  const handleExercisePress = (idx: number) => {
    if (!treinoIniciado) return;
    navigation.navigate('ExerciseSets', { exerciseIdx: idx });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{workoutName || 'Treino'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <StatusBar
          seriesFeitas={seriesFeitas}
          seriesTotal={seriesTotal}
          exercicios={exercises.length}
          minutos={minutos}
          pontos={pontos}
        />

        {/* Iniciar / Progresso */}
        {!treinoIniciado ? (
          <>
            {checkinOk === false && (
              <View style={styles.blockedBox}>
                <Ionicons name="lock-closed" size={18} color="#F26522" />
                <Text style={styles.blockedText}>Passe na catraca da academia para liberar o treino</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.startBtn, checkinOk === false && styles.startBtnDisabled]}
              onPress={handleStart}
              activeOpacity={0.8}
              disabled={checkingCheckin || checkinOk === false}
            >
              <Text style={styles.startBtnText}>
                {checkingCheckin ? 'Verificando...' : checkinOk === false ? 'Catraca não registrada' : 'Iniciar Treino'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <ProgressBar progress={progress} />
        )}

        {/* Hint */}
        <Text style={styles.hint}>
          {treinoIniciado
            ? 'Toque no exercício para ver séries'
            : checkinOk === false
              ? 'Registre sua entrada na academia primeiro'
              : 'Inicie o treino para registrar séries'}
        </Text>

        {/* Exercise list */}
        {exercises.map((ex, idx) => (
          <ExerciseListItem
            key={ex.id}
            name={ex.name}
            muscleGroup={ex.muscleGroup}
            setType={ex.setType}
            setsInfo={`${ex.sets.length} séries · ${ex.sets[0]?.reps ?? 0} reps`}
            status={getExerciseStatus(idx)}
            disabled={!treinoIniciado}
            onPress={() => handleExercisePress(idx)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text, flex: 1, textAlign: 'center' },
  content: { paddingTop: 8 },
  startBtn: {
    backgroundColor: colors.orange,
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  startBtnText: { color: '#FFF', fontSize: 15, fontFamily: fonts.bodyBold },
  startBtnDisabled: { backgroundColor: '#333' },
  blockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(242,101,34,0.1)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(242,101,34,0.3)',
  },
  blockedText: { color: '#F26522', fontSize: 13, fontFamily: fonts.bodyMedium, flex: 1 },
  hint: { color: '#888', fontSize: 12, fontFamily: fonts.body, textAlign: 'center', marginBottom: 14 },
});
