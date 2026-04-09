import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors, fonts, spacing, radius } from '../../tokens';
import Skull from '../../components/Skull';
import ScreenBackground from '../../components/ScreenBackground';
import Button from '../../components/Button';
import { supabase } from '../../services/supabase';
import { checkRateLimit } from '../../lib/rateLimiter';

type Nav = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  onLoginSuccess: () => void;
}

function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // all same digit (000.000.000-00)
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[9]) !== check) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return parseInt(digits[10]) === check;
}

export default function LoginScreen({ onLoginSuccess }: Props) {
  const navigation = useNavigation<Nav>();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const [attempts, setAttempts] = useState(0);

  const handleLogin = async () => {
    const cpfClean = cpf.replace(/\D/g, '');
    if (!isValidCPF(cpfClean)) {
      Alert.alert('Erro', 'CPF inválido.');
      return;
    }
    if (!senha || senha.length < 6) {
      Alert.alert('Erro', 'Digite sua senha (mínimo 6 caracteres).');
      return;
    }

    // Rate limit local (5 tentativas) + server-side
    if (attempts >= 5) {
      Alert.alert('Muitas tentativas', 'Aguarde alguns minutos antes de tentar novamente.');
      return;
    }

    setLoading(true);
    try {
      const { allowed } = await checkRateLimit('login');
      if (!allowed) {
        Alert.alert('Muitas tentativas', 'Aguarde alguns minutos antes de tentar novamente.');
        setLoading(false);
        return;
      }

      // Mensagem genérica — não revela se CPF existe ou se senha está errada
      const GENERIC_ERROR = 'CPF ou senha incorretos.';

      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('cpf', cpfClean)
        .single();

      if (!userData) {
        setAttempts((a) => a + 1);
        Alert.alert('Erro', GENERIC_ERROR);
        setLoading(false);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: senha,
      });

      if (authError) {
        setAttempts((a) => a + 1);
        Alert.alert('Erro', GENERIC_ERROR);
        setLoading(false);
        return;
      }

      setAttempts(0);
      onLoginSuccess();
    } catch (err: any) {
      setAttempts((a) => a + 1);
      Alert.alert('Erro', 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenBackground opacity={0.12}>
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoArea}>
            <Skull size={60} />
            <Text style={styles.title}>Entrar</Text>
            <Text style={styles.subtitle}>Acesse sua conta Bony Fit</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>CPF</Text>
              <TextInput
                style={styles.input}
                value={cpf}
                onChangeText={(t) => setCpf(maskCPF(t))}
                placeholder="000.000.000-00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={14}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                placeholder="Sua senha"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              disabled={!cpf || !senha}
            />
          </View>

          <Text style={styles.infoText}>
            Não tem conta? Procure a recepção da sua unidade.
          </Text>
          <TouchableOpacity onPress={async () => {
            const cpfClean = cpf.replace(/\D/g, '');
            if (!isValidCPF(cpfClean)) {
              Alert.alert('CPF necessário', 'Digite um CPF válido para recuperar a senha.');
              return;
            }
            // Mensagem genérica — não revela se CPF existe
            const { data } = await supabase.from('users').select('email').eq('cpf', cpfClean).single();
            if (data?.email) {
              await supabase.auth.resetPasswordForEmail(data.email);
            }
            Alert.alert('Verifique seu e-mail', 'Se este CPF estiver cadastrado, você receberá um e-mail para redefinir sua senha.');
          }}>
            <Text style={styles.link}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: 32,
    justifyContent: 'center',
    gap: 40,
  },
  logoArea: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 28,
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  form: {
    gap: 16,
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
  infoText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  link: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.orange,
    textAlign: 'center',
    marginTop: 8,
  },
});
