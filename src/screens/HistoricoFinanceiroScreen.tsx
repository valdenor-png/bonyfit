import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../tokens';

// --------------- Mock data ---------------

const CURRENT_PLAN = {
  name: 'Plano Premium',
  price: 'R$ 149,90',
  status: 'Ativo',
  renewDate: '15/04/2026',
};

type PaymentStatus = 'Pago' | 'Pendente' | 'Vencido';
type PaymentMethod = 'PIX' | 'Cartão' | 'Boleto';

interface Payment {
  id: string;
  date: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
}

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', date: '15/03/2026', amount: 'R$ 149,90', method: 'PIX', status: 'Pago' },
  { id: '2', date: '15/02/2026', amount: 'R$ 149,90', method: 'Cartão', status: 'Pago' },
  { id: '3', date: '15/01/2026', amount: 'R$ 149,90', method: 'PIX', status: 'Pago' },
  { id: '4', date: '15/12/2025', amount: 'R$ 129,90', method: 'Boleto', status: 'Pago' },
  { id: '5', date: '15/11/2025', amount: 'R$ 129,90', method: 'Cartão', status: 'Pago' },
  { id: '6', date: '15/10/2025', amount: 'R$ 129,90', method: 'Boleto', status: 'Vencido' },
  { id: '7', date: '15/04/2026', amount: 'R$ 149,90', method: 'PIX', status: 'Pendente' },
];

const METHOD_ICONS: Record<PaymentMethod, keyof typeof Ionicons.glyphMap> = {
  PIX: 'qr-code-outline',
  'Cartão': 'card-outline',
  Boleto: 'document-text-outline',
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  Pago: colors.success,
  Pendente: colors.orange,
  Vencido: colors.danger,
};

export default function HistoricoFinanceiroScreen() {
  const navigation = useNavigation();

  const renderPayment = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentLeft}>
        <View style={styles.methodIcon}>
          <Ionicons
            name={METHOD_ICONS[item.method]}
            size={20}
            color={colors.text}
          />
        </View>
        <View>
          <Text style={styles.paymentDate}>{item.date}</Text>
          <Text style={styles.paymentMethod}>{item.method}</Text>
        </View>
      </View>
      <View style={styles.paymentRight}>
        <Text style={styles.paymentAmount}>{item.amount}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_COLORS[item.status] + '22' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS[item.status] },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico Financeiro</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Current plan card */}
      <LinearGradient
        colors={[colors.orange, colors.orangeDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.planCard}
      >
        <View style={styles.planTop}>
          <Text style={styles.planName}>{CURRENT_PLAN.name}</Text>
          <View style={styles.planStatusBadge}>
            <Text style={styles.planStatusText}>{CURRENT_PLAN.status}</Text>
          </View>
        </View>
        <Text style={styles.planPrice}>{CURRENT_PLAN.price}</Text>
        <Text style={styles.planRenew}>
          Renovação em {CURRENT_PLAN.renewDate}
        </Text>
      </LinearGradient>

      {/* Payment history */}
      <Text style={styles.sectionTitle}>Pagamentos</Text>

      <FlatList
        data={MOCK_PAYMENTS}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.text,
  },
  planCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  planName: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  planStatusBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  planStatusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#FFFFFF',
  },
  planPrice: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 28,
    color: '#FFFFFF',
  },
  planRenew: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  paymentCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDate: {
    fontFamily: fonts.numbers,
    fontSize: 14,
    color: colors.text,
  },
  paymentMethod: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontFamily: fonts.numbersBold,
    fontSize: 15,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
});
