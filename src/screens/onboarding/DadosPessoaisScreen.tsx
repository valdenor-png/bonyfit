import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors, fonts, spacing, radius } from '../../tokens';
import { useOnboardingStore } from '../../stores/onboardingStore';
import Button from '../../components/Button';
import ProgressBar from './ProgressBar';
import CampoIndicacao from '../../components/onboarding/CampoIndicacao';

type Nav = StackNavigationProp<AuthStackParamList, 'DadosPessoais'>;

function maskCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskDate(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: '', color: colors.elevated };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Fraca', color: colors.danger };
  if (score <= 2) return { level: 2, label: 'M\u00e9dia', color: colors.orange };
  return { level: 3, label: 'Forte', color: colors.success };
}

function parseAge(dateStr: string): number | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3 || parts[2].length !== 4) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const birth = new Date(year, month, day);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function DadosPessoaisScreen() {
  const navigation = useNavigation<Nav>();
  const store = useOnboardingStore();

  const [nome, setNome] = useState(store.nome);
  const [cpf, setCpf] = useState(store.cpf);
  const [nascimento, setNascimento] = useState(store.nascimento);
  const [telefone, setTelefone] = useState(store.telefone);
  const [email, setEmail] = useState(store.email);
  const [senha, setSenha] = useState(store.senha);
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [indicadorId, setIndicadorId] = useState<string | null>(null);

  const strength = getPasswordStrength(senha);
  const cpfDigits = cpf.replace(/\D/g, '');
  const phoneDigits = telefone.replace(/\D/g, '');

  const canContinue =
    nome.trim().length > 0 &&
    cpfDigits.length === 11 &&
    nascimento.length === 10 &&
    phoneDigits.length >= 10 &&
    email.includes('@') &&
    senha.length >= 8 &&
    senha === confirmarSenha;

  const handleContinue = () => {
    const age = parseAge(nascimento);
    if (age !== null && age < 16) {
      Alert.alert('Idade inv\u00e1lida', 'Menores de 16 anos devem fazer cadastro presencial.');
      return;
    }
    store.setDadosPessoais({ nome, cpf, nascimento, telefone, email, senha });
    navigation.navigate('QuestionarioSaude');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar step={1} total={6} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Dados pessoais</Text>

          <View style={styles.form}>
            <Field label="Nome completo *" value={nome} onChangeText={setNome} />
            <Field
              label="CPF *"
              value={cpf}
              onChangeText={(t) => setCpf(maskCPF(t))}
              keyboardType="numeric"
              maxLength={14}
              placeholder="000.000.000-00"
            />
            <Field
              label="Data de nascimento *"
              value={nascimento}
              onChangeText={(t) => setNascimento(maskDate(t))}
              keyboardType="numeric"
              maxLength={10}
              placeholder="DD/MM/AAAA"
            />
            <Field
              label="Telefone *"
              value={telefone}
              onChangeText={(t) => setTelefone(maskPhone(t))}
              keyboardType="numeric"
              maxLength={15}
              placeholder="(00) 00000-0000"
            />
            <Field
              label="Email *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="seu@email.com"
            />
            <View style={styles.field}>
              <Text style={styles.label}>Senha * (min. 8 caracteres)</Text>
              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                placeholder="Sua senha"
                placeholderTextColor={colors.textMuted}
              />
              {senha.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(strength.level / 3) * 100}%`,
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>
              )}
            </View>
            <Field
              label="Confirmar senha *"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
              placeholder="Repita a senha"
            />
            {confirmarSenha.length > 0 && senha !== confirmarSenha && (
              <Text style={styles.errorText}>As senhas n\u00e3o coincidem</Text>
            )}

            <CampoIndicacao onIndicadorSelecionado={setIndicadorId} />
          </View>

          <View style={styles.buttons}>
            <Button title="Continuar" onPress={handleContinue} disabled={!canContinue} />
            <Button title="Voltar" variant="outline" onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  maxLength?: number;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  placeholder,
  secureTextEntry,
  autoCapitalize,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    gap: 24,
  },
  title: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 24,
    color: colors.text,
  },
  form: {
    gap: 14,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.elevated,
    borderRadius: 2,
  },
  strengthFill: {
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
    marginTop: -8,
  },
  buttons: {
    gap: 12,
    marginTop: 8,
  },
});
