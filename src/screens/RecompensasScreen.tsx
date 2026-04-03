import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';

// ─── TYPES ──────────────────────────────────────────────
interface Reward {
  id: string;
  icon: string;
  title: string;
  description: string;
  pointsCost: number;
}

interface Redemption {
  id: string;
  title: string;
  date: string;
  status: 'Pendente' | 'Entregue';
}

// ─── MOCK DATA ──────────────────────────────────────────
const USER_POINTS = 7500;

const AVAILABLE_REWARDS: Reward[] = [
  {
    id: '1',
    icon: '%',
    title: '10% desconto mensalidade',
    description: 'Desconto aplicado na próxima fatura do seu plano.',
    pointsCost: 5000,
  },
  {
    id: '2',
    icon: 'T',
    title: 'Camiseta Bony Fit',
    description: 'Camiseta dry-fit exclusiva Bony Fit. Escolha o tamanho na recepção.',
    pointsCost: 8000,
  },
  {
    id: '3',
    icon: 'P',
    title: '1 sessão com Personal',
    description: 'Uma sessão de 60 minutos com personal trainer da academia.',
    pointsCost: 10000,
  },
  {
    id: '4',
    icon: 'S',
    title: '15% desconto suplementos parceiro',
    description: 'Cupom de desconto válido na loja parceira de suplementos.',
    pointsCost: 3000,
  },
  {
    id: '5',
    icon: 'Q',
    title: 'Squeeze Bony Fit exclusivo',
    description: 'Squeeze de 750ml com design exclusivo Bony Fit. Retire na recepção.',
    pointsCost: 6000,
  },
];

const MOCK_REDEMPTIONS: Redemption[] = [
  {
    id: 'r1',
    title: '15% desconto suplementos parceiro',
    date: '15/03/2026',
    status: 'Entregue',
  },
  {
    id: 'r2',
    title: '10% desconto mensalidade',
    date: '28/03/2026',
    status: 'Pendente',
  },
];

// ─── COMPONENT ──────────────────────────────────────────
export default function RecompensasScreen() {
  const [points, setPoints] = useState(USER_POINTS);
  const [redemptions, setRedemptions] = useState<Redemption[]>(MOCK_REDEMPTIONS);

  const handleRedeem = (reward: Reward) => {
    if (points < reward.pointsCost) return;

    Alert.alert(
      'Confirmar resgate',
      `Deseja resgatar "${reward.title}" por ${reward.pointsCost.toLocaleString('pt-BR')} pontos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resgatar',
          onPress: () => {
            setPoints((prev) => prev - reward.pointsCost);
            setRedemptions((prev) => [
              {
                id: `r${Date.now()}`,
                title: reward.title,
                date: new Date().toLocaleDateString('pt-BR'),
                status: 'Pendente',
              },
              ...prev,
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.header}>Recompensas</Text>

        {/* Points balance card */}
        <View style={styles.balanceCardWrapper}>
          <LinearGradient
            colors={[colors.orange, colors.orangeDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <Text style={styles.balanceNumber}>
              {points.toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.balanceLabel}>pontos disponíveis</Text>
          </LinearGradient>
        </View>

        {/* Available rewards */}
        <Text style={styles.sectionTitle}>Recompensas disponíveis</Text>

        {AVAILABLE_REWARDS.map((reward) => {
          const canRedeem = points >= reward.pointsCost;
          const missing = reward.pointsCost - points;

          return (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardIcon}>
                <Text style={styles.rewardIconText}>{reward.icon}</Text>
              </View>

              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{reward.title}</Text>
                <Text style={styles.rewardDescription}>
                  {reward.description}
                </Text>
                <Text style={styles.rewardPoints}>
                  {reward.pointsCost.toLocaleString('pt-BR')} pts
                </Text>
              </View>

              <View style={styles.rewardAction}>
                <TouchableOpacity
                  style={[
                    styles.redeemButton,
                    !canRedeem && styles.redeemButtonDisabled,
                  ]}
                  onPress={() => handleRedeem(reward)}
                  disabled={!canRedeem}
                >
                  <Text
                    style={[
                      styles.redeemButtonText,
                      !canRedeem && styles.redeemButtonTextDisabled,
                    ]}
                  >
                    Resgatar
                  </Text>
                </TouchableOpacity>
                {!canRedeem && (
                  <Text style={styles.missingPoints}>
                    Faltam {missing.toLocaleString('pt-BR')} pts
                  </Text>
                )}
              </View>
            </View>
          );
        })}

        {/* Past redemptions */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
          Meus resgates
        </Text>

        {redemptions.map((item) => (
          <View key={item.id} style={styles.redemptionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.redemptionTitle}>{item.title}</Text>
              <Text style={styles.redemptionDate}>{item.date}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === 'Entregue'
                      ? colors.success + '22'
                      : colors.warning + '22',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === 'Entregue'
                        ? colors.success
                        : colors.warning,
                  },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Balance card
  balanceCardWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  balanceCard: {
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  balanceNumber: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 48,
    color: colors.text,
  },
  balanceLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
  },

  // Section
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  // Reward card
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rewardIconText: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.orange,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  rewardDescription: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  rewardPoints: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    color: colors.orange,
    marginTop: spacing.xs,
  },
  rewardAction: {
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  redeemButton: {
    backgroundColor: colors.orange,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.elevated,
  },
  redeemButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.text,
  },
  redeemButtonTextDisabled: {
    color: colors.textMuted,
  },
  missingPoints: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.danger,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Redemptions
  redemptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  redemptionTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  redemptionDate: {
    fontFamily: fonts.numbers,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  statusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
});
