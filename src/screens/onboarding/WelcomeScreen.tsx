import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { colors, fonts, spacing, radius } from '../../tokens';
import Skull from '../../components/Skull';
import Button from '../../components/Button';

type Nav = StackNavigationProp<AuthStackParamList, 'Welcome'>;

const features = [
  { emoji: '\uD83C\uDFAE', text: 'Gamifica\u00e7\u00e3o: ganhe pontos a cada treino' },
  { emoji: '\uD83C\uDFC6', text: 'Ranking: dispute com outros alunos' },
  { emoji: '\uD83D\uDCF1', text: 'Matr\u00edcula digital 100% pelo app' },
  { emoji: '\uD83E\uDD1D', text: 'Comunidade: conecte-se com o squad' },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <Skull size={80} />
          <Text style={styles.title}>BONY FIT</Text>
          <Text style={styles.subtitle}>Treino pesado. Pontos reais.</Text>
        </View>

        <View style={styles.features}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.emoji}>{f.emoji}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottom}>
          <Button
            title="Criar conta"
            onPress={() => navigation.navigate('DadosPessoais')}
          />
          <Button
            title="J\u00e1 tenho conta"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 32,
  },
  logoArea: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 36,
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
  },
  features: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    gap: 12,
  },
  emoji: {
    fontSize: 22,
  },
  featureText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  bottom: {
    gap: 12,
    alignItems: 'center',
  },
});
