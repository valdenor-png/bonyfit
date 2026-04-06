import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

const TABS = ['📖 Conceito', '📈 Gráficos', '🎯 Ideal', '✏️ Anotar'] as const;

// Mock data
const EXERCISES_DATA: Record<string, { sessions: number[]; reps: number[]; currentWeight: number; currentReps: number; prevWeight: number; prevReps: number }> = {
  'Supino': { sessions: [50, 52.5, 55, 55, 57.5, 57.5, 60, 60], reps: [12, 10, 10, 12, 10, 12, 10, 12], currentWeight: 60, currentReps: 12, prevWeight: 57.5, prevReps: 12 },
  'Agachamento': { sessions: [70, 75, 75, 80, 80, 85, 85, 90], reps: [10, 10, 12, 10, 12, 10, 12, 10], currentWeight: 90, currentReps: 10, prevWeight: 85, prevReps: 12 },
  'Rosca': { sessions: [14, 14, 16, 16, 16, 18, 18, 20], reps: [12, 12, 10, 12, 12, 10, 12, 10], currentWeight: 20, currentReps: 10, prevWeight: 18, prevReps: 12 },
};

const WEEKLY_VOLUME = [2880, 3120, 3360, 2400];

const CONCEPT_CARDS = [
  { icon: '📈', title: 'Sobrecarga Progressiva', text: 'É o aumento gradual do estímulo ao longo do tempo. Seu corpo se adapta ao esforço, então você precisa aumentar a carga, volume ou intensidade para continuar progredindo. Sem sobrecarga progressiva, o músculo não tem motivo para crescer.' },
  { icon: '🏋️', title: 'Como progredir?', text: '1. Aumentar CARGA: adicionar peso na barra/máquina.\n2. Aumentar REPETIÇÕES: fazer mais reps com o mesmo peso.\n3. Aumentar VOLUME: adicionar mais séries ao exercício.\n\nComece sempre tentando aumentar reps, depois carga.' },
  { icon: '⏱️', title: 'Quando subir?', text: 'Quando você conseguir completar todas as séries dentro do range de repetições alvo. Exemplo: se o range é 8-12 e você fez 4×12, é hora de subir 2.5kg e voltar para 4×8.' },
  { icon: '📊', title: 'Volume Total', text: 'Volume = Séries × Repetições × Carga.\nExemplo: 4 séries × 12 reps × 60kg = 2880kg de volume total.\n\nO volume é o principal indicador de estímulo muscular. Acompanhe-o semanalmente.' },
  { icon: '🔄', title: 'Periodização', text: 'Ciclo recomendado: 3 semanas de progressão + 1 semana de deload.\n\nNas 3 semanas, aumente carga ou volume gradualmente. Na semana de deload, reduza 40-50% do volume para recuperação.' },
  { icon: '⚠️', title: 'Sinais de estagnação', text: 'Se você não consegue aumentar carga, reps ou volume por 3+ semanas seguidas, considere:\n• Verificar sono e alimentação\n• Fazer uma semana de deload\n• Trocar a variação do exercício\n• Ajustar o volume total semanal' },
];

const OBJECTIVES = [
  { label: 'Força (1-5)', min: 1, max: 5 },
  { label: 'Hipertrofia (8-12)', min: 8, max: 12 },
  { label: 'Resistência (15-20)', min: 15, max: 20 },
];

export default function ProgressaoCargaScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState<boolean[]>(new Array(6).fill(false));

  // Graficos state
  const [selectedExercise, setSelectedExercise] = useState('Supino');

  // Ideal state
  const [selectedObjective, setSelectedObjective] = useState(1);
  const [idealWeight, setIdealWeight] = useState(60);
  const [idealReps, setIdealReps] = useState(12);

  // Anotar state
  const [sets, setSets] = useState([
    { kg: '60', reps: '12', done: false },
    { kg: '60', reps: '12', done: false },
    { kg: '60', reps: '10', done: false },
    { kg: '60', reps: '10', done: false },
  ]);

  const toggleExpand = (index: number) => {
    setExpanded((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const updateSet = (index: number, field: 'kg' | 'reps', value: string) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const toggleDone = (index: number) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], done: !next[index].done };
      return next;
    });
  };

  const addSet = () => {
    setSets((prev) => [...prev, { kg: '60', reps: '10', done: false }]);
  };

  const completedSets = sets.filter((s) => s.done).length;
  const liveVolume = sets.filter((s) => s.done).reduce((sum, s) => sum + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0), 0);
  const prevVolume = 60 * 12 * 4;
  const volumeDiff = liveVolume - prevVolume;

  const oneRM = Math.round(idealWeight * (1 + idealReps / 30));
  const obj = OBJECTIVES[selectedObjective];

  const exData = EXERCISES_DATA[selectedExercise];
  const maxSession = Math.max(...exData.sessions);
  const maxVolume = Math.max(...WEEKLY_VOLUME);
  const currentVolume = exData.currentWeight * exData.currentReps;
  const prevExVolume = exData.prevWeight * exData.prevReps;
  const weightDiff = exData.currentWeight - exData.prevWeight;
  const repsDiff = exData.currentReps - exData.prevReps;
  const volDiff = currentVolume - prevExVolume;

  const renderConceito = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Main card */}
      <View style={styles.mainCard}>
        <Text style={styles.mainCardTitle}>PROGRESSÃO DE CARGA</Text>
        <Text style={styles.mainCardText}>
          O princípio mais importante da musculação: forçar o músculo a se adaptar aumentando o estímulo gradualmente.
        </Text>
      </View>

      {/* Expandable cards */}
      {CONCEPT_CARDS.map((card, i) => (
        <TouchableOpacity
          key={i}
          style={styles.expandCard}
          onPress={() => toggleExpand(i)}
          activeOpacity={0.7}
        >
          <View style={styles.expandHeader}>
            <Text style={styles.expandIcon}>{card.icon}</Text>
            <Text style={styles.expandTitle}>{card.title}</Text>
            <Text style={styles.chevron}>{expanded[i] ? '▲' : '▼'}</Text>
          </View>
          {expanded[i] && (
            <Text style={styles.expandText}>{card.text}</Text>
          )}
        </TouchableOpacity>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderGraficos = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Exercise selector */}
      <View style={styles.exerciseSelector}>
        {Object.keys(EXERCISES_DATA).map((ex) => (
          <TouchableOpacity
            key={ex}
            style={[styles.exerciseBtn, selectedExercise === ex && styles.exerciseBtnActive]}
            onPress={() => setSelectedExercise(ex)}
          >
            <Text style={[styles.exerciseBtnText, selectedExercise === ex && styles.exerciseBtnTextActive]}>{ex}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Carga atual</Text>
          <Text style={styles.statValue}>{exData.currentWeight}kg</Text>
          <Text style={[styles.statDiff, { color: weightDiff >= 0 ? colors.success : colors.danger }]}>
            {weightDiff >= 0 ? '▲' : '▼'} {Math.abs(weightDiff)}kg
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Reps</Text>
          <Text style={styles.statValue}>{exData.currentReps}</Text>
          <Text style={[styles.statDiff, { color: repsDiff >= 0 ? colors.success : colors.danger }]}>
            {repsDiff >= 0 ? '▲' : '▼'} {Math.abs(repsDiff)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>{currentVolume}kg</Text>
          <Text style={[styles.statDiff, { color: volDiff >= 0 ? colors.success : colors.danger }]}>
            {volDiff >= 0 ? '▲' : '▼'} {Math.abs(volDiff)}kg
          </Text>
        </View>
      </View>

      {/* Weight progression bars */}
      <Text style={styles.chartTitle}>Progressão de Carga (últimas 8 sessões)</Text>
      <View style={styles.chartContainer}>
        {exData.sessions.map((w, i) => (
          <View key={i} style={styles.barRow}>
            <Text style={styles.barLabel}>S{i + 1}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(w / maxSession) * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{w}kg</Text>
          </View>
        ))}
      </View>

      {/* Volume per week */}
      <Text style={styles.chartTitle}>Volume Semanal</Text>
      <View style={styles.weekBarsContainer}>
        {WEEKLY_VOLUME.map((v, i) => (
          <View key={i} style={styles.weekBarCol}>
            <View style={styles.weekBarTrack}>
              <View style={[styles.weekBarFill, { height: `${(v / maxVolume) * 100}%` }]} />
            </View>
            <Text style={styles.weekBarLabel}>S{i + 1}</Text>
            <Text style={styles.weekBarValue}>{v}</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderIdeal = () => {
    const repRangeMin = obj.min;
    const repRangeMax = obj.max;
    const totalRange = 20;
    const dotPosition = Math.min(Math.max(((idealReps - 1) / (totalRange - 1)) * 100, 0), 100);
    const zoneLeft = ((repRangeMin - 1) / (totalRange - 1)) * 100;
    const zoneWidth = ((repRangeMax - repRangeMin) / (totalRange - 1)) * 100;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Objective selector */}
        <Text style={styles.sectionLabel}>Objetivo</Text>
        <View style={styles.chipRow}>
          {OBJECTIVES.map((o, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.chip, selectedObjective === i && styles.chipActive]}
              onPress={() => setSelectedObjective(i)}
            >
              <Text style={[styles.chipText, selectedObjective === i && styles.chipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight input */}
        <Text style={styles.sectionLabel}>Carga (kg)</Text>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setIdealWeight((w) => Math.max(0, w - 2.5))}>
            <Text style={styles.adjustBtnText}>-2.5</Text>
          </TouchableOpacity>
          <Text style={styles.bigNumber}>{idealWeight} kg</Text>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setIdealWeight((w) => w + 2.5)}>
            <Text style={styles.adjustBtnText}>+2.5</Text>
          </TouchableOpacity>
        </View>

        {/* Reps input */}
        <Text style={styles.sectionLabel}>Repetições</Text>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setIdealReps((r) => Math.max(1, r - 1))}>
            <Text style={styles.adjustBtnText}>-1</Text>
          </TouchableOpacity>
          <Text style={styles.bigNumber}>{idealReps}</Text>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setIdealReps((r) => r + 1)}>
            <Text style={styles.adjustBtnText}>+1</Text>
          </TouchableOpacity>
        </View>

        {/* 1RM */}
        <View style={styles.rmCard}>
          <Text style={styles.rmLabel}>1RM Estimado</Text>
          <Text style={styles.rmValue}>{oneRM} kg</Text>
        </View>

        {/* Suggestion cards */}
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionIcon}>📈</Text>
            <Text style={styles.suggestionTitle}>Subir carga</Text>
            <View style={styles.idealBadge}><Text style={styles.idealBadgeText}>IDEAL</Text></View>
          </View>
          <Text style={styles.suggestionDesc}>+2.5kg, voltar pra {obj.min} reps</Text>
        </View>
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionIcon}>🔄</Text>
            <Text style={styles.suggestionTitle}>Subir reps</Text>
          </View>
          <Text style={styles.suggestionDesc}>Manter {idealWeight}kg, +1 rep</Text>
        </View>
        <View style={styles.suggestionCard}>
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionIcon}>📊</Text>
            <Text style={styles.suggestionTitle}>Subir volume</Text>
          </View>
          <Text style={styles.suggestionDesc}>Manter carga e reps, +1 série</Text>
        </View>

        {/* Rep range bar */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Range de Repetições</Text>
        <View style={styles.rangeBar}>
          <View style={[styles.rangeZone, { left: `${zoneLeft}%`, width: `${zoneWidth}%` }]} />
          <View style={[styles.rangeDot, { left: `${dotPosition}%` }]} />
        </View>
        <View style={styles.rangeLabels}>
          <Text style={styles.rangeLabelText}>1</Text>
          <Text style={styles.rangeLabelText}>5</Text>
          <Text style={styles.rangeLabelText}>10</Text>
          <Text style={styles.rangeLabelText}>15</Text>
          <Text style={styles.rangeLabelText}>20</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderAnotar = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Exercise header */}
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>Supino Reto com Barra</Text>
        <Text style={styles.exerciseMuscle}>Peito</Text>
        <Text style={styles.exerciseLast}>Última: 60kg</Text>
      </View>

      {/* Set table */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { width: 50 }]}>SÉRIE</Text>
        <Text style={[styles.tableHeaderText, { width: 70 }]}>ANTERIOR</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>KG</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>REPS</Text>
        <Text style={[styles.tableHeaderText, { width: 40 }]}>✓</Text>
      </View>

      {sets.map((s, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: 50 }]}>{i + 1}</Text>
          <Text style={[styles.tablePrev, { width: 70 }]}>60×12</Text>
          <TextInput
            style={[styles.tableInput, { flex: 1 }]}
            value={s.kg}
            onChangeText={(v) => updateSet(i, 'kg', v)}
            keyboardType="numeric"
            placeholderTextColor="#555"
          />
          <TextInput
            style={[styles.tableInput, { flex: 1 }]}
            value={s.reps}
            onChangeText={(v) => updateSet(i, 'reps', v)}
            keyboardType="numeric"
            placeholderTextColor="#555"
          />
          <TouchableOpacity style={styles.checkBox} onPress={() => toggleDone(i)}>
            <View style={[styles.checkInner, s.done && styles.checkDone]}>
              {s.done && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
        <Text style={styles.addSetText}>+ Adicionar Série</Text>
      </TouchableOpacity>

      {/* Live summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Séries</Text>
          <Text style={styles.summaryValue}>{completedSets}/{sets.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Volume</Text>
          <Text style={styles.summaryValue}>{liveVolume}kg</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>vs Anterior</Text>
          <Text style={[styles.summaryValue, { color: volumeDiff >= 0 ? colors.success : colors.danger }]}>
            {volumeDiff >= 0 ? '+' : ''}{volumeDiff}kg {volumeDiff >= 0 ? '▲' : '▼'}
          </Text>
        </View>
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => Alert.alert('Salvo!', 'Dados registrados com sucesso.')}
      >
        <Text style={styles.saveBtnText}>SALVAR</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 0: return renderConceito();
      case 1: return renderGraficos();
      case 2: return renderIdeal();
      case 3: return renderAnotar();
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Sub-tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.orange },
  tabText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: '#666' },
  tabTextActive: { color: colors.orange },
  tabContent: { flex: 1, paddingHorizontal: spacing.lg },

  // Conceito
  mainCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  mainCardTitle: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.sm },
  mainCardText: { fontSize: 14, fontFamily: fonts.body, color: '#999', lineHeight: 20 },
  expandCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  expandHeader: { flexDirection: 'row', alignItems: 'center' },
  expandIcon: { fontSize: 18, marginRight: spacing.sm },
  expandTitle: { flex: 1, fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  chevron: { fontSize: 12, color: '#999' },
  expandText: { fontSize: 13, fontFamily: fonts.body, color: '#999', marginTop: spacing.md, lineHeight: 20 },

  // Graficos
  exerciseSelector: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  exerciseBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  exerciseBtnActive: { backgroundColor: colors.orange },
  exerciseBtnText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: '#999' },
  exerciseBtnTextActive: { color: colors.text },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: { fontSize: 10, fontFamily: fonts.body, color: '#999' },
  statValue: { fontSize: 18, fontFamily: fonts.numbersBold, color: colors.text, marginTop: 2 },
  statDiff: { fontSize: 11, fontFamily: fonts.bodyMedium, marginTop: 2 },
  chartTitle: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.text, marginTop: spacing.xl },
  chartContainer: { marginTop: spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  barLabel: { width: 24, fontSize: 11, fontFamily: fonts.body, color: '#999' },
  barTrack: { flex: 1, height: 16, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.orange, borderRadius: 4 },
  barValue: { width: 44, textAlign: 'right', fontSize: 11, fontFamily: fonts.numbersBold, color: colors.text },
  weekBarsContainer: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, height: 140, alignItems: 'flex-end' },
  weekBarCol: { flex: 1, alignItems: 'center' },
  weekBarTrack: { width: '100%', height: 100, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  weekBarFill: { width: '100%', backgroundColor: colors.orange, borderRadius: 4 },
  weekBarLabel: { fontSize: 11, fontFamily: fonts.body, color: '#999', marginTop: 4 },
  weekBarValue: { fontSize: 10, fontFamily: fonts.numbersBold, color: colors.text },

  // Ideal
  sectionLabel: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.orange },
  chipText: { fontSize: 11, fontFamily: fonts.bodyMedium, color: '#999' },
  chipTextActive: { color: colors.text },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  bigNumber: { fontSize: 36, fontFamily: fonts.numbersExtraBold, color: colors.orange, minWidth: 120, textAlign: 'center' },
  rmCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rmLabel: { fontSize: 14, fontFamily: fonts.bodyMedium, color: '#999' },
  rmValue: { fontSize: 22, fontFamily: fonts.numbersBold, color: colors.text },
  suggestionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center' },
  suggestionIcon: { fontSize: 16, marginRight: spacing.sm },
  suggestionTitle: { flex: 1, fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  idealBadge: {
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  idealBadgeText: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.text },
  suggestionDesc: { fontSize: 12, fontFamily: fonts.body, color: '#999', marginTop: 4 },
  rangeBar: {
    height: 12,
    backgroundColor: '#222',
    borderRadius: 6,
    marginTop: spacing.sm,
    position: 'relative',
    overflow: 'visible',
  },
  rangeZone: {
    position: 'absolute',
    top: 0,
    height: 12,
    backgroundColor: 'rgba(242, 101, 34, 0.3)',
    borderRadius: 6,
  },
  rangeDot: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    marginLeft: -10,
  },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  rangeLabelText: { fontSize: 10, fontFamily: fonts.body, color: '#999' },

  // Anotar
  exerciseHeader: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  exerciseName: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text },
  exerciseMuscle: { fontSize: 12, fontFamily: fonts.body, color: colors.orange, marginTop: 2 },
  exerciseLast: { fontSize: 12, fontFamily: fonts.body, color: '#999', marginTop: 2 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tableHeaderText: { fontSize: 10, fontFamily: fonts.bodyBold, color: '#999', textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  tableCell: { fontSize: 14, fontFamily: fonts.numbersBold, color: colors.text, textAlign: 'center' },
  tablePrev: { fontSize: 12, fontFamily: fonts.body, color: '#555', textAlign: 'center' },
  tableInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    textAlign: 'center',
  },
  checkBox: { width: 40, alignItems: 'center' },
  checkInner: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { fontSize: 14, color: colors.text, fontFamily: fonts.bodyBold },
  addSetBtn: { marginTop: spacing.md, alignItems: 'center' },
  addSetText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.orange },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 10, fontFamily: fonts.body, color: '#999' },
  summaryValue: { fontSize: 16, fontFamily: fonts.numbersBold, color: colors.text, marginTop: 2 },
  saveBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text },
});
