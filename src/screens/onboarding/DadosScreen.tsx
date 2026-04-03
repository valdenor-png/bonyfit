import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import Input from '../../components/Input';
import Button from '../../components/Button';

interface Props {
  navigation: any;
  onNext: (data: DadosForm) => void;
}

export interface DadosForm {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  password: string;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            progressStyles.bar,
            { backgroundColor: i <= step ? colors.orange : colors.elevated },
          ]}
        />
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
});

export default function DadosScreen({ navigation, onNext }: Props) {
  const [form, setForm] = useState<DadosForm>({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    password: '',
  });

  const isValid =
    form.name.length >= 3 &&
    form.cpf.replace(/\D/g, '').length === 11 &&
    form.email.includes('@') &&
    form.phone.replace(/\D/g, '').length >= 10 &&
    form.password.length >= 6;

  const handleContinue = () => {
    if (isValid) {
      onNext(form);
      navigation.navigate('Unidade');
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={0} total={6} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Crie sua conta</Text>
          <Text style={styles.subtitle}>
            Preencha seus dados para começar a treinar na Bony Fit
          </Text>

          <View style={styles.fields}>
            <Input
              label="Nome completo"
              value={form.name}
              onChangeText={(name) => setForm((f) => ({ ...f, name }))}
              placeholder="Seu nome completo"
              autoCapitalize="words"
            />
            <Input
              label="CPF"
              value={form.cpf}
              onChangeText={(cpf) => setForm((f) => ({ ...f, cpf }))}
              placeholder="000.000.000-00"
              mask="cpf"
              keyboardType="numeric"
            />
            <Input
              label="E-mail"
              value={form.email}
              onChangeText={(email) => setForm((f) => ({ ...f, email }))}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Telefone"
              value={form.phone}
              onChangeText={(phone: string) => setForm((f) => ({ ...f, phone }))}
              placeholder="(00) 00000-0000"
              mask="phone"
              keyboardType="phone-pad"
            />
            <Input
              label="Senha"
              value={form.password}
              onChangeText={(password: string) => setForm((f) => ({ ...f, password }))}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
            />
            {form.password.length > 0 && form.password.length < 6 && (
              <Text style={{ fontSize: 11, fontFamily: fonts.body, color: colors.danger, marginTop: -8 }}>
                A senha deve ter no mínimo 6 caracteres
              </Text>
            )}
          </View>

          <Button
            title="Continuar"
            onPress={handleContinue}
            disabled={!isValid}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  fields: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
});
