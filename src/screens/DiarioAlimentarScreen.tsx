import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

interface Props {
  navigation: any;
}

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface MealEntry {
  id: string;
  time: string;
  type: string;
  icon: string;
  foods: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  hasPhoto: boolean;
}

const MOCK_TODAY: MealEntry[] = [
  { id: '1', time: '07:15', type: 'Café da manhã', icon: '☕', foods: ['Ovos mexidos (3)', 'Pão integral', 'Café com leite'], calories: 420, protein: 28, carbs: 35, fat: 18, hasPhoto: true },
  { id: '2', time: '10:00', type: 'Lanche', icon: '🍌', foods: ['Banana', 'Whey protein'], calories: 230, protein: 25, carbs: 28, fat: 3, hasPhoto: false },
  { id: '3', time: '12:30', type: 'Almoço', icon: '🍽', foods: ['Arroz integral', 'Frango grelhado', 'Brócolis', 'Feijão'], calories: 650, protein: 45, carbs: 72, fat: 15, hasPhoto: true },
  { id: '4', time: '15:30', type: 'Lanche', icon: '🥜', foods: ['Iogurte natural', 'Granola', 'Castanhas'], calories: 280, protein: 15, carbs: 30, fat: 12, hasPhoto: false },
];

const MOODS = ['😫', '😐', '😊', '😄', '🤩'];

export default function DiarioAlimentarScreen({ navigation }: Props) {
  const [selectedDay, setSelectedDay] = useState(3); // Qui = today
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(3);

  const totalCals = MOCK_TODAY.reduce((a, m) => a + m.calories, 0);
  const totalP = MOCK_TODAY.reduce((a, m) => a + m.protein, 0);
  const totalC = MOCK_TODAY.reduce((a, m) => a + m.carbs, 0);
  const totalF = MOCK_TODAY.reduce((a, m) => a + m.fat, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diário Alimentar</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
        {DAYS.map((day, i) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayCircle, selectedDay === i && styles.dayCircleActive]}
            onPress={() => setSelectedDay(i)}
          >
            <Text style={[styles.dayText, selectedDay === i && styles.dayTextActive]}>{day}</Text>
            <Text style={[styles.dayNum, selectedDay === i && styles.dayNumActive]}>{25 + i}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Daily summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo do dia</Text>
          <Text style={styles.summaryCalories}>{totalCals} kcal</Text>
          <View style={styles.macrosRow}>
            <MacroBar label="Proteína" value={totalP} max={150} color={colors.info} />
            <MacroBar label="Carbs" value={totalC} max={250} color={colors.orange} />
            <MacroBar label="Gordura" value={totalF} max={70} color="#F39C12" />
          </View>
        </View>

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Refeições</Text>
        {MOCK_TODAY.map((meal, i) => (
          <TouchableOpacity
            key={meal.id}
            style={styles.mealCard}
            onPress={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
            activeOpacity={0.7}
          >
            <View style={styles.mealHeader}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDot} />
                {i < MOCK_TODAY.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.mealInfo}>
                <View style={styles.mealTop}>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                  <Text style={styles.mealType}>{meal.icon} {meal.type}</Text>
                </View>
                <Text style={styles.mealCals}>{meal.calories} kcal</Text>
              </View>
              {meal.hasPhoto && (
                <View style={styles.photoThumb}>
                  <Text style={styles.photoIcon}>📷</Text>
                </View>
              )}
            </View>

            {expandedMeal === meal.id && (
              <View style={styles.mealExpanded}>
                {meal.foods.map((food, fi) => (
                  <Text key={fi} style={styles.foodItem}>• {food}</Text>
                ))}
                <View style={styles.mealMacros}>
                  <Text style={styles.mealMacroText}>P: {meal.protein}g</Text>
                  <Text style={styles.mealMacroText}>C: {meal.carbs}g</Text>
                  <Text style={styles.mealMacroText}>G: {meal.fat}g</Text>
                </View>
                {!meal.hasPhoto && (
                  <TouchableOpacity style={styles.addPhotoBtn}>
                    <Text style={styles.addPhotoText}>📸 Adicionar foto</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Mood */}
        <View style={styles.moodCard}>
          <Text style={styles.moodTitle}>Como foi sua alimentação hoje?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((emoji, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.moodBtn, selectedMood === i && styles.moodBtnActive]}
                onPress={() => setSelectedMood(i)}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={styles.macroBarContainer}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>{value}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
  },
  backText: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.orange },
  headerTitle: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text },
  daysRow: { paddingHorizontal: spacing.xl, gap: spacing.md, paddingBottom: spacing.lg },
  dayCircle: {
    width: 48, height: 56, borderRadius: 24, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: colors.orange },
  dayText: { fontSize: 10, fontFamily: fonts.body, color: colors.textMuted },
  dayTextActive: { color: colors.text },
  dayNum: { fontSize: 16, fontFamily: fonts.numbersBold, color: colors.textSecondary },
  dayNumActive: { color: colors.text },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 80 },
  summaryCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.xl,
  },
  summaryTitle: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.textMuted, marginBottom: spacing.sm },
  summaryCalories: { fontSize: 28, fontFamily: fonts.numbersExtraBold, color: colors.text, marginBottom: spacing.lg },
  macrosRow: { gap: spacing.sm },
  macroBarContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  macroLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textSecondary, width: 60 },
  macroTrack: { flex: 1, height: 6, backgroundColor: colors.elevated, borderRadius: 3, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 3 },
  macroValue: { fontSize: 11, fontFamily: fonts.numbersBold, color: colors.textSecondary, width: 35, textAlign: 'right' },
  sectionTitle: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.md },
  mealCard: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center' },
  timelineLeft: { alignItems: 'center', marginRight: spacing.md, width: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.orange },
  timelineLine: { width: 2, height: 30, backgroundColor: colors.elevated, position: 'absolute', top: 14 },
  mealInfo: { flex: 1 },
  mealTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mealTime: { fontSize: 12, fontFamily: fonts.numbersBold, color: colors.orange },
  mealType: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.text },
  mealCals: { fontSize: 11, fontFamily: fonts.body, color: colors.textSecondary, marginTop: 2 },
  photoThumb: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  photoIcon: { fontSize: 16 },
  mealExpanded: { marginTop: spacing.md, paddingLeft: 24, borderTopWidth: 0.5, borderTopColor: colors.elevated, paddingTop: spacing.md },
  foodItem: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, marginBottom: 4 },
  mealMacros: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  mealMacroText: { fontSize: 11, fontFamily: fonts.numbersBold, color: colors.textMuted },
  addPhotoBtn: { marginTop: spacing.sm, padding: spacing.sm },
  addPhotoText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.orange },
  moodCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, marginTop: spacing.lg,
  },
  moodTitle: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  moodRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  moodBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  moodBtnActive: { backgroundColor: 'rgba(242, 101, 34, 0.2)', borderWidth: 2, borderColor: colors.orange },
  moodEmoji: { fontSize: 22 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  fabText: { fontSize: 28, color: colors.text, fontFamily: fonts.bodyBold, marginTop: -2 },
});
