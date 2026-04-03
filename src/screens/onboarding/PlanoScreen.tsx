import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import Button from '../../components/Button';
import Pill from '../../components/Pill';

interface Props {
  navigation: any;
  onNext: (planId: string) => void;
}

const PLANS = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 89.9,
    period: 'mês',
    features: ['Treinos ilimitados', 'App completo', '1 unidade'],
    badge: null,
  },
  {
    id: 'trimestral',
    name: 'Trimestral',
    price: 69.9,
    period: 'mês',
    features: ['Treinos ilimitados', 'App completo', '1 unidade', 'Economia de R$ 60'],
    badge: 'MAIS POPULAR',
  },
  {
    id: 'anual',
    name: 'Anual',
    price: 49.9,
    period: 'mês',
    features: ['Treinos ilimitados', 'App completo', 'Todas as unidades', 'Economia de R$ 480'],
    badge: null,
  },
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[progressStyles.bar, { backgroundColor: i <= step ? colors.orange : colors.elevated }]}
        />
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  bar: { flex: 1, height: 3, borderRadius: 2 },
});

export default function PlanoScreen({ navigation, onNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      onNext(selected);
      navigation.navigate('Pagamento');
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={2} total={6} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Escolha seu plano</Text>
        <Text style={styles.subtitle}>Selecione o melhor plano para você</Text>

        <View style={styles.plans}>
          {PLANS.map((plan) => {
            const isSelected = selected === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelected(plan.id)}
                activeOpacity={0.7}
              >
                {plan.badge && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </Text>
                  <Text style={styles.period}>/{plan.period}</Text>
                </View>
                <View style={styles.features}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.buttons}>
          <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} />
          <Button title="Continuar" onPress={handleContinue} disabled={!selected} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: 22, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  plans: { gap: spacing.md, marginBottom: spacing.xxl },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.elevated,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: colors.orange,
    borderWidth: 2,
    backgroundColor: 'rgba(242, 101, 34, 0.1)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: -28,
    backgroundColor: colors.orange,
    paddingHorizontal: 30,
    paddingVertical: 4,
    transform: [{ rotate: '30deg' }],
  },
  badgeText: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.text },
  planName: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.lg },
  price: { fontSize: 28, fontFamily: fonts.numbersExtraBold, color: colors.text },
  period: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary, marginLeft: 2 },
  features: { gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureCheck: { fontSize: 14, color: colors.success },
  featureText: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary },
  buttons: { gap: spacing.md },
});
