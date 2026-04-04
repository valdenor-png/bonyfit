import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors, fonts, spacing, radius } from '../../tokens';
import { useOnboardingStore } from '../../stores/onboardingStore';
import Button from '../../components/Button';
import ProgressBar from './ProgressBar';

type Nav = StackNavigationProp<AuthStackParamList, 'AssinaturaDigital'>;

const MOCK_SIGNATURE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export default function AssinaturaDigitalScreen() {
  const navigation = useNavigation<Nav>();
  const { assinaturaBase64, setAssinatura } = useOnboardingStore();
  const [signed, setSigned] = useState(!!assinaturaBase64);

  const handleSign = () => {
    setSigned(true);
    setAssinatura(MOCK_SIGNATURE_BASE64);
  };

  const handleClear = () => {
    setSigned(false);
  };

  const handleContinue = () => {
    navigation.navigate('EscolhaPlano');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar step={4} total={6} />
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>Assinatura Digital</Text>
          <Text style={styles.subtitle}>Assine com o dedo abaixo</Text>
        </View>

        <TouchableOpacity
          style={styles.canvas}
          onPress={handleSign}
          activeOpacity={0.8}
        >
          {signed ? (
            <View style={styles.signedContent}>
              <Text style={styles.signedCheck}>{'\u2713'}</Text>
              <Text style={styles.signedText}>Assinatura registrada</Text>
            </View>
          ) : (
            <Text style={styles.canvasPlaceholder}>
              Toque aqui para assinar
            </Text>
          )}
        </TouchableOpacity>

        {signed && (
          <Button title="Limpar" variant="outline" onPress={handleClear} />
        )}

        <View style={{ flex: 1 }} />

        <View style={styles.buttons}>
          <Button
            title="Confirmar assinatura"
            onPress={handleContinue}
            disabled={!signed}
          />
          <Button
            title="Voltar"
            variant="outline"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </SafeAreaView>
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
    marginTop: 4,
  },
  canvas: {
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasPlaceholder: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textMuted,
  },
  signedContent: {
    alignItems: 'center',
    gap: 8,
  },
  signedCheck: {
    fontSize: 40,
    color: colors.success,
  },
  signedText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.success,
  },
  buttons: {
    gap: 12,
  },
});
