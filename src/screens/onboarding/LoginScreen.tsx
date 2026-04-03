import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Skull from '../../components/Skull';
import { supabase } from '../../services/supabase';

interface Props {
  navigation: any;
  onLoginSuccess: () => void;
}

export default function LoginScreen({ navigation, onLoginSuccess }: Props) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const cpfClean = cpf.replace(/\D/g, '');
  const isValid = cpfClean.length === 11 && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      // Buscar email pelo CPF na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('cpf', cpfClean)
        .single();

      if (userError || !userData) {
        Alert.alert('Erro', 'CPF não encontrado. Verifique ou crie uma conta.');
        setLoading(false);
        return;
      }

      // Login com email + senha
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });

      if (authError) {
        Alert.alert('Erro', 'Senha incorreta. Tente novamente.');
        setLoading(false);
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <Skull size={50} color={colors.orange} />
            <Text style={styles.title}>Entrar</Text>
            <Text style={styles.subtitle}>
              Acesse sua conta Bony Fit
            </Text>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <Input
              label="CPF"
              value={cpf}
              onChangeText={setCpf}
              placeholder="000.000.000-00"
              mask="cpf"
              keyboardType="numeric"
            />
            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Sua senha"
              secureTextEntry
            />
          </View>

          {/* Login button */}
          <Button
            title={loading ? 'Entrando...' : 'Entrar'}
            onPress={handleLogin}
            disabled={!isValid || loading}
            loading={loading}
          />

          {/* Back */}
          <View style={styles.backRow}>
            <Button
              title="Não tenho conta — Criar agora"
              variant="ghost"
              onPress={() => navigation.navigate('Dados')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 40,
    gap: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  fields: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  backRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
