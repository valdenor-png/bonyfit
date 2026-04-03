import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { PaymentMethod } from '../../types/payment';

interface Props {
  navigation: any;
  selectedPlan: { id: string; price: number } | null;
  onNext: (method: PaymentMethod) => void;
}

const PAYMENT_OPTIONS: { method: PaymentMethod; icon: string; name: string; desc: string }[] = [
  { method: 'PIX', icon: '⚡', name: 'PIX', desc: 'Aprovação instantânea' },
  { method: 'CREDIT_CARD', icon: '💳', name: 'Cartão de crédito', desc: 'Parcelamento automático' },
  { method: 'BOLETO', icon: '📄', name: 'Boleto bancário', desc: 'Compensação em até 3 dias úteis' },
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

export default function PagamentoScreen({ navigation, selectedPlan, onNext }: Props) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: '',
  });

  const price = selectedPlan?.price ?? 89.9;

  const canProceed = selected === 'PIX' || selected === 'BOLETO' ||
    (selected === 'CREDIT_CARD' &&
      cardData.number.replace(/\D/g, '').length >= 13 &&
      cardData.expiry.length >= 5 &&
      cardData.cvv.length >= 3 &&
      cardData.holder.length >= 3);

  const handleContinue = () => {
    if (selected && canProceed) {
      onNext(selected);
      navigation.navigate('Facial');
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={3} total={6} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Pagamento</Text>
        <Text style={styles.subtitle}>Escolha como deseja pagar</Text>

        <View style={styles.options}>
          {PAYMENT_OPTIONS.map((opt) => {
            const isSelected = selected === opt.method;
            return (
              <TouchableOpacity
                key={opt.method}
                style={[styles.optionCard, isSelected && styles.optionSelected]}
                onPress={() => setSelected(opt.method)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionIcon}>{opt.icon}</Text>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{opt.name}</Text>
                  <Text style={styles.optionDesc}>{opt.desc}</Text>
                </View>
                {isSelected && (
                  <View style={styles.radio}>
                    <View style={styles.radioDot} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selected === 'PIX' && (
          <View style={styles.pixContainer}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>QR Code</Text>
            </View>
            <Text style={styles.pixValue}>
              R$ {price.toFixed(2).replace('.', ',')}
            </Text>
            <Text style={styles.pixHint}>Escaneie o QR Code ou copie o código</Text>
          </View>
        )}

        {selected === 'CREDIT_CARD' && (
          <View style={styles.cardFields}>
            <Input
              label="Número do cartão"
              value={cardData.number}
              onChangeText={(number) => setCardData((d) => ({ ...d, number }))}
              placeholder="0000 0000 0000 0000"
              keyboardType="numeric"
            />
            <View style={styles.cardRow}>
              <View style={styles.cardHalf}>
                <Input
                  label="Validade"
                  value={cardData.expiry}
                  onChangeText={(expiry) => setCardData((d) => ({ ...d, expiry }))}
                  placeholder="MM/AA"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.cardHalf}>
                <Input
                  label="CVV"
                  value={cardData.cvv}
                  onChangeText={(cvv) => setCardData((d) => ({ ...d, cvv }))}
                  placeholder="000"
                  keyboardType="numeric"
                  secureTextEntry
                />
              </View>
            </View>
            <Input
              label="Nome no cartão"
              value={cardData.holder}
              onChangeText={(holder) => setCardData((d) => ({ ...d, holder }))}
              placeholder="Como está no cartão"
              autoCapitalize="characters"
            />
          </View>
        )}

        <View style={styles.buttons}>
          <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} />
          <Button
            title={selected === 'PIX' ? 'Gerar PIX' : `Pagar R$ ${price.toFixed(2).replace('.', ',')}`}
            onPress={handleContinue}
            disabled={!canProceed}
          />
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
  options: { gap: spacing.md, marginBottom: spacing.xxl },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.elevated,
    gap: spacing.md,
  },
  optionSelected: {
    backgroundColor: 'rgba(242, 101, 34, 0.1)',
    borderColor: 'rgba(242, 101, 34, 0.4)',
    borderWidth: 1.5,
  },
  optionIcon: { fontSize: 24 },
  optionInfo: { flex: 1 },
  optionName: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text },
  optionDesc: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.orange,
  },
  pixContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  qrPlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  qrText: { fontSize: 14, fontFamily: fonts.body, color: colors.textMuted },
  pixValue: { fontSize: 20, fontFamily: fonts.numbersBold, color: colors.orange, marginBottom: spacing.sm },
  pixHint: { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  cardFields: { gap: spacing.lg, marginBottom: spacing.xxl },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  cardHalf: { flex: 1 },
  buttons: { gap: spacing.md },
});
