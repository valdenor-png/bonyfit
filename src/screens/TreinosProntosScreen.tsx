import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProgramExercise {
  name: string;
  sets: number;
  reps: number;
  muscle_group: string;
  equipment: string;
}

interface Program {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradientColors: [string, string];
  exercises: ProgramExercise[];
  durationMin: number;
}

const PROGRAMS: Program[] = [
  {
    id: 'hipertrofia',
    icon: '\uD83D\uDCAA',
    title: 'Hipertrofia',
    description: 'Foco em ganho de massa muscular',
    gradientColors: ['#F26522', '#D4520F'],
    durationMin: 55,
    exercises: [
      { name: 'Supino Reto', sets: 4, reps: 10, muscle_group: 'Peito', equipment: 'Barra' },
      { name: 'Remada Curvada', sets: 4, reps: 10, muscle_group: 'Costas', equipment: 'Barra' },
      { name: 'Agachamento Livre', sets: 4, reps: 8, muscle_group: 'Pernas', equipment: 'Barra' },
      { name: 'Desenvolvimento', sets: 3, reps: 10, muscle_group: 'Ombro', equipment: 'Halter' },
      { name: 'Rosca Direta', sets: 3, reps: 12, muscle_group: 'Bíceps', equipment: 'Barra' },
      { name: 'Tríceps Pulley', sets: 3, reps: 12, muscle_group: 'Tríceps', equipment: 'Cabo' },
    ],
  },
  {
    id: 'emagrecimento',
    icon: '\uD83D\uDD25',
    title: 'Emagrecimento',
    description: 'Treinos para queimar gordura',
    gradientColors: ['#E74C3C', '#C0392B'],
    durationMin: 40,
    exercises: [
      { name: 'Burpee', sets: 4, reps: 12, muscle_group: 'Full body', equipment: 'Peso corporal' },
      { name: 'Agachamento com Salto', sets: 3, reps: 15, muscle_group: 'Pernas', equipment: 'Peso corporal' },
      { name: 'Mountain Climber', sets: 3, reps: 20, muscle_group: 'Core', equipment: 'Peso corporal' },
      { name: 'Remada Alta', sets: 3, reps: 12, muscle_group: 'Costas', equipment: 'Halter' },
      { name: 'Swing com Kettlebell', sets: 4, reps: 15, muscle_group: 'Posterior', equipment: 'Kettlebell' },
    ],
  },
  {
    id: 'resistencia',
    icon: '\u26A1',
    title: 'Resistência',
    description: 'Melhore seu condicionamento',
    gradientColors: ['#3B82F6', '#2563EB'],
    durationMin: 45,
    exercises: [
      { name: 'Circuito de Flexões', sets: 3, reps: 20, muscle_group: 'Peito', equipment: 'Peso corporal' },
      { name: 'Agachamento Isométrico', sets: 3, reps: 30, muscle_group: 'Pernas', equipment: 'Peso corporal' },
      { name: 'Prancha', sets: 3, reps: 45, muscle_group: 'Core', equipment: 'Peso corporal' },
      { name: 'Remada Unilateral', sets: 3, reps: 15, muscle_group: 'Costas', equipment: 'Halter' },
      { name: 'Pular Corda', sets: 4, reps: 60, muscle_group: 'Full body', equipment: 'Corda' },
      { name: 'Abdominal Bicicleta', sets: 3, reps: 20, muscle_group: 'Core', equipment: 'Peso corporal' },
    ],
  },
  {
    id: 'funcional',
    icon: '\uD83C\uDFCB\uFE0F',
    title: 'Funcional',
    description: 'Exercícios funcionais e mobilidade',
    gradientColors: ['#2ECC71', '#27AE60'],
    durationMin: 35,
    exercises: [
      { name: 'Turkish Get Up', sets: 3, reps: 5, muscle_group: 'Full body', equipment: 'Kettlebell' },
      { name: 'Deadlift Romeno', sets: 3, reps: 10, muscle_group: 'Posterior', equipment: 'Halter' },
      { name: 'Lunge com Rotação', sets: 3, reps: 12, muscle_group: 'Pernas', equipment: 'Peso corporal' },
      { name: 'Push Press', sets: 3, reps: 10, muscle_group: 'Ombro', equipment: 'Halter' },
      { name: 'Farmer Walk', sets: 3, reps: 30, muscle_group: 'Full body', equipment: 'Halter' },
    ],
  },
];

export default function TreinosProntosScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Treinos Prontos</Text>
        <Text style={styles.headerSub}>Escolha um programa e comece agora</Text>

        {PROGRAMS.map((program) => {
          const isExpanded = expandedId === program.id;
          return (
            <View key={program.id} style={styles.cardWrapper}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggleExpand(program.id)}
              >
                <LinearGradient
                  colors={program.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <Text style={styles.cardIcon}>{program.icon}</Text>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{program.title}</Text>
                    <Text style={styles.cardDesc}>{program.description}</Text>
                    <Text style={styles.cardMeta}>
                      {program.exercises.length} exercícios •{program.durationMin} min
                    </Text>
                  </View>
                  <Text style={styles.expandArrow}>{isExpanded ? '▲' : '▼'}</Text>
                </LinearGradient>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.exerciseList}>
                  {program.exercises.map((ex, i) => (
                    <View key={i} style={styles.exerciseRow}>
                      <View style={styles.exerciseIndex}>
                        <Text style={styles.exerciseIndexText}>{i + 1}</Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        <Text style={styles.exerciseDetail}>
                          {ex.muscle_group} •{ex.equipment}
                        </Text>
                      </View>
                      <Text style={styles.exerciseSets}>
                        {ex.sets}x{ex.reps}
                      </Text>
                    </View>
                  ))}

                  <TouchableOpacity style={styles.useBtn} onPress={() => Alert.alert('Treino copiado!', 'Este treino foi adicionado às suas rotinas.')}>
                    <Text style={styles.useBtnText}>Usar este treino</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 40,
  },
  header: {
    fontSize: 24,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginTop: spacing.xl,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing.xs,
  },
  cardMeta: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: 'rgba(255,255,255,0.7)',
  },
  expandArrow: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  exerciseList: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    marginTop: -radius.xl,
    paddingTop: radius.xl + spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.elevated,
    gap: spacing.md,
  },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIndexText: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.textSecondary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: 2,
  },
  exerciseDetail: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  exerciseSets: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
  useBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  useBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
});
