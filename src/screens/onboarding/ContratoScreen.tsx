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

interface Props {
  navigation: any;
  onFinish: () => void;
}

const CONTRACT_TEXT = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS — BONY FIT ACADEMIAS

CLÁUSULA 1 — DO OBJETO
O presente contrato tem por objeto a prestação de serviços de atividades físicas na(s) unidade(s) da rede Bony Fit Academias, conforme o plano escolhido pelo CONTRATANTE.

CLÁUSULA 2 — DA VIGÊNCIA
O contrato vigorará pelo período correspondente ao plano selecionado, iniciando-se na data de ativação do acesso, com renovação automática ao término de cada ciclo.

CLÁUSULA 3 — DA COBRANÇA RECORRENTE
O CONTRATANTE autoriza a cobrança recorrente no método de pagamento escolhido (PIX, cartão de crédito ou boleto bancário). O valor será debitado automaticamente a cada ciclo de faturamento.

CLÁUSULA 4 — DO USO DE IMAGEM FACIAL
O CONTRATANTE autoriza a captura e armazenamento de sua imagem facial para fins exclusivos de controle de acesso via catraca de reconhecimento facial. A imagem será armazenada de forma segura e não será compartilhada com terceiros.

CLÁUSULA 5 — DO ACESSO
O acesso às dependências da academia será realizado exclusivamente mediante validação facial na catraca. O CONTRATANTE se compromete a manter seus dados faciais atualizados.

CLÁUSULA 6 — DO CANCELAMENTO
O cancelamento poderá ser solicitado a qualquer momento pelo aplicativo ou presencialmente. O acesso permanecerá ativo até o final do período já pago. Não há reembolso proporcional.

CLÁUSULA 7 — DAS RESPONSABILIDADES
O CONTRATANTE declara estar apto à prática de atividades físicas e isenta a Bony Fit de responsabilidade por lesões decorrentes de uso inadequado dos equipamentos.

CLÁUSULA 8 — DA GAMIFICAÇÃO
O sistema de pontos e ranking é de caráter motivacional. Os pontos não possuem valor monetário e não podem ser trocados por produtos ou serviços.

CLÁUSULA 9 — DO FORO
Fica eleito o foro da comarca de Castanhal — PA para dirimir quaisquer questões relativas ao presente contrato.`;

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

export default function ContratoScreen({ navigation, onFinish }: Props) {
  const [accepted, setAccepted] = useState(false);

  return (
    <View style={styles.container}>
      <ProgressBar step={5} total={6} />
      <View style={styles.content}>
        <Text style={styles.title}>Contrato digital</Text>
        <Text style={styles.subtitle}>
          Leia os termos do contrato antes de finalizar
        </Text>

        <View style={styles.contractBox}>
          <ScrollView
            style={styles.contractScroll}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.contractText}>{CONTRACT_TEXT}</Text>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            Li e aceito os termos do contrato
          </Text>
        </TouchableOpacity>

        <View style={styles.buttons}>
          <Button
            title="Voltar"
            variant="outline"
            onPress={() => navigation.goBack()}
          />
          <Button
            title="Finalizar matrícula"
            onPress={onFinish}
            disabled={!accepted}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: { fontSize: 22, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary, marginBottom: spacing.xl },
  contractBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    height: 220,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  contractScroll: {
    padding: spacing.lg,
  },
  contractText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  checkboxChecked: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  checkboxMark: { fontSize: 14, color: colors.text, fontFamily: fonts.bodyBold },
  checkboxLabel: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.text, flex: 1 },
  buttons: { gap: spacing.md },
});
