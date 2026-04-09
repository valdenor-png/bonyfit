import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { useAuth } from '../../hooks/useAuth';
import { useSupervisorStore } from '../../stores/supervisorStore';
import type { SolicitacaoVip, PersonalComCarga, EscolhaRecente } from '../../types/supervisor';

// --- Mock data fallback ---
const MOCK_SOLICITACOES: SolicitacaoVip[] = [
  { id: '1', aluno: { id: 'a1', name: 'Lucas Mendes', avatar_url: null, level: 'intermediario' }, modo_escolha: 'salao', created_at: new Date(Date.now() - 600000).toISOString() },
  { id: '2', aluno: { id: 'a2', name: 'Carla Souza', avatar_url: null, level: 'iniciante' }, modo_escolha: 'salao', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '3', aluno: { id: 'a3', name: 'Rafael Lima', avatar_url: null, level: 'avancado' }, modo_escolha: 'salao', created_at: new Date(Date.now() - 3600000).toISOString() },
];

const MOCK_AVALIACOES = [
  { id: 'av1', status: 'solicitado', observacoes_aluno: 'Dor no joelho esquerdo', created_at: new Date(Date.now() - 7200000).toISOString(), aluno: { id: 'a1', name: 'Lucas Mendes', avatar_url: null }, personal: null },
  { id: 'av2', status: 'solicitado', observacoes_aluno: null, created_at: new Date(Date.now() - 14400000).toISOString(), aluno: { id: 'a4', name: 'Ana Clara', avatar_url: null }, personal: { id: 'p1', name: 'Pedro Coach' } },
];

const MOCK_PERSONAIS: PersonalComCarga[] = [
  { id: 'p1', name: 'Pedro Coach', avatar_url: null, bio: 'Especialista em hipertrofia', alunos_count: 12 },
  { id: 'p2', name: 'Julia Trainer', avatar_url: null, bio: 'Funcional e crossfit', alunos_count: 8 },
  { id: 'p3', name: 'Marcos Fit', avatar_url: null, bio: 'Emagrecimento', alunos_count: 15 },
  { id: 'p4', name: 'Fernanda Strong', avatar_url: null, bio: 'Powerlifting', alunos_count: 5 },
  { id: 'p5', name: 'Ricardo Move', avatar_url: null, bio: 'Mobilidade e reabilitacao', alunos_count: 18 },
];

const MOCK_ESCOLHAS: EscolhaRecente[] = [
  { id: 'e1', aluno_nome: 'Lucas Mendes', personal_nome: 'Pedro Coach', modo_escolha: 'direto', status: 'ativo', vinculado_em: new Date(Date.now() - 86400000).toISOString() },
  { id: 'e2', aluno_nome: 'Carla Souza', personal_nome: 'Julia Trainer', modo_escolha: 'salao', status: 'ativo', vinculado_em: new Date(Date.now() - 172800000).toISOString() },
  { id: 'e3', aluno_nome: 'Rafael Lima', personal_nome: null, modo_escolha: 'salao', status: 'pendente', vinculado_em: new Date(Date.now() - 259200000).toISOString() },
  { id: 'e4', aluno_nome: 'Ana Clara', personal_nome: 'Marcos Fit', modo_escolha: 'recepcao', status: 'ativo', vinculado_em: new Date(Date.now() - 345600000).toISOString() },
  { id: 'e5', aluno_nome: 'Bruno Dias', personal_nome: 'Fernanda Strong', modo_escolha: 'direto', status: 'ativo', vinculado_em: new Date(Date.now() - 432000000).toISOString() },
  { id: 'e6', aluno_nome: 'Mariana Costa', personal_nome: 'Ricardo Move', modo_escolha: 'salao', status: 'ativo', vinculado_em: new Date(Date.now() - 518400000).toISOString() },
  { id: 'e7', aluno_nome: 'Diego Santos', personal_nome: 'Pedro Coach', modo_escolha: 'direto', status: 'ativo', vinculado_em: new Date(Date.now() - 604800000).toISOString() },
  { id: 'e8', aluno_nome: 'Patricia Rocha', personal_nome: null, modo_escolha: 'salao', status: 'pendente', vinculado_em: new Date(Date.now() - 691200000).toISOString() },
  { id: 'e9', aluno_nome: 'Thiago Alves', personal_nome: 'Julia Trainer', modo_escolha: 'recepcao', status: 'ativo', vinculado_em: new Date(Date.now() - 777600000).toISOString() },
  { id: 'e10', aluno_nome: 'Camila Ferreira', personal_nome: 'Marcos Fit', modo_escolha: 'direto', status: 'ativo', vinculado_em: new Date(Date.now() - 864000000).toISOString() },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function Avatar({ uri, size = 40 }: { uri: string | null; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>?</Text>
    </View>
  );
}

export default function GestaoSalaoScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { solicitacoesPendentes, avaliacoesPendentes, personaisDaUnidade, escolhasRecentes, loading, fetchAll } = useSupervisorStore();

  const unitId = (user as any)?.unit_id;

  useEffect(() => {
    if (unitId) {
      fetchAll(unitId);
    }
  }, [unitId]);

  const solicitacoes = solicitacoesPendentes.length > 0 ? solicitacoesPendentes : MOCK_SOLICITACOES;
  const avaliacoes = avaliacoesPendentes.length > 0 ? avaliacoesPendentes : MOCK_AVALIACOES;
  const personais = personaisDaUnidade.length > 0 ? personaisDaUnidade : MOCK_PERSONAIS;
  const escolhas = escolhasRecentes.length > 0 ? escolhasRecentes : MOCK_ESCOLHAS;

  function handleAgendar(avaliacao: any) {
    Alert.alert(
      'Agendar Avaliacao',
      `Agendar avaliacao para ${avaliacao.aluno.name}?\n\nData: Amanha\nHorario: 10:00`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dataStr = tomorrow.toISOString().split('T')[0];
            const { agendarAvaliacao } = useSupervisorStore.getState();
            const personalId = avaliacao.personal?.id || personais[0]?.id || '';
            agendarAvaliacao(avaliacao.id, dataStr, '10:00', personalId, user?.id || '');
            Alert.alert('Sucesso', 'Avaliacao agendada com sucesso!');
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚡ Gestao do Salao</Text>
        <Text style={styles.headerSubtitle}>Unidade Principal</Text>
      </View>

      {/* Section 1: Solicitacoes VIP */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔔 SOLICITAÇÕES VIP</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{solicitacoes.length}</Text>
          </View>
        </View>

        {solicitacoes.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma solicitacao pendente</Text>
        ) : (
          <FlatList
            data={solicitacoes}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Avatar uri={item.aluno.avatar_url} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{item.aluno.name}</Text>
                  <Text style={styles.cardSub}>VIP · Quer um personal</Text>
                  <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('AtribuirPersonal', { solicitacaoId: item.id, alunoNome: item.aluno.name })}
                >
                  <Text style={styles.actionBtnText}>ATRIBUIR PERSONAL</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Section 2: Avaliacoes Pendentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📋 AVALIAÇÕES PENDENTES</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{avaliacoes.length}</Text>
          </View>
        </View>

        {avaliacoes.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma avaliacao pendente</Text>
        ) : (
          <FlatList
            data={avaliacoes}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Avatar uri={item.aluno.avatar_url} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{item.aluno.name}</Text>
                  {item.observacoes_aluno ? (
                    <Text style={styles.cardSub} numberOfLines={2}>{item.observacoes_aluno}</Text>
                  ) : (
                    <Text style={styles.cardSub}>Sem observacoes</Text>
                  )}
                  <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleAgendar(item)}>
                  <Text style={styles.actionBtnText}>AGENDAR</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Section 3: Personais da Unidade */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👥 PERSONAIS DA UNIDADE</Text>
        </View>

        <FlatList
          data={personais}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const barColor = item.alunos_count < 10 ? colors.success : item.alunos_count <= 15 ? colors.orange : colors.danger;
            const barWidth = Math.min((item.alunos_count / 20) * 100, 100);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('DetalhePersonal', { personalId: item.id, personalNome: item.name })}
              >
                <Avatar uri={item.avatar_url} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardSub}>{item.alunos_count} alunos</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.bar, { width: `${barWidth}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Section 4: Escolhas Recentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔄 ESCOLHAS RECENTES</Text>
        </View>

        <FlatList
          data={escolhas}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const statusColor = item.status === 'ativo' ? colors.success : colors.orange;
            return (
              <View style={styles.escolhaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.escolhaText}>
                    {item.aluno_nome} → {item.personal_nome || '???'} ({item.modo_escolha})
                  </Text>
                  <Text style={styles.cardTime}>{timeAgo(item.vinculado_em)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>
            );
          }}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xxl,
  },
  headerTitle: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 28,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.orange,
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeText: {
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    color: colors.text,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textMuted,
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  cardSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardTime: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  actionBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.text,
  },
  barBg: {
    height: 6,
    backgroundColor: colors.elevated,
    borderRadius: 3,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  escolhaRow: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  escolhaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: spacing.sm,
  },
  statusBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.text,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
