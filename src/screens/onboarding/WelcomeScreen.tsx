import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import Button from '../../components/Button';
import Skull from '../../components/Skull';

interface Props {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.triangleWrapper}>
            <Skull size={80} color={colors.orange} />
          </View>
          <Text style={styles.title}>BONY FIT</Text>
          <Text style={styles.subtitle}>Treino pesado. Pontos reais.</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureRow icon="💪" text="Gamificação anti-fraude vinculada à catraca" />
          <FeatureRow icon="🏆" text="Ranking, streak e níveis entre alunos" />
          <FeatureRow icon="📱" text="Matrícula 100% digital sem recepcionista" />
          <FeatureRow icon="👥" text="Comunidade social entre 5 unidades" />
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <Button
          title="Criar conta"
          onPress={() => navigation.navigate('Dados')}
        />
        <Button
          title="Já tenho conta"
          variant="outline"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  triangleWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(242, 101, 34, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(242, 101, 34, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 36,
    fontFamily: fonts.numbersExtraBold,
    color: colors.text,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  features: {
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    flex: 1,
  },
  buttons: {
    gap: spacing.md,
  },
});
