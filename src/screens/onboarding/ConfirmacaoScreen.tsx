import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { useOnboardingStore } from '../../stores/onboardingStore';
import Button from '../../components/Button';
import ProgressBar from './ProgressBar';
import { supabase } from '../../services/supabase';

interface Props {
  onComplete: () => void;
}

const PLAN_NAMES: Record<string, string> = {
  mensal: 'Mensal \u2014 R$ 89,90/m\u00eas',
  trimestral: 'Trimestral \u2014 R$ 69,90/m\u00eas',
  semestral: 'Semestral \u2014 R$ 59,90/m\u00eas',
  anual: 'Anual \u2014 R$ 49,90/m\u00eas',
};

const PAYMENT_NAMES: Record<string, string> = {
  pix: 'PIX',
  cartao: 'Cart\u00e3o de cr\u00e9dito',
  boleto: 'Boleto banc\u00e1rio',
};

export default function ConfirmacaoScreen({ onComplete }: Props) {
  const store = useOnboardingStore();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleFinish = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: store.email,
        password: store.senha,
      });

      if (authError) {
        Alert.alert('Erro ao criar conta', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Erro', 'N\u00e3o foi poss\u00edvel criar a conta.');
        return;
      }

      const cpfClean = store.cpf.replace(/\D/g, '');
      const phoneClean = store.telefone.replace(/\D/g, '');

      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: store.nome,
        cpf: cpfClean,
        email: store.email,
        phone: phoneClean,
        plan_id: store.planoSelecionadoId,
        contract_accepted: true,
        contract_accepted_at: new Date().toISOString(),
        signature_base64: store.assinaturaBase64,
        parq_responses: store.respostasParQ,
        parq_requires_medical: store.requerAtestado,
        payment_method: store.metodoPagamento,
        birth_date: store.nascimento,
      });

      if (insertError) {
        Alert.alert('Erro ao salvar dados', insertError.message);
        return;
      }

      store.reset();
      onComplete();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro inesperado ao criar conta.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar step={6} total={6} />
      <View style={styles.container}>
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.checkCircle,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.checkIcon}>{'\u2713'}</Text>
          </Animated.View>

          <Text style={styles.title}>Bem-vindo \u00e0 Bony Fit!</Text>

          <View style={styles.summaryCard}>
            <SummaryRow label="Nome" value={store.nome} />
            <SummaryRow
              label="Plano"
              value={
                PLAN_NAMES[store.planoSelecionadoId || ''] || 'N\u00e3o selecionado'
              }
            />
            <SummaryRow
              label="Pagamento"
              value={
                PAYMENT_NAMES[store.metodoPagamento || ''] || 'N\u00e3o selecionado'
              }
            />
            <SummaryRow label="Contrato" value="Aceito e assinado" />
          </View>

          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>Pr\u00f3ximos passos</Text>
            <Text style={styles.nextStepsText}>
              V\u00e1 at\u00e9 a recep\u00e7\u00e3o para liberar seu acesso na catraca
            </Text>
          </View>
        </View>

        <Button title="Entrar no app" onPress={handleFinish} />
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 40,
    color: colors.text,
    fontWeight: 'bold',
  },
  title: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '100%',
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  nextStepsCard: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '100%',
    gap: 8,
  },
  nextStepsTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.success,
  },
  nextStepsText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
