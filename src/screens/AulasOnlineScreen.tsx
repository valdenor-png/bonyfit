import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';
import Button from '../components/Button';

// ─── TYPES ──────────────────────────────────────────────
type Difficulty = 'Iniciante' | 'Intermediário' | 'Avançado';

interface OnlineClass {
  id: string;
  name: string;
  instructor: string;
  duration: string;
  difficulty: Difficulty;
  category: string;
  views: number;
  description: string;
  gradientColors: [string, string];
}

// ─── MOCK DATA ──────────────────────────────────────────
const CATEGORIES = ['Todos', 'HIIT', 'Yoga', 'Funcional', 'Alongamento', 'Cardio'];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Iniciante: colors.success,
  Intermediário: colors.warning,
  Avançado: colors.danger,
};

const MOCK_CLASSES: OnlineClass[] = [
  {
    id: '1',
    name: 'HIIT Queima Total',
    instructor: 'Prof. Marcos',
    duration: '30 min',
    difficulty: 'Intermediário',
    category: 'HIIT',
    views: 1250,
    description:
      'Treino intervalado de alta intensidade focado em queima calórica máxima. Alterne entre exercícios de alta e baixa intensidade para acelerar o metabolismo e queimar gordura por horas após o treino.',
    gradientColors: ['#F26522', '#D4520F'],
  },
  {
    id: '2',
    name: 'Yoga Flow Matinal',
    instructor: 'Prof. Camila',
    duration: '45 min',
    difficulty: 'Iniciante',
    category: 'Yoga',
    views: 890,
    description:
      'Sessão de yoga vinyasa para começar o dia com energia e foco. Sequência de posturas fluidas que trabalham flexibilidade, equilíbrio e consciência corporal.',
    gradientColors: ['#9B59B6', '#8E44AD'],
  },
  {
    id: '3',
    name: 'Funcional Corpo Todo',
    instructor: 'Prof. Ricardo',
    duration: '40 min',
    difficulty: 'Intermediário',
    category: 'Funcional',
    views: 2100,
    description:
      'Treino funcional completo usando peso corporal e acessórios simples. Trabalha todos os grupos musculares com movimentos que imitam atividades do dia a dia.',
    gradientColors: ['#3B82F6', '#2563EB'],
  },
  {
    id: '4',
    name: 'Alongamento Completo',
    instructor: 'Prof. Ana',
    duration: '20 min',
    difficulty: 'Iniciante',
    category: 'Alongamento',
    views: 670,
    description:
      'Sessão de alongamento para todo o corpo, ideal para pós-treino ou dias de descanso ativo. Melhora a flexibilidade e reduz tensão muscular.',
    gradientColors: ['#2ECC71', '#27AE60'],
  },
  {
    id: '5',
    name: 'Cardio Dance',
    instructor: 'Prof. Juliana',
    duration: '35 min',
    difficulty: 'Iniciante',
    category: 'Cardio',
    views: 1580,
    description:
      'Aula de cardio com movimentos de dança. Queime calorias de forma divertida com coreografias simples e energéticas ao som de músicas animadas.',
    gradientColors: ['#E74C3C', '#C0392B'],
  },
  {
    id: '6',
    name: 'HIIT Avançado',
    instructor: 'Prof. Marcos',
    duration: '25 min',
    difficulty: 'Avançado',
    category: 'HIIT',
    views: 3200,
    description:
      'Para quem já domina o HIIT básico. Combinações complexas de exercícios pliométricos e isométricos que levam seu condicionamento ao limite.',
    gradientColors: ['#F39C12', '#E67E22'],
  },
  {
    id: '7',
    name: 'Yoga Restaurativo',
    instructor: 'Prof. Camila',
    duration: '50 min',
    difficulty: 'Iniciante',
    category: 'Yoga',
    views: 450,
    description:
      'Prática suave focada em relaxamento profundo e recuperação muscular. Posturas mantidas por mais tempo com uso de props para máximo conforto.',
    gradientColors: ['#1ABC9C', '#16A085'],
  },
  {
    id: '8',
    name: 'Funcional TABATA',
    instructor: 'Prof. Ricardo',
    duration: '20 min',
    difficulty: 'Avançado',
    category: 'Funcional',
    views: 1890,
    description:
      'Protocolo Tabata aplicado ao treino funcional: 20 segundos de esforço máximo + 10 segundos de descanso. Oito rounds por exercício. Curto e intenso.',
    gradientColors: ['#E74C3C', '#C0392B'],
  },
  {
    id: '9',
    name: 'Mobilidade Articular',
    instructor: 'Prof. Ana',
    duration: '15 min',
    difficulty: 'Iniciante',
    category: 'Alongamento',
    views: 320,
    description:
      'Exercícios de mobilidade articular para melhorar a amplitude de movimento e prevenir lesões. Ideal para aquecimento ou recuperação ativa.',
    gradientColors: ['#2ECC71', '#27AE60'],
  },
  {
    id: '10',
    name: 'Spinning Virtual',
    instructor: 'Prof. Thiago',
    duration: '45 min',
    difficulty: 'Intermediário',
    category: 'Cardio',
    views: 980,
    description:
      'Aula de bike indoor simulada com variação de intensidade. Siga as instruções de cadência e carga para um treino cardiovascular completo.',
    gradientColors: ['#F26522', '#D4520F'],
  },
];

const formatViews = (views: number): string => {
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`;
  return String(views);
};

// ─── COMPONENT ──────────────────────────────────────────
export default function AulasOnlineScreen() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const filteredClasses =
    selectedCategory === 'Todos'
      ? MOCK_CLASSES
      : MOCK_CLASSES.filter((c) => c.category === selectedCategory);

  const renderClassCard = (item: OnlineClass) => {
    const isExpanded = expandedClass === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.classCard}
        activeOpacity={0.8}
        onPress={() => setExpandedClass(isExpanded ? null : item.id)}
      >
        {/* Thumbnail */}
        <LinearGradient
          colors={item.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.thumbnail}
        >
          <Text style={styles.playIcon}>▶</Text>
        </LinearGradient>

        {/* Info */}
        <Text style={styles.className} numberOfLines={isExpanded ? undefined : 1}>
          {item.name}
        </Text>
        <Text style={styles.instructor}>{item.instructor}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.duration}>{item.duration}</Text>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: DIFFICULTY_COLORS[item.difficulty] + '22' },
            ]}
          >
            <Text
              style={[
                styles.difficultyText,
                { color: DIFFICULTY_COLORS[item.difficulty] },
              ]}
            >
              {item.difficulty}
            </Text>
          </View>
        </View>

        <Text style={styles.viewsCount}>{formatViews(item.views)} views</Text>

        {/* Expanded description */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            <Text style={styles.classDescription}>{item.description}</Text>
            <View style={{ marginTop: spacing.md }}>
              <Button title="Iniciar aula" onPress={() => Alert.alert('Em breve', 'Aulas online em desenvolvimento.')} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <Text style={styles.header}>Aulas Online</Text>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryPill,
              selectedCategory === cat && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => renderClassCard(item)}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Categories
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  categoryPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.elevated,
  },
  categoryPillActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  categoryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.text,
  },

  // Grid
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  classCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '48%',
  },
  thumbnail: {
    width: '100%',
    height: 90,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  playIcon: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.9)',
  },
  className: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  instructor: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  duration: {
    fontFamily: fonts.numbers,
    fontSize: 12,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  difficultyBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  difficultyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
  },
  viewsCount: {
    fontFamily: fonts.numbers,
    fontSize: 11,
    color: colors.textMuted,
  },
  expandedSection: {
    marginTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.elevated,
    paddingTop: spacing.sm,
  },
  classDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
