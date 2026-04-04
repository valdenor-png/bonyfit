import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';

interface Props {
  navigation: any;
}

type IndicacaoStatus = 'confirmada' | 'pendente' | 'estornada';

interface Indicacao {
  id: string;
  nome: string;
  status: IndicacaoStatus;
  pontos?: number;
}

const MOCK_INDICACOES: Indicacao[] = [
  { id: '1', nome: 'Maria Santos', status: 'confirmada', pontos: 500 },
  { id: '2', nome: 'Pedro Lima', status: 'pendente' },
  { id: '3', nome: 'Ana Oliveira', status: 'confirmada', pontos: 500 },
  { id: '4', nome: 'Lucas Mendes', status: 'pendente' },
  { id: '5', nome: 'Julia Costa', status: 'estornada' },
];

const CODIGO = 'BONY-A3F8K2';
const SHARE_MESSAGE = `Tô treinando na Bony Fit e tá valendo muito a pena! 💪🔥 Vem treinar comigo: https://app.bonyfit.com/indicacao/${CODIGO}`;

function getInitials(name: string): string {
  const parts = name.split(' ');
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function StatusBadge({ status }: { status: IndicacaoStatus }) {
  const config = {
    confirmada: { label: '✅ Confirmada', color: colors.success },
    pendente: { label: '⏳ Pendente', color: colors.orange },
    estornada: { label: '❌ Estornada', color: colors.danger },
  };
  const { label, color } = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function IndicarAmigosScreen({ navigation }: Props) {
  const handleShare = () => {
    Alert.alert('Compartilhar via WhatsApp', SHARE_MESSAGE);
  };

  const handleCopyLink = () => {
    Alert.alert('Link copiado!', `https://app.bonyfit.com/indicacao/${CODIGO}`);
  };

  const handleCopyCode = () => {
    Alert.alert('Código copiado!', CODIGO);
  };

  const renderItem = ({ item }: { item: Indicacao }) => (
    <View style={styles.indicacaoCard}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{getInitials(item.nome)}</Text>
      </View>
      <View style={styles.indicacaoInfo}>
        <Text
          style={[
            styles.indicacaoNome,
            item.status === 'estornada' && styles.strikethrough,
          ]}
        >
          {item.nome}
        </Text>
        <StatusBadge status={item.status} />
      </View>
      {item.status === 'confirmada' && item.pontos && (
        <Text style={styles.pontosText}>+{item.pontos} pts</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={MOCK_INDICACOES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backBtn}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Indicar Amigos</Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Indicações</Text>
                <Text style={styles.statValue}>5</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Pontos ganhos</Text>
                <Text style={styles.statValue}>2.500</Text>
              </View>
            </View>

            {/* Seu código */}
            <View style={styles.codigoCard}>
              <Text style={styles.codigoLabel}>Seu código</Text>
              <View style={styles.codigoRow}>
                <Text style={styles.codigoText}>{CODIGO}</Text>
                <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
                  <Text style={styles.copyBtnText}>Copiar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action buttons */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={styles.shareBtnText}>📤 Compartilhar via WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={handleCopyLink} activeOpacity={0.7}>
              <Text style={styles.linkBtnText}>🔗 Copiar link</Text>
            </TouchableOpacity>

            {/* Section title */}
            <Text style={styles.sectionTitle}>Minhas indicações</Text>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backBtn: { fontSize: 32, color: colors.text, marginTop: -4 },
  headerTitle: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontFamily: fonts.numbersExtraBold,
    color: colors.text,
  },
  codigoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  codigoLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  codigoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codigoText: {
    fontSize: 24,
    fontFamily: fonts.numbersExtraBold,
    color: colors.orange,
  },
  copyBtn: {
    backgroundColor: colors.elevated,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  copyBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  shareBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shareBtnText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  linkBtn: {
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  linkBtnText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  indicacaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  indicacaoInfo: { flex: 1 },
  indicacaoNome: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: 4,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
  },
  pontosText: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.success,
  },
});
