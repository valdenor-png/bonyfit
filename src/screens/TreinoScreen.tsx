import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';
import Skull from '../components/Skull';
import ProgressRing from '../components/ProgressRing';
import ExerciseCard from '../components/ExerciseCard';
import SetRow from '../components/SetRow';
import RestTimer from '../components/RestTimer';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import { Exercise, ExerciseProgress, ExerciseStatus, SetStatus } from '../types/workout';

// --- MOCK DATA ---
const MOCK_EXERCISES: Exercise[] = [
  { id: '1', name: 'Supino Reto', muscle_group: 'Peito', equipment: 'Barra', video_url: null, tips: 'Mantenha os cotovelos a 45° do tronco. Desça a barra até tocar o peito.', min_time_seconds: 180, sets: 4, reps: 12, weight: 60, rest_seconds: 90 },
  { id: '2', name: 'Supino Inclinado', muscle_group: 'Peito', equipment: 'Halter', video_url: null, tips: 'Inclinação de 30-45°. Foco no peitoral superior.', min_time_seconds: 180, sets: 3, reps: 12, weight: 24, rest_seconds: 90 },
  { id: '3', name: 'Crucifixo', muscle_group: 'Peito', equipment: 'Halter', video_url: null, tips: 'Mantenha leve flexão nos cotovelos durante todo o movimento.', min_time_seconds: 150, sets: 3, reps: 15, weight: 16, rest_seconds: 60 },
  { id: '4', name: 'Tríceps Pulley', muscle_group: 'Tríceps', equipment: 'Cabo', video_url: null, tips: 'Cotovelos fixos ao lado do corpo. Extensão completa.', min_time_seconds: 120, sets: 3, reps: 15, weight: 30, rest_seconds: 60 },
  { id: '5', name: 'Tríceps Francês', muscle_group: 'Tríceps', equipment: 'Halter', video_url: null, tips: 'Desça o peso atrás da cabeça com controle.', min_time_seconds: 120, sets: 3, reps: 12, weight: 14, rest_seconds: 60 },
  { id: '6', name: 'Desenvolvimento', muscle_group: 'Ombro', equipment: 'Halter', video_url: null, tips: 'Não trave os cotovelos no topo. Controle a descida.', min_time_seconds: 150, sets: 4, reps: 10, weight: 20, rest_seconds: 90 },
];

type WorkoutView = 'blocked' | 'exercises' | 'exercise_detail' | 'rest' | 'complete';

export default function TreinoScreen() {
  // Anti-fraud: catraca validation
  const [catracaValidated, setCatracaValidated] = useState(false);
  const [view, setView] = useState<WorkoutView>('blocked');
  const [workoutStarted, setWorkoutStarted] = useState(false);

  // Workout state
  const [exercises, setExercises] = useState<ExerciseProgress[]>(() =>
    MOCK_EXERCISES.map((ex) => ({
      exercise: ex,
      status: 'pending' as ExerciseStatus,
      setsCompleted: 0,
      totalSets: ex.sets,
      pointsEarned: 0,
    }))
  );
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Points animation
  const pointsAnim = useRef(new Animated.Value(0)).current;
  const pointsOpacity = useRef(new Animated.Value(0)).current;
  const [lastPointsGained, setLastPointsGained] = useState(0);

  const animatePoints = useCallback((pts: number) => {
    setLastPointsGained(pts);
    pointsAnim.setValue(0);
    pointsOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(pointsAnim, { toValue: -30, duration: 1200, useNativeDriver: true }),
      Animated.timing(pointsOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]).start();
  }, [pointsAnim, pointsOpacity]);

  // Elapsed timer
  useEffect(() => {
    if (workoutStarted && view !== 'complete') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [workoutStarted, view]);

  // Simulate catraca validation
  const simulateCatraca = () => {
    setCatracaValidated(true);
    setView('exercises');
    setWorkoutStarted(true);
    setSessionPoints(100); // check-in points
    animatePoints(100);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Calculate totals
  const totalSets = exercises.reduce((a, e) => a + e.totalSets, 0);
  const completedSets = exercises.reduce((a, e) => a + e.setsCompleted, 0);
  const completedExercises = exercises.filter((e) => e.status === 'completed').length;
  const skippedExercises = exercises.filter((e) => e.status === 'skipped').length;
  const allCompleted = exercises.every((e) => e.status === 'completed');
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  const currentEx = exercises[currentExIdx];
  const currentExercise = currentEx?.exercise;

  // --- HANDLERS ---
  const handleConfirmSet = () => {
    const updated = [...exercises];
    const ex = updated[currentExIdx];
    ex.setsCompleted += 1;
    ex.pointsEarned += 15;
    setSessionPoints((p) => p + 15);
    animatePoints(15);

    if (ex.setsCompleted >= ex.totalSets) {
      ex.status = 'completed';
      ex.pointsEarned += 50;
      setSessionPoints((p) => p + 50);
      animatePoints(50);

      // Check if all done
      const nextPending = updated.findIndex((e, i) => i > currentExIdx && e.status === 'pending');
      if (nextPending >= 0) {
        updated[nextPending].status = 'in_progress';
        setCurrentExIdx(nextPending);
        setCurrentSetIdx(0);
        setExercises(updated);
        setView('exercises');
      } else if (updated.every((e) => e.status === 'completed' || e.status === 'skipped')) {
        if (updated.every((e) => e.status === 'completed')) {
          setSessionPoints((p) => p + 200);
          animatePoints(200);
        }
        setExercises(updated);
        setView('complete');
      } else {
        setExercises(updated);
        setView('exercises');
      }
    } else {
      setCurrentSetIdx(ex.setsCompleted);
      setExercises(updated);
      // Start rest
      setView('rest');
    }
  };

  const handleSkipExercise = () => {
    const updated = [...exercises];
    updated[currentExIdx].status = 'skipped';
    const nextPending = updated.findIndex((e, i) => i > currentExIdx && e.status === 'pending');
    if (nextPending >= 0) {
      updated[nextPending].status = 'in_progress';
      setCurrentExIdx(nextPending);
      setCurrentSetIdx(0);
    }
    setExercises(updated);
    setView('exercises');
  };

  const handleSelectExercise = (idx: number) => {
    const ex = exercises[idx];
    if (ex.status === 'completed') return;
    const updated = [...exercises];
    // Set previous current to pending if needed
    if (updated[currentExIdx].status === 'in_progress') {
      updated[currentExIdx].status = 'pending';
    }
    updated[idx].status = 'in_progress';
    setCurrentExIdx(idx);
    setCurrentSetIdx(updated[idx].setsCompleted);
    setExercises(updated);
    setView('exercise_detail');
  };

  const handleRestComplete = () => {
    setView('exercise_detail');
  };

  const handleEndWorkout = () => {
    setShowEndModal(false);
    setView('complete');
  };

  const handleGoToSkipped = () => {
    const skippedIdx = exercises.findIndex((e) => e.status === 'skipped');
    if (skippedIdx >= 0) {
      const updated = [...exercises];
      updated[skippedIdx].status = 'in_progress';
      setCurrentExIdx(skippedIdx);
      setCurrentSetIdx(updated[skippedIdx].setsCompleted);
      setExercises(updated);
      setView('exercise_detail');
    }
  };

  // --- BLOCKED VIEW ---
  if (view === 'blocked') {
    return (
      <View style={styles.blockedContainer}>
        <Skull size={60} color={colors.orange} opacity={0.3} />
        <Text style={styles.blockedTitle}>Passe na catraca para começar</Text>
        <Text style={styles.blockedSub}>
          Seu treino será liberado automaticamente após a validação facial
        </Text>
        {/* Dev button for testing */}
        <TouchableOpacity style={styles.devBtn} onPress={simulateCatraca}>
          <Text style={styles.devBtnText}>Simular entrada na catraca</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- COMPLETE VIEW ---
  if (view === 'complete') {
    const setsPoints = completedSets * 15;
    const exPoints = completedExercises * 50;
    const bonus = allCompleted ? 200 : 0;
    const total = 100 + setsPoints + exPoints + bonus;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.completeContent}>
        <View style={styles.completeHeader}>
          <Skull size={52} color={colors.orange} />
          <Text style={styles.completeTitle}>
            {allCompleted ? 'Treino completo!' : 'Treino encerrado!'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.completeStats}>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{formatTimer(elapsedSeconds)}</Text>
            <Text style={styles.completeStatLabel}>Tempo</Text>
          </View>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{completedExercises}/{exercises.length}</Text>
            <Text style={styles.completeStatLabel}>Feitos</Text>
          </View>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{completedSets}</Text>
            <Text style={styles.completeStatLabel}>Séries</Text>
          </View>
        </View>

        {/* Points breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>✓ Check-in</Text>
            <Text style={styles.breakdownValue}>+100</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>✓ {completedSets} séries (15 pts cada)</Text>
            <Text style={styles.breakdownValue}>+{setsPoints}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>✓ {completedExercises} exercícios (50 pts cada)</Text>
            <Text style={styles.breakdownValue}>+{exPoints}</Text>
          </View>
          {allCompleted && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>🏆 Bônus completo</Text>
              <Text style={styles.breakdownValue}>+200</Text>
            </View>
          )}
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.breakdownTotalLabel}>Total</Text>
            <Text style={styles.breakdownTotalValue}>+{total}</Text>
          </View>
        </View>

        {!allCompleted && skippedExercises > 0 && (
          <View style={styles.skippedWarning}>
            <Text style={styles.skippedWarningText}>
              Pulou {skippedExercises} exercícios. Complete todos pro bônus +200!
            </Text>
          </View>
        )}

        {/* Streak */}
        <View style={styles.streakCard}>
          <Text style={styles.streakText}>🔥 Streak: 15 dias seguidos! (1.5x)</Text>
        </View>

        <Button title="Compartilhar no feed" onPress={() => {}} />
      </ScrollView>
    );
  }

  // --- REST VIEW ---
  if (view === 'rest') {
    const nextSetNum = currentSetIdx + 1;
    return (
      <RestTimer
        totalSeconds={currentExercise?.rest_seconds ?? 60}
        onComplete={handleRestComplete}
        nextExerciseName={currentExercise?.name ?? ''}
        nextSetInfo={`Série ${nextSetNum}/${currentEx?.totalSets} • ${currentExercise?.reps} reps • ${currentExercise?.weight}kg`}
      />
    );
  }

  // --- EXERCISE DETAIL VIEW ---
  if (view === 'exercise_detail' && currentExercise) {
    const sets = Array.from({ length: currentEx.totalSets }, (_, i): SetStatus => {
      if (i < currentEx.setsCompleted) return 'done';
      if (i === currentSetIdx) return 'current';
      return 'pending';
    });

    const isLastSet = currentSetIdx === currentEx.totalSets - 1;
    const btnLabel = isLastSet
      ? `✓ Finalizar ${currentExercise.name}`
      : `✓ Confirmar série ${currentSetIdx + 1}/${currentEx.totalSets}`;

    return (
      <View style={styles.container}>
        <TopBar
          elapsed={elapsedSeconds}
          progress={progress}
          completedSets={completedSets}
          totalSets={totalSets}
          points={sessionPoints}
          lastPointsGained={lastPointsGained}
          pointsAnim={pointsAnim}
          pointsOpacity={pointsOpacity}
        />
        <ScrollView contentContainerStyle={styles.detailContent}>
          {/* Back + Skip */}
          <View style={styles.detailNav}>
            <TouchableOpacity onPress={() => setView('exercises')}>
              <Text style={styles.detailBack}>← Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkipExercise}>
              <Text style={styles.skipText}>⏭ Pular</Text>
            </TouchableOpacity>
          </View>

          {/* Video placeholder */}
          <View style={styles.videoPlaceholder}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.videoGradient}
            >
              <View style={styles.playBtn}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
              <Text style={styles.videoName}>{currentExercise.name}</Text>
            </LinearGradient>
          </View>

          {/* Tip */}
          {currentExercise.tips && (
            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>DICA</Text>
              <Text style={styles.tipText}>{currentExercise.tips}</Text>
            </View>
          )}

          {/* Sets */}
          <View style={styles.setsList}>
            {sets.map((status, i) => (
              <SetRow
                key={i}
                setNumber={i + 1}
                reps={currentExercise.reps}
                weight={currentExercise.weight}
                restSeconds={currentExercise.rest_seconds}
                status={status}
                pointsEarned={status === 'done' ? 15 : 0}
              />
            ))}
          </View>

          {/* Confirm button */}
          <Button title={btnLabel} onPress={handleConfirmSet} />
        </ScrollView>
      </View>
    );
  }

  // --- EXERCISES LIST VIEW ---
  return (
    <View style={styles.container}>
      <TopBar
        elapsed={elapsedSeconds}
        progress={progress}
        completedSets={completedSets}
        totalSets={totalSets}
        points={sessionPoints}
        lastPointsGained={lastPointsGained}
        pointsAnim={pointsAnim}
        pointsOpacity={pointsOpacity}
      />
      <ScrollView contentContainerStyle={styles.listContent}>
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.dayLabel}>SEX — Peito + Tríceps + Ombro</Text>

        {/* Exercise cards */}
        {exercises.map((ex, i) => (
          <ExerciseCard
            key={ex.exercise.id}
            exerciseProgress={ex}
            index={i}
            onPress={() => handleSelectExercise(i)}
          />
        ))}

        {/* Skipped warning */}
        {skippedExercises > 0 && (
          <TouchableOpacity style={styles.skippedCard} onPress={handleGoToSkipped}>
            <Text style={styles.skippedIcon}>⚠️</Text>
            <Text style={styles.skippedText}>
              Você pulou {skippedExercises} exercícios. Toque pra voltar
            </Text>
          </TouchableOpacity>
        )}

        {/* Bonus card */}
        <View style={styles.bonusCard}>
          <Skull size={24} color={colors.orange} opacity={0.6} />
          <Text style={styles.bonusText}>
            Bônus treino completo: +200 pts. Complete todos sem pular
          </Text>
        </View>

        {/* End workout button */}
        {completedSets > 0 && !allCompleted && (
          <TouchableOpacity
            style={styles.endBtn}
            onPress={() => setShowEndModal(true)}
          >
            <Text style={styles.endBtnText}>Encerrar treino como está</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* End modal */}
      <Modal visible={showEndModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Skull size={40} color={colors.orange} />
            <Text style={styles.modalTitle}>Encerrar treino?</Text>
            <Text style={styles.modalSub}>
              {completedExercises} de {exercises.length} exercícios feitos
            </Text>
            <Text style={styles.modalPoints}>
              Você vai ganhar {sessionPoints} pontos (sem bônus)
            </Text>
            <View style={styles.modalButtons}>
              <Button title="Voltar" variant="outline" onPress={() => setShowEndModal(false)} />
              <Button title="Encerrar" onPress={handleEndWorkout} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  // Blocked
  blockedContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  blockedTitle: { fontSize: 20, fontFamily: fonts.bodyBold, color: colors.text, textAlign: 'center' },
  blockedSub: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary, textAlign: 'center' },
  devBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.elevated,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  devBtnText: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.orange },
  // List
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  progressBarContainer: {
    height: 5,
    backgroundColor: colors.elevated,
    borderRadius: 3,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: 3,
  },
  dayLabel: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.textSecondary, marginBottom: spacing.lg },
  skippedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  skippedIcon: { fontSize: 18 },
  skippedText: { flex: 1, fontSize: 13, fontFamily: fonts.body, color: colors.orange },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  bonusText: { flex: 1, fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  endBtn: {
    borderWidth: 1,
    borderColor: colors.elevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  endBtnText: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
  // Detail
  detailContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  detailNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  detailBack: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.orange },
  skipBtn: {
    backgroundColor: 'rgba(242, 101, 34, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(242, 101, 34, 0.2)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.orange },
  videoPlaceholder: {
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.elevated,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  videoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242, 101, 34, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  playIcon: { fontSize: 18, color: colors.text, marginLeft: 3 },
  videoName: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  tipCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipLabel: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.info, marginBottom: spacing.xs },
  tipText: { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary, lineHeight: 18 },
  setsList: { gap: spacing.sm, marginBottom: spacing.xl },
  // Complete
  completeContent: { padding: spacing.xl, paddingBottom: spacing.xxl, alignItems: 'center' },
  completeHeader: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxl },
  completeTitle: { fontSize: 24, fontFamily: fonts.numbersExtraBold, color: colors.text },
  completeStats: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    width: '100%',
  },
  completeStat: { flex: 1, alignItems: 'center' },
  completeStatValue: { fontSize: 20, fontFamily: fonts.numbersBold, color: colors.text, marginBottom: 4 },
  completeStatLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted },
  breakdownCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    marginBottom: spacing.lg,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  breakdownLabel: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary },
  breakdownValue: { fontSize: 14, fontFamily: fonts.numbersBold, color: colors.success },
  breakdownTotal: { borderTopWidth: 1, borderTopColor: colors.orange, marginTop: spacing.sm, paddingTop: spacing.md },
  breakdownTotalLabel: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.text },
  breakdownTotalValue: { fontSize: 18, fontFamily: fonts.numbersBold, color: colors.orange },
  skippedWarning: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
  },
  skippedWarningText: { fontSize: 13, fontFamily: fonts.body, color: colors.orange, textAlign: 'center' },
  streakCard: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
  },
  streakText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.success, textAlign: 'center' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  modalTitle: { fontSize: 20, fontFamily: fonts.bodyBold, color: colors.text },
  modalSub: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary },
  modalPoints: { fontSize: 14, fontFamily: fonts.numbersBold, color: colors.orange },
  modalButtons: { gap: spacing.md, width: '100%', marginTop: spacing.md },
});
