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
  mensal: 'Mensal — R$ 89,90/mês',
  trimestral: 'Trimestral — R$ 69,90/mês',
  semestral: 'Semestral — R$ 59,90/mês',
  anual: 'Anual — R$ 49,90/mês',
};

const PAYMENT_NAMES: Record<string, string> = {
  pix: 'PIX',
  cartao: 'Cartão de crédito',
  boleto: 'Boleto bancário',
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
      // 1. Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: store.email,
        password: store.senha,
        options: {
          data: {
            name: store.nome,
            cpf: store.cpf.replace(/\D/g, ''),
          },
        },
      });

      if (authError) {
        Alert.alert('Erro ao criar conta', authError.message);
        return;
      }

      if (!authData.user) {
        Alert.alert('Erro', 'Não foi possível criar a conta.');
        return;
      }

      const userId = authData.user.id;
      const cpfClean = store.cpf.replace(/\D/g, '');
      const phoneClean = store.telefone.replace(/\D/g, '');

      // 2. Atualizar perfil na tabela users (trigger já criou o básico)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: store.nome,
          cpf: cpfClean,
          phone: phoneClean,
          data_nascimento: store.nascimento || null,
          onboarding_completo: true,
          requer_atestado_medico: store.requerAtestado,
          contract_accepted: true,
          contract_accepted_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        // Se trigger não criou, tentar insert
        const { error: insertError } = await supabase.from('users').upsert({
          id: userId,
          name: store.nome,
          cpf: cpfClean,
          email: store.email,
          phone: phoneClean,
          data_nascimento: store.nascimento || null,
          onboarding_completo: true,
          requer_atestado_medico: store.requerAtestado,
          contract_accepted: true,
          contract_accepted_at: new Date().toISOString(),
          cargo_slug: 'aluno',
        });
        if (insertError) {
          console.warn('Erro ao salvar perfil:', insertError.message);
        }
      }

      // 3. Salvar questionário de saúde (PAR-Q)
      if (Object.keys(store.respostasParQ).length > 0) {
        await supabase.from('questionario_saude').insert({
          usuario_id: userId,
          respostas: store.respostasParQ,
          requer_atestado: store.requerAtestado,
          preenchido_por: 'app',
        }).then(({ error }) => {
          if (error) console.warn('Erro ao salvar PAR-Q:', error.message);
        });
      }

      // 4. Salvar contrato assinado
      if (store.assinaturaBase64) {
        // Upload assinatura no Storage
        let assinaturaUrl = '';
        try {
          const fileName = `assinaturas/${userId}/${Date.now()}.png`;
          const base64Data = store.assinaturaBase64.replace(/^data:image\/\w+;base64,/, '');
          const { error: uploadError } = await supabase.storage
            .from('contratos')
            .upload(fileName, decode(base64Data), {
              contentType: 'image/png',
              upsert: true,
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('contratos')
              .getPublicUrl(fileName);
            assinaturaUrl = urlData.publicUrl;
          }
        } catch {
          assinaturaUrl = 'assinatura_pendente';
        }

        await supabase.from('contratos').insert({
          usuario_id: userId,
          versao_contrato: store.versaoContrato || 'v1.0',
          texto_contrato: 'Contrato aceito via app',
          assinatura_url: assinaturaUrl || 'assinatura_local',
          metodo: 'app',
          assinado_em: new Date().toISOString(),
        }).then(({ error }) => {
          if (error) console.warn('Erro ao salvar contrato:', error.message);
        });
      }

      // 5. Criar assinatura de plano (buscar UUID pelo nome/slug)
      if (store.planoSelecionadoId) {
        const planoNomeMap: Record<string, string> = {
          mensal: 'Mensal',
          trimestral: 'Trimestral',
          semestral: 'Semestral',
          anual: 'Anual',
        };
        const planoNome = planoNomeMap[store.planoSelecionadoId] || store.planoSelecionadoId;

        const { data: planoData } = await supabase
          .from('planos')
          .select('id')
          .eq('nome', planoNome)
          .single();

        if (planoData) {
          await supabase.from('assinaturas').insert({
            usuario_id: userId,
            plano_id: planoData.id,
            status: 'pendente_pagamento',
            metodo_pagamento: store.metodoPagamento,
            data_inicio: new Date().toISOString().split('T')[0],
          }).then(({ error }) => {
            if (error) console.warn('Erro ao criar assinatura:', error.message);
          });
        }
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
            <Text style={styles.checkIcon}>✓</Text>
          </Animated.View>

          <Text style={styles.title}>Bem-vindo à Bony Fit!</Text>

          <View style={styles.summaryCard}>
            <SummaryRow label="Nome" value={store.nome} />
            <SummaryRow
              label="Plano"
              value={PLAN_NAMES[store.planoSelecionadoId || ''] || 'Não selecionado'}
            />
            <SummaryRow
              label="Pagamento"
              value={PAYMENT_NAMES[store.metodoPagamento || ''] || 'Não selecionado'}
            />
            <SummaryRow label="Contrato" value="Aceito e assinado" />
            <SummaryRow label="PAR-Q" value={store.requerAtestado ? 'Requer atestado' : 'OK'} />
          </View>

          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>Próximos passos</Text>
            <Text style={styles.nextStepsText}>
              Vá até a recepção para liberar seu acesso na catraca
            </Text>
          </View>
        </View>

        <Button title="Entrar no app" onPress={handleFinish} />
      </View>
    </SafeAreaView>
  );
}

// Helper to decode base64 to Uint8Array for Storage upload
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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
  safe: { flex: 1, backgroundColor: colors.bg },
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
  checkIcon: { fontSize: 40, color: colors.text, fontWeight: 'bold' },
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
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
  nextStepsTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.success },
  nextStepsText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
