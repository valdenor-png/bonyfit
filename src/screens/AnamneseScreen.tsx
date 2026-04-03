import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

interface Props {
  navigation: any;
}

const GOALS = [
  'Hipertrofia',
  'Emagrecimento',
  'Condicionamento',
  'Saude',
  'Flexibilidade',
  'Reabilitacao',
];

const LIMITATIONS = [
  'Problema cardiaco',
  'Problema articular',
  'Asma',
  'Diabetes',
  'Hipertensao',
  'Nenhuma',
];

export default function AnamneseScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);

  // Step 1 - Historico
  const [practicesActivity, setPracticesActivity] = useState<boolean | null>(null);
  const [hasInjuries, setHasInjuries] = useState<boolean | null>(null);
  const [medicalFollowup, setMedicalFollowup] = useState<boolean | null>(null);
  const [takesMedications, setTakesMedications] = useState<boolean | null>(null);
  const [recentSurgeries, setRecentSurgeries] = useState<boolean | null>(null);

  // Step 2 - Objetivos
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // Step 3 - Limitacoes
  const [selectedLimitations, setSelectedLimitations] = useState<string[]>([]);
  const [observations, setObservations] = useState('');

  const totalSteps = 3;
  const progress = (step + 1) / totalSteps;

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const toggleLimitation = (limitation: string) => {
    if (limitation === 'Nenhuma') {
      setSelectedLimitations((prev) =>
        prev.includes('Nenhuma') ? [] : ['Nenhuma']
      );
      return;
    }
    setSelectedLimitations((prev) => {
      const without = prev.filter((l) => l !== 'Nenhuma');
      return without.includes(limitation)
        ? without.filter((l) => l !== limitation)
        : [...without, limitation];
    });
  };

  const handleSave = () => {
    // Save anamnese data
    navigation.goBack();
  };

  const renderRadio = (
    label: string,
    value: boolean | null,
    onChange: (v: boolean) => void
  ) => (
    <View style={styles.questionCard}>
      <Text style={styles.questionLabel}>{label}</Text>
      <View style={styles.radioRow}>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => onChange(true)}
        >
          <View style={[styles.radioOuter, value === true && styles.radioOuterActive]}>
            {value === true && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioText}>Sim</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => onChange(false)}
        >
          <View style={[styles.radioOuter, value === false && styles.radioOuterActive]}>
            {value === false && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioText}>Nao</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCheckbox = (
    label: string,
    checked: boolean,
    onToggle: () => void
  ) => (
    <TouchableOpacity style={styles.checkboxRow} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View>
            <Text style={styles.stepTitle}>Historico</Text>
            {renderRadio('Pratica atividade fisica?', practicesActivity, setPracticesActivity)}
            {renderRadio('Tem lesoes?', hasInjuries, setHasInjuries)}
            {renderRadio('Faz acompanhamento medico?', medicalFollowup, setMedicalFollowup)}
            {renderRadio('Toma medicamentos?', takesMedications, setTakesMedications)}
            {renderRadio('Cirurgias recentes?', recentSurgeries, setRecentSurgeries)}
          </View>
        );
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Objetivos</Text>
            <View style={styles.questionCard}>
              <Text style={styles.questionLabel}>Selecione seus objetivos:</Text>
              {GOALS.map((goal) =>
                renderCheckbox(goal, selectedGoals.includes(goal), () =>
                  toggleGoal(goal)
                )
              )}
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Limitacoes</Text>
            <View style={styles.questionCard}>
              <Text style={styles.questionLabel}>
                Possui alguma limitacao?
              </Text>
              {LIMITATIONS.map((lim) =>
                renderCheckbox(
                  lim,
                  selectedLimitations.includes(lim),
                  () => toggleLimitation(lim)
                )
              )}
            </View>
            <View style={styles.questionCard}>
              <Text style={styles.questionLabel}>Observacoes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Descreva observacoes adicionais..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={observations}
                onChangeText={setObservations}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Anamnese</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.stepIndicator}>
        Etapa {step + 1} de {totalSteps}
      </Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderStep()}
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.secondaryButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
        {step < totalSteps - 1 ? (
          <TouchableOpacity
            style={[styles.primaryButton, step === 0 && { flex: 1 }]}
            onPress={() => setStep(step + 1)}
          >
            <Text style={styles.primaryButtonText}>Proximo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>Salvar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  backButton: {
    color: colors.orange,
    fontSize: 24,
    fontFamily: fonts.bodyBold,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bodyBold,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.elevated,
    marginHorizontal: spacing.lg,
    borderRadius: 2,
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.orange,
    borderRadius: 2,
  },
  stepIndicator: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    marginBottom: spacing.lg,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  questionLabel: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    marginBottom: spacing.md,
  },
  radioRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.orange,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.orange,
  },
  radioText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm / 2,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  checkmark: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  checkboxLabel: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  textInput: {
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 32,
    backgroundColor: colors.bg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
  },
});
