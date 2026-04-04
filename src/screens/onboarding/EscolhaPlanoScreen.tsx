import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors, fonts, spacing, radius } from '../../tokens';
import { useOnboardingStore } from '../../stores/onboardingStore';
import Button from '../../components/Button';
import ProgressBar from './ProgressBar';

type Nav = StackNavigationProp<AuthStackParamList, 'EscolhaPlano'>;

interface Plano {
  id: string;
  name: string;
  price: string;
  duration: string;
  badge?: string;
  benefits: string[];
}

const PLANOS: Plano[] = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: '89,90',
    duration: '/m\u00eas',
    benefits: [
      'Acesso a todas as \u00e1reas',
      'App completo',
      'Sem fidelidade',
    ],
  },
  {
    id: 'trimestral',
    name: 'Trimestral',
    price: '69,90',
    duration: '/m\u00eas',
    badge: 'MAIS POPULAR',
    benefits: [
      'Acesso a todas as \u00e1reas',
      'App completo',
      'Economia de 22%',
      'Avalia\u00e7\u00e3o f\u00edsica inclusa',
    ],
  },
  {
    id: 'semestral',
    name: 'Semestral',
    price: '59,90',
    duration: '/m\u00eas',
    benefits: [
      'Acesso a todas as \u00e1reas',
      'App completo',
      'Economia de 33%',
      'Avalia\u00e7\u00e3o f\u00edsica inclusa',
      '1 aula com personal',
    ],
  },
  {
    id: 'anual',
    name: 'Anual',
    price: '49,90',
    duration: '/m\u00eas',
    badge: 'MAIOR ECONOMIA',
    benefits: [
      'Acesso a todas as \u00e1reas',
      'App completo',
      'Economia de 44%',
      'Avalia\u00e7\u00e3o f\u00edsica inclusa',
      '2 aulas com personal',
      'Camiseta Bony Fit',
    ],
  },
];

const PAYMENT_METHODS = [
  { id: 'pix', label: '\u26a1 PIX' },
  { id: 'cartao', label: '\uD83D\uDCB3 Cart\u00e3o' },
  { id: 'boleto', label: '\uD83D\uDCC4 Boleto' },
];

export default function EscolhaPlanoScreen() {
  const navigation = useNavigation<Nav>();
  const { planoSelecionadoId, metodoPagamento, setPlano } =
    useOnboardingStore();

  const [selectedPlan, setSelectedPlan] = useState(planoSelecionadoId || '');
  const [selectedPayment, setSelectedPayment] = useState(
    metodoPagamento || ''
  );

  const canContinue = selectedPlan !== '' && selectedPayment !== '';

  const handleContinue = () => {
    setPlano(selectedPlan, selectedPayment);
    navigation.navigate('Confirmacao');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar step={5} total={6} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Escolha seu plano</Text>

        {PLANOS.map((plano) => {
          const isSelected = selectedPlan === plano.id;
          return (
            <TouchableOpacity
              key={plano.id}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              onPress={() => setSelectedPlan(plano.id)}
              activeOpacity={0.7}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plano.name}</Text>
                {plano.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{plano.badge}</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceCurrency}>R$</Text>
                <Text style={styles.priceValue}>{plano.price}</Text>
                <Text style={styles.priceDuration}>{plano.duration}</Text>
              </View>
              <View style={styles.benefitsList}>
                {plano.benefits.map((b, i) => (
                  <Text key={i} style={styles.benefitItem}>
                    {'\u2713'} {b}
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.sectionTitle}>Forma de pagamento</Text>

        <View style={styles.paymentRow}>
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedPayment === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  isSelected && styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedPayment(method.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radio,
                    isSelected && styles.radioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text
                  style={[
                    styles.paymentLabel,
                    isSelected && { color: colors.text },
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.buttons}>
          <Button
            title="Continuar"
            onPress={handleContinue}
            disabled={!canContinue}
          />
          <Button
            title="Voltar"
            variant="outline"
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 24,
    color: colors.text,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 10,
  },
  planCardSelected: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(242, 101, 34, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.orange,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.text,
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceCurrency: {
    fontFamily: fonts.numbersBold,
    fontSize: 16,
    color: colors.textSecondary,
  },
  priceValue: {
    fontFamily: fonts.numbersBold,
    fontSize: 32,
    color: colors.text,
  },
  priceDuration: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
  },
  paymentRow: {
    gap: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: colors.orange,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.orange,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.orange,
  },
  paymentLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  buttons: {
    gap: 12,
    marginTop: 8,
  },
});
