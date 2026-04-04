import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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

type Nav = StackNavigationProp<AuthStackParamList, 'QuestionarioSaude'>;

const PERGUNTAS = [
  'Algum m\u00e9dico j\u00e1 disse que voc\u00ea possui algum problema de cora\u00e7\u00e3o?',
  'Voc\u00ea sente dores no peito quando pratica atividade f\u00edsica?',
  'No \u00faltimo m\u00eas, voc\u00ea sentiu dores no peito sem estar praticando atividade?',
  'Voc\u00ea apresenta desequil\u00edbrio devido \u00e0 tontura ou perda de consci\u00eancia?',
  'Voc\u00ea possui algum problema \u00f3sseo ou articular que poderia piorar com exerc\u00edcio?',
  'Voc\u00ea toma medicamento para press\u00e3o arterial ou cora\u00e7\u00e3o?',
  'Sabe de alguma outra raz\u00e3o pela qual n\u00e3o deveria praticar atividade f\u00edsica?',
];

export default function QuestionarioSaudeScreen() {
  const navigation = useNavigation<Nav>();
  const { respostasParQ, setRespostaParQ, requerAtestado } = useOnboardingStore();

  const [alergias, setAlergias] = useState(
    (respostasParQ['alergias'] as string) || ''
  );
  const [medicamentos, setMedicamentos] = useState(
    (respostasParQ['medicamentos'] as string) || ''
  );
  const [lesoes, setLesoes] = useState(
    (respostasParQ['lesoes'] as string) || ''
  );
  const [contatoNome, setContatoNome] = useState(
    (respostasParQ['contatoNome'] as string) || ''
  );
  const [contatoTel, setContatoTel] = useState(
    (respostasParQ['contatoTel'] as string) || ''
  );

  const allAnswered = PERGUNTAS.every(
    (_, i) => typeof respostasParQ[`q${i}`] === 'boolean'
  );

  const handleContinue = () => {
    setRespostaParQ('alergias', alergias);
    setRespostaParQ('medicamentos', medicamentos);
    setRespostaParQ('lesoes', lesoes);
    setRespostaParQ('contatoNome', contatoNome);
    setRespostaParQ('contatoTel', contatoTel);
    navigation.navigate('ContratoDigital');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar step={2} total={6} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Question\u00e1rio de Sa\u00fade</Text>
        <Text style={styles.subtitle}>
          PAR-Q — Prontid\u00e3o para Atividade F\u00edsica
        </Text>

        {PERGUNTAS.map((pergunta, i) => {
          const key = `q${i}`;
          const answer = respostasParQ[key] as boolean | undefined;
          return (
            <View key={i} style={styles.questionCard}>
              <Text style={styles.questionText}>
                {i + 1}. {pergunta}
              </Text>
              <View style={styles.answerRow}>
                <TouchableOpacity
                  style={[
                    styles.answerBtn,
                    answer === true && styles.answerBtnActive,
                  ]}
                  onPress={() => setRespostaParQ(key, true)}
                >
                  <Text
                    style={[
                      styles.answerText,
                      answer === true && styles.answerTextActive,
                    ]}
                  >
                    Sim
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.answerBtn,
                    answer === false && styles.answerBtnNo,
                  ]}
                  onPress={() => setRespostaParQ(key, false)}
                >
                  <Text
                    style={[
                      styles.answerText,
                      answer === false && styles.answerTextActive,
                    ]}
                  >
                    N\u00e3o
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {requerAtestado && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              Recomendamos consulta m\u00e9dica antes de iniciar as atividades
              f\u00edsicas.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Informa\u00e7\u00f5es adicionais</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Alergias</Text>
          <TextInput
            style={styles.input}
            value={alergias}
            onChangeText={setAlergias}
            placeholder="Nenhuma"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Medicamentos em uso</Text>
          <TextInput
            style={styles.input}
            value={medicamentos}
            onChangeText={setMedicamentos}
            placeholder="Nenhum"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Les\u00f5es pr\u00e9vias</Text>
          <TextInput
            style={styles.input}
            value={lesoes}
            onChangeText={setLesoes}
            placeholder="Nenhuma"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <Text style={styles.sectionTitle}>Contato de emerg\u00eancia</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={contatoNome}
            onChangeText={setContatoNome}
            placeholder="Nome do contato"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={contatoTel}
            onChangeText={setContatoTel}
            placeholder="(00) 00000-0000"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.buttons}>
          <Button
            title="Continuar"
            onPress={handleContinue}
            disabled={!allAnswered}
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
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  questionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 12,
  },
  questionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  answerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  answerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.elevated,
    alignItems: 'center',
  },
  answerBtnActive: {
    backgroundColor: colors.orange,
  },
  answerBtnNo: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  answerText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  answerTextActive: {
    color: colors.text,
  },
  warningCard: {
    backgroundColor: 'rgba(242, 101, 34, 0.1)',
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  warningText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.orange,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.elevated,
  },
  buttons: {
    gap: 12,
    marginTop: 8,
  },
});
