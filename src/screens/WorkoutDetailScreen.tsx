import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const handleStart = () => {
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
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Iniciar Treino</Text>
          </TouchableOpacity>
        ) : (
          <ProgressBar progress={progress} />
        )}

        {/* Hint */}
        <Text style={styles.hint}>
          {treinoIniciado
            ? 'Toque no exercício para ver séries'
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
  hint: { color: '#888', fontSize: 12, fontFamily: fonts.body, textAlign: 'center', marginBottom: 14 },
});
