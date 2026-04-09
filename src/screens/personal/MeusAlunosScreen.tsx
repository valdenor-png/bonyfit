import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { useAuth } from '../../hooks/useAuth';
import { usePersonalStore } from '../../stores/personalStore';
import type { AlunoVinculado } from '../../types/workout';

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_ALUNOS: AlunoVinculado[] = [
  {
    id: '1',
    aluno: { id: 'a1', name: 'Lucas Martins', avatar_url: null, level: 'Intermediário', total_points: 2450 },
    plano_ativo: { id: 'p1', nome: 'Hipertrofia — Push/Pull/Legs' },
    ultimo_treino: '2026-04-04',
    vinculado_em: '2026-01-15',
  },
  {
    id: '2',
    aluno: { id: 'a2', name: 'Ana Souza', avatar_url: null, level: 'Iniciante', total_points: 580 },
    plano_ativo: { id: 'p2', nome: 'Emagrecimento Full Body' },
    ultimo_treino: '2026-04-01',
    vinculado_em: '2026-02-10',
  },
  {
    id: '3',
    aluno: { id: 'a3', name: 'Carlos Oliveira', avatar_url: null, level: 'Avançado', total_points: 8900 },
    plano_ativo: null,
    ultimo_treino: '2026-03-20',
    vinculado_em: '2025-11-01',
  },
  {
    id: '4',
    aluno: { id: 'a4', name: 'Mariana Costa', avatar_url: null, level: 'Intermediário', total_points: 3200 },
    plano_ativo: { id: 'p4', nome: 'Força — Upper/Lower' },
    ultimo_treino: null,
    vinculado_em: '2026-03-25',
  },
  {
    id: '5',
    aluno: { id: 'a5', name: 'Pedro Santos', avatar_url: null, level: 'Iniciante', total_points: 150 },
    plano_ativo: null,
    ultimo_treino: null,
    vinculado_em: '2026-04-01',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getLevelColor(level: string): string {
  switch (level) {
    case 'Iniciante':
      return colors.success;
    case 'Intermediário':
      return colors.warning;
    case 'Avançado':
      return colors.danger;
    default:
      return colors.textMuted;
  }
}

function diasAtras(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Nunca treinou';
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return 'Treinou hoje';
  if (diff === 1) return 'Há 1 dia';
  return `Há ${diff} dias`;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function MeusAlunosScreen({ navigation }: { navigation: any }) {
  const user = useAuth((s) => s.user);
  const alunos = usePersonalStore((s) => s.alunos);
  const loading = usePersonalStore((s) => s.loading);
  const fetchAlunos = usePersonalStore((s) => s.fetchAlunos);
  const [search, setSearch] = useState('');
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAlunos(user.id).then(() => {
        // If no data returned, use mock
        const current = usePersonalStore.getState().alunos;
        if (current.length === 0) setUseMock(true);
      });
    } else {
      setUseMock(true);
    }
  }, [user?.id]);

  const data = useMock ? MOCK_ALUNOS : alunos;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((a) => a.aluno.name.toLowerCase().includes(q));
  }, [data, search]);

  const renderItem = ({ item }: { item: AlunoVinculado }) => {
    const levelColor = getLevelColor(item.aluno.level);
    const hasPlan = !!item.plano_ativo;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('FichaAluno', { alunoId: item.aluno.id })
        }
      >
        <View style={styles.cardRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { borderColor: levelColor }]}>
            <Text style={styles.avatarText}>{getInitials(item.aluno.name)}</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.aluno.name}
              </Text>
              <View style={[styles.levelBadge, { backgroundColor: levelColor + '26' }]}>
                <Text style={[styles.levelText, { color: levelColor }]}>
                  {item.aluno.level}
                </Text>
              </View>
            </View>

            <Text style={hasPlan ? styles.planText : styles.noPlanText}>
              {hasPlan ? `Treino: ${item.plano_ativo!.nome}` : 'Sem treino'}
            </Text>

            <Text style={styles.lastWorkout}>
              {diasAtras(item.ultimo_treino)}
            </Text>
          </View>

          {/* Chevron */}
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meus Alunos</Text>
        <Text style={styles.count}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar aluno..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      {loading && !useMock ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhum aluno vinculado</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  count: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    color: colors.textSecondary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.elevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginRight: spacing.sm,
    flexShrink: 1,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  levelText: {
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
  },
  planText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  noPlanText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.danger,
    marginBottom: 2,
  },
  lastWorkout: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
});
