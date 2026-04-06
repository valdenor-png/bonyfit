import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { fetchDetalhePersonal } from '../../services/supervisor';
import { useSupervisorStore } from '../../stores/supervisorStore';

interface AlunoVinculado {
  id: string;
  vinculado_em: string;
  aluno: { id: string; name: string; avatar_url: string | null; level: string };
}

interface AtividadeMock {
  tipo: string;
  aluno_nome: string;
  data: string;
}

const MOCK_ALUNOS: AlunoVinculado[] = [
  { id: 'v1', vinculado_em: '2025-11-01', aluno: { id: 'a1', name: 'Lucas Mendes', avatar_url: null, level: 'intermediario' } },
  { id: 'v2', vinculado_em: '2025-12-15', aluno: { id: 'a2', name: 'Carla Souza', avatar_url: null, level: 'iniciante' } },
  { id: 'v3', vinculado_em: '2026-01-10', aluno: { id: 'a3', name: 'Bruno Dias', avatar_url: null, level: 'avancado' } },
  { id: 'v4', vinculado_em: '2026-02-20', aluno: { id: 'a4', name: 'Ana Clara', avatar_url: null, level: 'intermediario' } },
];

const MOCK_ATIVIDADES: AtividadeMock[] = [
  { tipo: 'treino_criado', aluno_nome: 'Lucas Mendes', data: '2026-04-05' },
  { tipo: 'avaliacao_feita', aluno_nome: 'Carla Souza', data: '2026-04-04' },
  { tipo: 'treino_criado', aluno_nome: 'Bruno Dias', data: '2026-04-03' },
  { tipo: 'treino_criado', aluno_nome: 'Ana Clara', data: '2026-04-02' },
  { tipo: 'avaliacao_feita', aluno_nome: 'Lucas Mendes', data: '2026-04-01' },
];

function Avatar({ uri, size = 40 }: { uri: string | null; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, marginRight: spacing.md }} />;
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>?</Text>
    </View>
  );
}

function levelLabel(level: string): string {
  const map: Record<string, string> = { iniciante: 'Iniciante', intermediario: 'Intermediario', avancado: 'Avancado' };
  return map[level] || level;
}

export default function DetalhePersonalScreen() {
  const route = useRoute<any>();
  const { personalId, personalNome } = route.params || {};
  const personaisDaUnidade = useSupervisorStore((s) => s.personaisDaUnidade);
  const personal = personaisDaUnidade.find((p) => p.id === personalId);

  const [alunos, setAlunos] = useState<AlunoVinculado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchDetalhePersonal(personalId);
        if (result.alunos.length > 0) {
          setAlunos(result.alunos as any[]);
        } else {
          setAlunos(MOCK_ALUNOS);
        }
      } catch {
        setAlunos(MOCK_ALUNOS);
      }
      setLoading(false);
    })();
  }, [personalId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  const nome = personal?.name || personalNome || 'Personal';
  const alunosCount = personal?.alunos_count ?? alunos.length;
  const bio = personal?.bio || 'Personal Trainer';
  const especialidade = personal?.especialidade || 'Musculacao';
  const horario = personal?.horario || '06:00 - 22:00';
  const rating = personal?.rating ?? 4.8;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <>
          {/* Profile card */}
          <View style={styles.profileCard}>
            <Avatar uri={personal?.avatar_url || null} size={64} />
            <View style={{ flex: 1 }}>
              <Text style={styles.personalName}>{nome}</Text>
              <Text style={styles.personalBio}>{bio}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{alunosCount}</Text>
                  <Text style={styles.statLabel}>Alunos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{rating}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
              <Text style={styles.infoText}>Especialidade: {especialidade}</Text>
              <Text style={styles.infoText}>Horario: {horario}</Text>
            </View>
          </View>

          {/* Alunos Vinculados */}
          <Text style={styles.sectionTitle}>Alunos Vinculados</Text>
          {alunos.map((item) => (
            <View key={item.id} style={styles.alunoCard}>
              <Avatar uri={item.aluno.avatar_url} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alunoName}>{item.aluno.name}</Text>
                <Text style={styles.alunoLevel}>{levelLabel(item.aluno.level)}</Text>
              </View>
              <Text style={styles.alunoSince}>Desde {item.vinculado_em}</Text>
            </View>
          ))}

          {/* Atividade Recente */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xxl }]}>Atividade Recente</Text>
          {MOCK_ATIVIDADES.map((item, idx) => (
            <View key={idx} style={styles.atividadeRow}>
              <Text style={styles.atividadeIcon}>{item.tipo === 'treino_criado' ? '🏋️' : '📊'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.atividadeText}>
                  {item.tipo === 'treino_criado' ? `Criou treino pra ${item.aluno_nome}` : `Avaliou ${item.aluno_nome}`}
                </Text>
                <Text style={styles.atividadeDate}>{item.data}</Text>
              </View>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    marginBottom: spacing.xxl,
  },
  personalName: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.text,
  },
  personalBio: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 20,
    color: colors.orange,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  infoText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.orange,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  alunoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alunoName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  alunoLevel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  alunoSince: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
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
  atividadeRow: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  atividadeIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  atividadeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
  },
  atividadeDate: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
