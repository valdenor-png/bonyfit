import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { salvarPlano } from '../../services/personal';
import { useAuth } from '../../hooks/useAuth';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SplitExercise {
  exercise_id: string;
  name: string;
  muscle_group: string;
  series: number;
  repeticoes: string;
  descanso_seg: number;
}

interface SplitDraft {
  label: string;
  nome: string;
  ordem: number;
  exercises: SplitExercise[];
}

type Step = 'info' | 'build' | 'review';

const OBJECTIVES = ['Hipertrofia', 'Força', 'Emagrecimento', 'Resistência', 'Funcional'];

const SPLIT_LABELS = ['A', 'B', 'C', 'D', 'E'];

const DEFAULT_SPLIT_NAMES: Record<number, string[]> = {
  1: ['Full Body'],
  2: ['Superior', 'Inferior'],
  3: ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas'],
  4: ['Peito', 'Costas', 'Pernas', 'Ombro e Braços'],
  5: ['Peito', 'Costas', 'Quadríceps', 'Posterior e Glúteo', 'Ombro e Braços'],
};

const MOCK_EXERCISES: Record<string, SplitExercise[]> = {
  'Peito e Tríceps': [
    { exercise_id: 'mock1', name: 'Supino Reto', muscle_group: 'Peito', series: 4, repeticoes: '8-12', descanso_seg: 90 },
    { exercise_id: 'mock2', name: 'Tríceps Corda', muscle_group: 'Tríceps', series: 3, repeticoes: '12', descanso_seg: 60 },
  ],
  'Costas e Bíceps': [
    { exercise_id: 'mock3', name: 'Puxada Frontal', muscle_group: 'Costas', series: 4, repeticoes: '10-12', descanso_seg: 90 },
    { exercise_id: 'mock4', name: 'Rosca Direta', muscle_group: 'Bíceps', series: 3, repeticoes: '12', descanso_seg: 60 },
  ],
  'Pernas': [
    { exercise_id: 'mock5', name: 'Agachamento Livre', muscle_group: 'Quadríceps', series: 4, repeticoes: '8-10', descanso_seg: 120 },
    { exercise_id: 'mock6', name: 'Leg Press', muscle_group: 'Quadríceps', series: 3, repeticoes: '12-15', descanso_seg: 90 },
  ],
};

const DESCANSO_OPTIONS = [60, 90, 120];

// ─── Component ──────────────────────────────────────────────────────────────────

export default function MontarTreinoScreen({ route, navigation }: { route: any; navigation: any }) {
  const { alunoId, alunoNome } = route.params;
  const { user } = useAuth();

  // Step control
  const [step, setStep] = useState<Step>('info');

  // Step 1 state
  const [planName, setPlanName] = useState(`Treino Hipertrofia — ${alunoNome}`);
  const [objective, setObjective] = useState('Hipertrofia');
  const [numSplits, setNumSplits] = useState(3);

  // Step 2 state
  const [splits, setSplits] = useState<SplitDraft[]>([]);
  const [activeSplitIndex, setActiveSplitIndex] = useState(0);

  // Step 3 state
  const [saving, setSaving] = useState(false);

  // ─── Step transitions ─────────────────────────────────────────

  function goToStep2() {
    if (!planName.trim()) {
      Alert.alert('Atenção', 'Informe o nome do plano.');
      return;
    }

    const names = DEFAULT_SPLIT_NAMES[numSplits] || DEFAULT_SPLIT_NAMES[3]!;
    const newSplits: SplitDraft[] = names.map((name, i) => ({
      label: SPLIT_LABELS[i],
      nome: name,
      ordem: i,
      exercises: MOCK_EXERCISES[name] || [
        { exercise_id: `default_${i}_0`, name: 'Exercício 1', muscle_group: 'Geral', series: 3, repeticoes: '12', descanso_seg: 90 },
        { exercise_id: `default_${i}_1`, name: 'Exercício 2', muscle_group: 'Geral', series: 3, repeticoes: '12', descanso_seg: 60 },
      ],
    }));
    setSplits(newSplits);
    setActiveSplitIndex(0);
    setStep('build');
  }

  function goToReview() {
    // Validate all splits have at least 1 exercise
    const empty = splits.find((s) => s.exercises.length === 0);
    if (empty) {
      Alert.alert('Atenção', `O split ${empty.label} não tem exercícios.`);
      return;
    }
    setStep('review');
  }

  // ─── Exercise manipulation ────────────────────────────────────

  function updateSplitName(idx: number, nome: string) {
    setSplits((prev) => prev.map((s, i) => (i === idx ? { ...s, nome } : s)));
  }

  function updateExercise(splitIdx: number, exIdx: number, field: string, value: any) {
    setSplits((prev) =>
      prev.map((s, si) => {
        if (si !== splitIdx) return s;
        return {
          ...s,
          exercises: s.exercises.map((ex, ei) =>
            ei !== exIdx ? ex : { ...ex, [field]: value },
          ),
        };
      }),
    );
  }

  function removeExercise(splitIdx: number, exIdx: number) {
    setSplits((prev) =>
      prev.map((s, si) => {
        if (si !== splitIdx) return s;
        return { ...s, exercises: s.exercises.filter((_, ei) => ei !== exIdx) };
      }),
    );
  }

  function addExercise(splitIdx: number) {
    Alert.alert(
      'Adicionar Exercício',
      'Selecione um exercício para adicionar ao split.',
      [
        {
          text: 'Supino Inclinado',
          onPress: () => {
            setSplits((prev) =>
              prev.map((s, si) => {
                if (si !== splitIdx) return s;
                return {
                  ...s,
                  exercises: [
                    ...s.exercises,
                    {
                      exercise_id: `new_${Date.now()}`,
                      name: 'Supino Inclinado',
                      muscle_group: 'Peito',
                      series: 3,
                      repeticoes: '12',
                      descanso_seg: 90,
                    },
                  ],
                };
              }),
            );
          },
        },
        {
          text: 'Puxada Supinada',
          onPress: () => {
            setSplits((prev) =>
              prev.map((s, si) => {
                if (si !== splitIdx) return s;
                return {
                  ...s,
                  exercises: [
                    ...s.exercises,
                    {
                      exercise_id: `new_${Date.now()}`,
                      name: 'Puxada Supinada',
                      muscle_group: 'Costas',
                      series: 3,
                      repeticoes: '10-12',
                      descanso_seg: 90,
                    },
                  ],
                };
              }),
            );
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }

  // ─── Save ─────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const plan = {
        aluno_id: alunoId,
        personal_id: user?.id,
        nome: planName,
        objetivo: objective,
        data_inicio: new Date().toISOString().split('T')[0],
        status: 'ativo',
      };
      await salvarPlano(plan, splits);
      Alert.alert('Sucesso', 'Treino atribuído com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar o plano.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Step 1: Info ─────────────────────────────────────────────

  if (step === 'info') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.stepTitle}>1. Informações do Plano</Text>
        <Text style={styles.stepSubtitle}>Aluno: {alunoNome}</Text>

        {/* Plan name */}
        <Text style={styles.label}>Nome do plano</Text>
        <TextInput
          style={styles.input}
          value={planName}
          onChangeText={setPlanName}
          placeholderTextColor={colors.textMuted}
          placeholder="Ex: Treino Hipertrofia"
        />

        {/* Objective */}
        <Text style={styles.label}>Objetivo</Text>
        <View style={styles.chipRow}>
          {OBJECTIVES.map((obj) => (
            <TouchableOpacity
              key={obj}
              style={[styles.chip, objective === obj && styles.chipActive]}
              onPress={() => setObjective(obj)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, objective === obj && styles.chipTextActive]}>
                {obj}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Number of splits */}
        <Text style={styles.label}>Quantidade de splits</Text>
        <View style={styles.splitSelector}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.splitNum, numSplits === n && styles.splitNumActive]}
              onPress={() => setNumSplits(n)}
              activeOpacity={0.7}
            >
              <Text style={[styles.splitNumText, numSplits === n && styles.splitNumTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={goToStep2} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Próximo</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── Step 2: Build splits ─────────────────────────────────────

  if (step === 'build') {
    const currentSplit = splits[activeSplitIndex];

    return (
      <View style={styles.container}>
        {/* Split tabs */}
        <View style={styles.tabRow}>
          {splits.map((s, i) => (
            <TouchableOpacity
              key={s.label}
              style={[styles.tab, activeSplitIndex === i && styles.tabActive]}
              onPress={() => setActiveSplitIndex(i)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeSplitIndex === i && styles.tabTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Split name */}
          <Text style={styles.label}>Nome do split</Text>
          <TextInput
            style={styles.input}
            value={currentSplit.nome}
            onChangeText={(val) => updateSplitName(activeSplitIndex, val)}
            placeholderTextColor={colors.textMuted}
          />

          {/* Exercises */}
          <Text style={styles.label}>Exercícios</Text>
          {currentSplit.exercises.map((ex, exIdx) => (
            <View key={`${ex.exercise_id}_${exIdx}`} style={styles.exerciseCard}>
              <View style={styles.exHeader}>
                <View style={styles.exInfo}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exMuscle}>{ex.muscle_group}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeExercise(activeSplitIndex, exIdx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.removeBtn}>🗑</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.exFields}>
                {/* Series */}
                <View style={styles.exField}>
                  <Text style={styles.exFieldLabel}>Séries</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() =>
                        updateExercise(activeSplitIndex, exIdx, 'series', Math.max(1, ex.series - 1))
                      }
                    >
                      <Text style={styles.counterBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{ex.series}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      onPress={() =>
                        updateExercise(activeSplitIndex, exIdx, 'series', ex.series + 1)
                      }
                    >
                      <Text style={styles.counterBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reps */}
                <View style={styles.exField}>
                  <Text style={styles.exFieldLabel}>Reps</Text>
                  <TextInput
                    style={styles.exInput}
                    value={ex.repeticoes}
                    onChangeText={(val) =>
                      updateExercise(activeSplitIndex, exIdx, 'repeticoes', val)
                    }
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>

                {/* Descanso */}
                <View style={styles.exField}>
                  <Text style={styles.exFieldLabel}>Desc.</Text>
                  <View style={styles.descansoRow}>
                    {DESCANSO_OPTIONS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.descansoBtn,
                          ex.descanso_seg === d && styles.descansoBtnActive,
                        ]}
                        onPress={() =>
                          updateExercise(activeSplitIndex, exIdx, 'descanso_seg', d)
                        }
                      >
                        <Text
                          style={[
                            styles.descansoBtnText,
                            ex.descanso_seg === d && styles.descansoBtnTextActive,
                          ]}
                        >
                          {d}s
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Add exercise */}
          <TouchableOpacity
            style={styles.addExButton}
            onPress={() => addExercise(activeSplitIndex)}
            activeOpacity={0.7}
          >
            <Text style={styles.addExText}>+ Adicionar Exercício</Text>
          </TouchableOpacity>

          {/* Navigation */}
          <View style={styles.buildActions}>
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={() => setStep('info')}
              activeOpacity={0.7}
            >
              <Text style={styles.backStepText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={goToReview} activeOpacity={0.8}>
              <Text style={styles.nextButtonText}>Revisar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Step 3: Review ───────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.stepTitle}>Revisão do Plano</Text>
      <Text style={styles.stepSubtitle}>Aluno: {alunoNome}</Text>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>Plano</Text>
        <Text style={styles.reviewValue}>{planName}</Text>
      </View>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>Objetivo</Text>
        <Text style={styles.reviewValue}>{objective}</Text>
      </View>

      {splits.map((s) => (
        <View key={s.label} style={styles.reviewSplit}>
          <View style={styles.reviewSplitHeader}>
            <View style={styles.reviewSplitBadge}>
              <Text style={styles.reviewSplitBadgeText}>{s.label}</Text>
            </View>
            <Text style={styles.reviewSplitName}>{s.nome}</Text>
            <Text style={styles.reviewSplitCount}>{s.exercises.length} exercícios</Text>
          </View>
          {s.exercises.map((ex, i) => (
            <Text key={`${ex.exercise_id}_${i}`} style={styles.reviewExName}>
              {ex.name} — {ex.series}x{ex.repeticoes}
            </Text>
          ))}
        </View>
      ))}

      <View style={styles.buildActions}>
        <TouchableOpacity
          style={styles.backStepButton}
          onPress={() => setStep('build')}
          activeOpacity={0.7}
        >
          <Text style={styles.backStepText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Salvando...' : 'Atribuir ao Aluno'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },

  // Step info
  stepTitle: {
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },

  // Labels & inputs
  label: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#333333',
  },
  chipActive: {
    backgroundColor: colors.orange + '26',
    borderColor: colors.orange,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.orange,
  },

  // Split selector
  splitSelector: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  splitNum: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitNumActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  splitNumText: {
    fontSize: 18,
    fontFamily: fonts.numbersBold,
    color: colors.textSecondary,
  },
  splitNumTextActive: {
    color: colors.text,
  },

  // Navigation buttons
  nextButton: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xxl,
    flex: 1,
  },
  nextButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },

  // Tab row
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.orange,
  },
  tabText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text,
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  exHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  exInfo: {
    flex: 1,
  },
  exName: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  exMuscle: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  removeBtn: {
    fontSize: 16,
    padding: 4,
  },

  // Exercise fields
  exFields: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  exField: {
    flex: 1,
  },
  exFieldLabel: {
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  counterValue: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  exInput: {
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    fontFamily: fonts.numbers,
    color: colors.text,
    textAlign: 'center',
  },
  descansoRow: {
    flexDirection: 'row',
    gap: 4,
  },
  descansoBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.elevated,
  },
  descansoBtnActive: {
    backgroundColor: colors.orange,
  },
  descansoBtnText: {
    fontSize: 11,
    fontFamily: fonts.numbersBold,
    color: colors.textMuted,
  },
  descansoBtnTextActive: {
    color: colors.text,
  },

  // Add exercise
  addExButton: {
    borderWidth: 1,
    borderColor: '#333333',
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  addExText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },

  // Build actions
  buildActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  backStepButton: {
    flex: 0.4,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backStepText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },

  // Review
  reviewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewLabel: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  reviewValue: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },

  reviewSplit: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  reviewSplitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  reviewSplitBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  reviewSplitBadgeText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  reviewSplitName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  reviewSplitCount: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  reviewExName: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    paddingLeft: 36,
    paddingVertical: 2,
  },

  // Save
  saveButton: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
});
