import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';
import ProgressRing from '../components/ProgressRing';
import Button from '../components/Button';

// ─── TYPES ──────────────────────────────────────────────
type TabKey = 'plano' | 'calorias' | 'dicas';

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  id: string;
  time: string;
  name: string;
  foods: FoodItem[];
}

interface LoggedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionTip {
  id: string;
  category: 'Proteína' | 'Hidratação' | 'Pré-treino' | 'Pós-treino' | 'Suplementos';
  title: string;
  description: string;
  fullText: string;
}

// ─── MOCK DATA ──────────────────────────────────────────
const MOCK_MEALS: Meal[] = [
  {
    id: '1',
    time: '07:00',
    name: 'Café da manhã',
    foods: [
      { name: 'Pão integral', portion: '2 fatias', calories: 140, protein: 6, carbs: 26, fat: 2 },
      { name: 'Ovos mexidos', portion: '3 unid.', calories: 234, protein: 18, carbs: 2, fat: 16 },
      { name: 'Café com leite', portion: '200ml', calories: 80, protein: 4, carbs: 8, fat: 3 },
      { name: 'Banana', portion: '1 unid.', calories: 89, protein: 1, carbs: 23, fat: 0 },
    ],
  },
  {
    id: '2',
    time: '10:00',
    name: 'Lanche manhã',
    foods: [
      { name: 'Iogurte natural', portion: '170g', calories: 100, protein: 10, carbs: 12, fat: 2 },
      { name: 'Granola', portion: '30g', calories: 120, protein: 3, carbs: 20, fat: 4 },
    ],
  },
  {
    id: '3',
    time: '12:30',
    name: 'Almoço',
    foods: [
      { name: 'Arroz integral', portion: '150g', calories: 170, protein: 4, carbs: 36, fat: 1 },
      { name: 'Feijão', portion: '100g', calories: 77, protein: 5, carbs: 14, fat: 0 },
      { name: 'Frango grelhado', portion: '150g', calories: 248, protein: 38, carbs: 0, fat: 10 },
      { name: 'Salada verde', portion: '1 prato', calories: 25, protein: 2, carbs: 4, fat: 0 },
      { name: 'Azeite', portion: '1 col.', calories: 90, protein: 0, carbs: 0, fat: 10 },
    ],
  },
  {
    id: '4',
    time: '15:30',
    name: 'Lanche tarde',
    foods: [
      { name: 'Whey Protein', portion: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 1 },
      { name: 'Batata doce', portion: '100g', calories: 86, protein: 2, carbs: 20, fat: 0 },
    ],
  },
  {
    id: '5',
    time: '19:30',
    name: 'Jantar',
    foods: [
      { name: 'Filé de tilápia', portion: '200g', calories: 206, protein: 42, carbs: 0, fat: 4 },
      { name: 'Purê de batata', portion: '100g', calories: 100, protein: 2, carbs: 18, fat: 3 },
      { name: 'Brócolis', portion: '100g', calories: 34, protein: 3, carbs: 7, fat: 0 },
    ],
  },
  {
    id: '6',
    time: '21:30',
    name: 'Ceia',
    foods: [
      { name: 'Queijo cottage', portion: '100g', calories: 98, protein: 11, carbs: 3, fat: 4 },
      { name: 'Castanhas', portion: '30g', calories: 180, protein: 5, carbs: 4, fat: 16 },
    ],
  },
];

const QUICK_ADD_ITEMS: FoodItem[] = [
  { name: 'Arroz (100g)', portion: '100g', calories: 130, protein: 3, carbs: 28, fat: 0 },
  { name: 'Frango grelhado (100g)', portion: '100g', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: 'Ovo (1 un.)', portion: '1 unid.', calories: 78, protein: 6, carbs: 1, fat: 5 },
  { name: 'Feijão (100g)', portion: '100g', calories: 77, protein: 5, carbs: 14, fat: 0 },
  { name: 'Banana (1 un.)', portion: '1 unid.', calories: 89, protein: 1, carbs: 23, fat: 0 },
  { name: 'Pão integral (1 fatia)', portion: '1 fatia', calories: 70, protein: 3, carbs: 13, fat: 1 },
  { name: 'Batata doce (100g)', portion: '100g', calories: 86, protein: 2, carbs: 20, fat: 0 },
  { name: 'Whey Protein (1 scoop)', portion: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 1 },
];

const MOCK_TIPS: NutritionTip[] = [
  {
    id: '1',
    category: 'Proteína',
    title: 'Distribua a proteína ao longo do dia',
    description: 'Consumir 20-40g de proteína por refeição otimiza a síntese muscular. Dividir em 4-6 refeições é mais eficiente que concentrar em 1-2.',
    fullText: 'Estudos mostram que o corpo utiliza melhor a proteína quando distribuída em porções de 20-40g por refeição. Isso mantém a síntese proteica muscular elevada ao longo de todo o dia. Para quem treina, o ideal é fazer 4-6 refeições com fontes de proteína de qualidade como frango, peixe, ovos, whey e leguminosas.',
  },
  {
    id: '2',
    category: 'Hidratação',
    title: 'Beba água antes de sentir sede',
    description: 'A desidratação de apenas 2% do peso corporal já reduz o desempenho no treino. Mantenha 35ml/kg de peso por dia.',
    fullText: 'A sede é um sinal tardio de desidratação. Para treinos intensos, inicie bem hidratado e beba 150-300ml a cada 15-20 minutos durante o exercício. Após o treino, reponha 150% do peso perdido em suor. Água com limão ou água de coco são boas opções para reidratação.',
  },
  {
    id: '3',
    category: 'Pré-treino',
    title: 'Carboidrato antes do treino potencializa',
    description: 'Consuma carboidratos de baixo a médio índice glicêmico 60-90 min antes do treino para ter energia sustentada.',
    fullText: 'Batata doce, aveia, pão integral ou banana são excelentes opções pré-treino. Eles fornecem glicose de forma gradual, mantendo a energia durante toda a sessão. Evite fibras em excesso ou gorduras nesta refeição para não atrapalhar a digestão. Uma porção de 30-60g de carboidratos é suficiente.',
  },
  {
    id: '4',
    category: 'Pós-treino',
    title: 'Janela anabólica: mito ou verdade?',
    description: 'A janela de 30 minutos não é tão rígida quanto se pensava, mas comer proteína + carboidrato em até 2h após o treino é ideal.',
    fullText: 'Pesquisas recentes mostram que a janela anabólica é mais ampla do que se acreditava. O mais importante é o consumo total diário de proteína. Porém, se você treina em jejum ou faz treinos longos (>90 min), priorizar uma refeição pós-treino com 20-40g de proteína e carboidratos de rápida absorção é benéfico para a recuperação muscular.',
  },
  {
    id: '5',
    category: 'Suplementos',
    title: 'Creatina: o suplemento mais estudado',
    description: 'A creatina monohidratada é segura e eficaz. 3-5g por dia, todos os dias, sem necessidade de fase de carga.',
    fullText: 'A creatina é o suplemento com mais evidências científicas para ganho de força e massa muscular. Ela aumenta as reservas de fosfocreatina no músculo, permitindo mais repetições e séries com mais intensidade. Não há necessidade de ciclar ou fazer fase de carga. Tome 3-5g por dia, preferencialmente com uma refeição, todos os dias, inclusive nos dias de descanso.',
  },
  {
    id: '6',
    category: 'Proteína',
    title: 'Fontes completas vs incompletas',
    description: 'Proteínas de origem animal são completas. Vegetais podem ser combinados (arroz + feijão) para obter todos os aminoácidos.',
    fullText: 'Proteínas completas possuem todos os aminoácidos essenciais em proporções adequadas. Carnes, ovos, leite e whey são exemplos. Para vegetarianos, a combinação de cereais com leguminosas (arroz + feijão, por exemplo) fornece um perfil completo de aminoácidos. A soja também é uma proteína vegetal completa.',
  },
  {
    id: '7',
    category: 'Hidratação',
    title: 'Isotônicos: quando realmente usar',
    description: 'Isotônicos são necessários apenas para treinos intensos acima de 60 minutos. Para treinos curtos, água é suficiente.',
    fullText: 'Bebidas isotônicas repõem eletrólitos (sódio, potássio, magnésio) perdidos pelo suor em exercícios prolongados e intensos. Para musculação convencional de 45-60 minutos, água é suficiente. Se treinar em ambiente muito quente ou por mais de 90 minutos, considere usar isotônico ou adicionar uma pitada de sal na água.',
  },
  {
    id: '8',
    category: 'Pré-treino',
    title: 'Cafeína melhora o desempenho',
    description: 'Cafeína 30-60 min antes do treino (3-6mg/kg) aumenta força, potência e resistência. Não exceda 400mg/dia.',
    fullText: 'A cafeína é um dos ergogênicos mais eficazes para desempenho esportivo. Ela reduz a percepção de esforço e aumenta a liberação de cálcio no músculo. Para uma pessoa de 70kg, 210-420mg de cafeína é a faixa ideal. Um café expresso tem cerca de 80mg. Evite consumir após as 16h para não comprometer o sono, que é fundamental para a recuperação muscular.',
  },
  {
    id: '9',
    category: 'Pós-treino',
    title: 'Sono: o suplemento gratuito',
    description: 'Dormir 7-9h por noite é essencial para recuperação muscular, regulação hormonal e desempenho no treino.',
    fullText: 'Durante o sono profundo, o corpo libera hormônio do crescimento (GH), essencial para reparo muscular. A privação de sono aumenta o cortisol, reduz a testosterona e prejudica a síntese proteica. Mantenha horários regulares, evite telas 1h antes de dormir, e garanta um ambiente escuro e fresco. Magnésio e triptofano podem auxiliar na qualidade do sono.',
  },
  {
    id: '10',
    category: 'Suplementos',
    title: 'Whey Protein: tipos e quando usar',
    description: 'Whey concentrado (WPC) é a melhor relação custo-benefício. Isolado (WPI) para intolerantes à lactose.',
    fullText: 'O Whey Protein Concentrado (WPC) contém 70-80% de proteína e é a opção mais acessível. O Isolado (WPI) tem 90%+ de proteína e menos lactose. O Hidrolisado (WPH) é pré-digerido para absorção ultrarrápida. Para a maioria das pessoas, o WPC é suficiente. Use como complemento da alimentação quando não conseguir atingir a meta proteica com comida real.',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Proteína': '#E74C3C',
  'Hidratação': '#3B82F6',
  'Pré-treino': '#F39C12',
  'Pós-treino': '#2ECC71',
  'Suplementos': '#9B59B6',
};

// ─── COMPONENT ──────────────────────────────────────────
export default function NutricaoScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('plano');

  // Calorias tab state
  const calorieTarget = 2200;
  const proteinTarget = 160;
  const carbsTarget = 275;
  const fatTarget = 73;

  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>([
    { id: 'l1', name: 'Ovos mexidos (3 un.)', calories: 234, protein: 18, carbs: 2, fat: 16 },
    { id: 'l2', name: 'Pão integral (2 fatias)', calories: 140, protein: 6, carbs: 26, fat: 2 },
    { id: 'l3', name: 'Frango grelhado (150g)', calories: 248, protein: 38, carbs: 0, fat: 10 },
    { id: 'l4', name: 'Arroz integral (150g)', calories: 170, protein: 4, carbs: 36, fat: 1 },
  ]);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCal, setManualCal] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  // Dicas tab state
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const totalLogged = loggedFoods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const removeLoggedFood = (id: string) => {
    setLoggedFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const addQuickItem = (item: FoodItem) => {
    setLoggedFoods((prev) => [
      ...prev,
      {
        id: `l${Date.now()}`,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      },
    ]);
    setAddModalVisible(false);
  };

  const addManualItem = () => {
    if (!manualName || !manualCal) return;
    setLoggedFoods((prev) => [
      ...prev,
      {
        id: `l${Date.now()}`,
        name: manualName,
        calories: parseInt(manualCal, 10) || 0,
        protein: parseInt(manualProtein, 10) || 0,
        carbs: parseInt(manualCarbs, 10) || 0,
        fat: parseInt(manualFat, 10) || 0,
      },
    ]);
    setManualName('');
    setManualCal('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setAddModalVisible(false);
  };

  const filteredQuickItems = searchQuery
    ? QUICK_ADD_ITEMS.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : QUICK_ADD_ITEMS;

  // ─── TABS ─────────────────────────────────────────────
  const TABS: { key: TabKey; label: string }[] = [
    { key: 'plano', label: 'Plano Alimentar' },
    { key: 'calorias', label: 'Calorias' },
    { key: 'dicas', label: 'Dicas' },
  ];

  // ─── HELPER ───────────────────────────────────────────
  const mealCalories = (meal: Meal) =>
    meal.foods.reduce((sum, f) => sum + f.calories, 0);

  const totalDayCalories = MOCK_MEALS.reduce(
    (sum, m) => sum + mealCalories(m),
    0
  );
  const totalDayMacros = MOCK_MEALS.reduce(
    (acc, m) => {
      m.foods.forEach((f) => {
        acc.protein += f.protein;
        acc.carbs += f.carbs;
        acc.fat += f.fat;
      });
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 }
  );

  // ─── RENDER TABS ──────────────────────────────────────
  const renderPlano = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Badge */}
      <View style={styles.badgeRow}>
        <LinearGradient
          colors={[colors.orange, colors.orangeDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.badge}
        >
          <Text style={styles.badgeText}>Montado por nutricionista</Text>
        </LinearGradient>
      </View>

      {MOCK_MEALS.map((meal) => (
        <View key={meal.id} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTime}>{meal.time}</Text>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.mealCal}>{mealCalories(meal)} kcal</Text>
          </View>
          {meal.foods.map((food, idx) => (
            <View key={idx} style={styles.foodRow}>
              <Text style={styles.foodName}>
                {food.name}{' '}
                <Text style={styles.foodPortion}>({food.portion})</Text>
              </Text>
              <Text style={styles.foodCalories}>{food.calories} kcal</Text>
            </View>
          ))}
        </View>
      ))}

      {/* Totals */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total do dia</Text>
        <Text style={styles.totalValue}>{totalDayCalories} kcal</Text>
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Proteína</Text>
            <Text style={styles.macroValue}>{totalDayMacros.protein}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{totalDayMacros.carbs}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Gordura</Text>
            <Text style={styles.macroValue}>{totalDayMacros.fat}g</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderMacroBar = (
    label: string,
    consumed: number,
    target: number,
    barColor: string
  ) => {
    const pct = Math.min(consumed / target, 1);
    return (
      <View style={styles.macroBarContainer} key={label}>
        <View style={styles.macroBarHeader}>
          <Text style={styles.macroBarLabel}>{label}</Text>
          <Text style={styles.macroBarValues}>
            {consumed}g / {target}g
          </Text>
        </View>
        <View style={styles.macroBarTrack}>
          <View
            style={[
              styles.macroBarFill,
              { width: `${pct * 100}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderCalorias = () => {
    const remaining = Math.max(calorieTarget - totalLogged.calories, 0);
    const calProgress = Math.min(totalLogged.calories / calorieTarget, 1);

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Circular summary */}
        <View style={styles.calorieSummary}>
          <ProgressRing
            progress={calProgress}
            size={140}
            strokeWidth={10}
            color={colors.orange}
          >
            <Text style={styles.calorieConsumed}>{totalLogged.calories}</Text>
            <Text style={styles.calorieOf}>/ {calorieTarget}</Text>
          </ProgressRing>
          <Text style={styles.calorieRemaining}>
            {remaining} kcal restantes
          </Text>
        </View>

        {/* Macros bars */}
        {renderMacroBar('Proteína', totalLogged.protein, proteinTarget, '#E74C3C')}
        {renderMacroBar('Carboidratos', totalLogged.carbs, carbsTarget, '#F39C12')}
        {renderMacroBar('Gordura', totalLogged.fat, fatTarget, '#3B82F6')}

        {/* Add button */}
        <View style={styles.addBtnContainer}>
          <Button
            title="Adicionar refeição"
            onPress={() => setAddModalVisible(true)}
          />
        </View>

        {/* Today's log */}
        <Text style={styles.sectionTitle}>Registro de hoje</Text>
        {loggedFoods.map((food) => (
          <View key={food.id} style={styles.loggedRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.loggedName}>{food.name}</Text>
              <Text style={styles.loggedMacros}>
                P: {food.protein}g | C: {food.carbs}g | G: {food.fat}g
              </Text>
            </View>
            <Text style={styles.loggedCal}>{food.calories} kcal</Text>
            <TouchableOpacity
              onPress={() => removeLoggedFood(food.id)}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteBtnText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderDicas = () => (
    <FlatList
      data={MOCK_TIPS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tipsContainer}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const isExpanded = expandedTip === item.id;
        const catColor = CATEGORY_COLORS[item.category] || colors.orange;
        return (
          <View style={styles.tipCard}>
            <View style={[styles.tipCategoryPill, { backgroundColor: catColor }]}>
              <Text style={styles.tipCategoryText}>{item.category}</Text>
            </View>
            <Text style={styles.tipTitle}>{item.title}</Text>
            <Text style={styles.tipDescription}>{item.description}</Text>
            {isExpanded && (
              <Text style={styles.tipFullText}>{item.fullText}</Text>
            )}
            <TouchableOpacity
              onPress={() =>
                setExpandedTip(isExpanded ? null : item.id)
              }
            >
              <Text style={styles.readMore}>
                {isExpanded ? 'Ler menos' : 'Ler mais'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );

  // ─── MAIN RENDER ──────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <Text style={styles.header}>Nutrição</Text>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'plano' && renderPlano()}
      {activeTab === 'calorias' && renderCalorias()}
      {activeTab === 'dicas' && renderDicas()}

      {/* Add Food Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar refeição</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalClose}>X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Search */}
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar alimento..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {/* Quick add */}
              <Text style={styles.modalSection}>Adicionar rápido</Text>
              {filteredQuickItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickItem}
                  onPress={() => addQuickItem(item)}
                >
                  <Text style={styles.quickItemName}>{item.name}</Text>
                  <Text style={styles.quickItemCal}>{item.calories} kcal</Text>
                </TouchableOpacity>
              ))}

              {/* Manual input */}
              <Text style={styles.modalSection}>Adicionar manualmente</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Nome do alimento"
                placeholderTextColor={colors.textMuted}
                value={manualName}
                onChangeText={setManualName}
              />
              <View style={styles.manualRow}>
                <TextInput
                  style={[styles.manualInput, { flex: 1 }]}
                  placeholder="Calorias"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={manualCal}
                  onChangeText={setManualCal}
                />
                <TextInput
                  style={[styles.manualInput, { flex: 1, marginLeft: spacing.sm }]}
                  placeholder="Proteína (g)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={manualProtein}
                  onChangeText={setManualProtein}
                />
              </View>
              <View style={styles.manualRow}>
                <TextInput
                  style={[styles.manualInput, { flex: 1 }]}
                  placeholder="Carbs (g)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={manualCarbs}
                  onChangeText={setManualCarbs}
                />
                <TextInput
                  style={[styles.manualInput, { flex: 1, marginLeft: spacing.sm }]}
                  placeholder="Gordura (g)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={manualFat}
                  onChangeText={setManualFat}
                />
              </View>
              <View style={{ marginTop: spacing.md }}>
                <Button title="Adicionar" onPress={addManualItem} />
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.orange,
  },
  tabText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.orange,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Plano Alimentar
  badgeRow: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.text,
  },
  mealCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealTime: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.orange,
    marginRight: spacing.sm,
  },
  mealName: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  mealCal: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 0.5,
    borderTopColor: colors.elevated,
  },
  foodName: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  foodPortion: {
    color: colors.textMuted,
  },
  foodCalories: {
    fontFamily: fonts.numbers,
    fontSize: 13,
    color: colors.textSecondary,
  },
  totalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.orange,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalValue: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 28,
    color: colors.orange,
    marginVertical: spacing.xs,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing.sm,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  macroValue: {
    fontFamily: fonts.numbersBold,
    fontSize: 16,
    color: colors.text,
  },

  // Calorias
  calorieSummary: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  calorieConsumed: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 28,
    color: colors.text,
  },
  calorieOf: {
    fontFamily: fonts.numbers,
    fontSize: 12,
    color: colors.textMuted,
  },
  calorieRemaining: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  macroBarContainer: {
    marginBottom: spacing.lg,
  },
  macroBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  macroBarLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  macroBarValues: {
    fontFamily: fonts.numbers,
    fontSize: 13,
    color: colors.textSecondary,
  },
  macroBarTrack: {
    height: 8,
    backgroundColor: colors.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  addBtnContainer: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.md,
  },
  loggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  loggedName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  loggedMacros: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  loggedCal: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.orange,
    marginRight: spacing.sm,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.danger,
  },

  // Dicas
  tipsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  tipCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  tipCategoryPill: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  tipCategoryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.text,
  },
  tipTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  tipFullText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  readMore: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.orange,
    marginTop: spacing.sm,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.text,
  },
  modalClose: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.textMuted,
    padding: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalSection: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  quickItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  quickItemName: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  quickItemCal: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    color: colors.orange,
  },
  manualInput: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  manualRow: {
    flexDirection: 'row',
  },
});
