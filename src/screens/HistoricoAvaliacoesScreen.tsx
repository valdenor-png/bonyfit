import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

interface Props {
  navigation: any;
}

interface Medidas {
  pesoKg: number;
  gorduraPct: number;
  imc: number;
  massMuscularKg: number;
  cinturaCm: number;
  quadrilCm: number;
  bracoDirCm: number;
  bracoEsqCm: number;
  coxaDirCm: number;
  coxaEsqCm: number;
}

interface Avaliacao {
  id: string;
  data: string;
  avaliador: string;
  pontos: number;
  medidas: Medidas;
}

const MOCK_AVALIACOES: Avaliacao[] = [
  {
    id: '1',
    data: '15/03/2026',
    avaliador: 'Prof. Ricardo',
    pontos: 600,
    medidas: {
      pesoKg: 78.2,
      gorduraPct: 18.5,
      imc: 24.1,
      massMuscularKg: 35.8,
      cinturaCm: 82,
      quadrilCm: 97,
      bracoDirCm: 34,
      bracoEsqCm: 33.5,
      coxaDirCm: 56,
      coxaEsqCm: 55.5,
    },
  },
  {
    id: '2',
    data: '12/02/2026',
    avaliador: 'Prof. Ricardo',
    pontos: 600,
    medidas: {
      pesoKg: 80.5,
      gorduraPct: 20.1,
      imc: 24.8,
      massMuscularKg: 35.2,
      cinturaCm: 85,
      quadrilCm: 99,
      bracoDirCm: 33.5,
      bracoEsqCm: 33,
      coxaDirCm: 55,
      coxaEsqCm: 54.5,
    },
  },
  {
    id: '3',
    data: '10/01/2026',
    avaliador: 'Prof. Camila',
    pontos: 600,
    medidas: {
      pesoKg: 83.0,
      gorduraPct: 22.3,
      imc: 25.6,
      massMuscularKg: 34.5,
      cinturaCm: 88,
      quadrilCm: 101,
      bracoDirCm: 33,
      bracoEsqCm: 32.5,
      coxaDirCm: 54,
      coxaEsqCm: 53.5,
    },
  },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function mapSupabaseToAvaliacao(row: any): Avaliacao {
  return {
    id: row.id,
    data: formatDate(row.created_at),
    avaliador: row.avaliador || 'Avaliador',
    pontos: row.pontos || 600,
    medidas: {
      pesoKg: row.peso_kg ?? 0,
      gorduraPct: row.gordura_pct ?? 0,
      imc: row.imc ?? 0,
      massMuscularKg: row.massa_muscular_kg ?? 0,
      cinturaCm: row.cintura_cm ?? 0,
      quadrilCm: row.quadril_cm ?? 0,
      bracoDirCm: row.braco_dir_cm ?? 0,
      bracoEsqCm: row.braco_esq_cm ?? 0,
      coxaDirCm: row.coxa_dir_cm ?? 0,
      coxaEsqCm: row.coxa_esq_cm ?? 0,
    },
  };
}

function getArrow(current: number, previous: number, lowerIsBetter: boolean) {
  if (current === previous) return { arrow: '—', color: colors.textMuted };
  const improved = lowerIsBetter ? current < previous : current > previous;
  return {
    arrow: improved ? (lowerIsBetter ? '↓' : '↑') : lowerIsBetter ? '↑' : '↓',
    color: improved ? colors.success : colors.danger,
  };
}

function WeightChart({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  const weights = avaliacoes.map((a) => a.medidas.pesoKg).reverse();
  const maxW = Math.max(...weights);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Evolução de peso (kg)</Text>
      {weights.map((w, i) => {
        const pct = (w / maxW) * 100;
        const isLast = i === weights.length - 1;
        const isDecreasing = i > 0 && w < weights[i - 1];
        return (
          <View key={i} style={styles.chartRow}>
            <Text style={styles.chartLabel}>{w.toFixed(1)}</Text>
            <View style={styles.chartBarTrack}>
              <View
                style={[
                  styles.chartBar,
                  {
                    width: `${pct}%`,
                    backgroundColor: isDecreasing ? colors.success : colors.orange,
                  },
                  isLast && styles.chartBarCurrent,
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function HistoricoAvaliacoesScreen({ navigation }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuth((s) => s.user);

  useEffect(() => {
    async function fetchAvaliacoes() {
      if (!user?.id) {
        setAvaliacoes(MOCK_AVALIACOES);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('avaliacoes')
          .select('*')
          .eq('aluno_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setAvaliacoes(data.map(mapSupabaseToAvaliacao));
        } else {
          setAvaliacoes(MOCK_AVALIACOES);
        }
      } catch {
        setAvaliacoes(MOCK_AVALIACOES);
      } finally {
        setLoading(false);
      }
    }

    fetchAvaliacoes();
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Minhas Avaliações</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      </SafeAreaView>
    );
  }

  const totalAvaliacoes = avaliacoes.length;
  const ultimaData = avaliacoes.length > 0 ? avaliacoes[0].data : '—';
  const pesoInicial = avaliacoes.length > 0 ? avaliacoes[avaliacoes.length - 1].medidas.pesoKg : 0;
  const pesoAtual = avaliacoes.length > 0 ? avaliacoes[0].medidas.pesoKg : 0;
  const trendDown = pesoAtual < pesoInicial;

  const renderItem = ({ item, index }: { item: Avaliacao; index: number }) => {
    const isExpanded = expandedId === item.id;
    const prev = index < avaliacoes.length - 1 ? avaliacoes[index + 1] : null;

    return (
      <TouchableOpacity
        style={styles.avalCard}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avalHeader}>
          <View>
            <Text style={styles.avalDate}>{item.data}</Text>
            <Text style={styles.avalAvaliador}>{item.avaliador}</Text>
          </View>
          <Text style={styles.avalPontos}>+{item.pontos} pts</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Peso</Text>
            <Text style={styles.metricValue}>{item.medidas.pesoKg}kg</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Gordura</Text>
            <Text style={styles.metricValue}>{item.medidas.gorduraPct}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>IMC</Text>
            <Text style={styles.metricValue}>{item.medidas.imc}</Text>
          </View>
        </View>

        {isExpanded && prev && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />
            <Text style={styles.expandedTitle}>Comparativo com avaliação anterior</Text>

            {[
              { label: 'Peso', cur: item.medidas.pesoKg, pre: prev.medidas.pesoKg, unit: 'kg', lowerBetter: true },
              { label: 'Gordura', cur: item.medidas.gorduraPct, pre: prev.medidas.gorduraPct, unit: '%', lowerBetter: true },
              { label: 'IMC', cur: item.medidas.imc, pre: prev.medidas.imc, unit: '', lowerBetter: true },
              { label: 'Massa muscular', cur: item.medidas.massMuscularKg, pre: prev.medidas.massMuscularKg, unit: 'kg', lowerBetter: false },
              { label: 'Cintura', cur: item.medidas.cinturaCm, pre: prev.medidas.cinturaCm, unit: 'cm', lowerBetter: true },
              { label: 'Quadril', cur: item.medidas.quadrilCm, pre: prev.medidas.quadrilCm, unit: 'cm', lowerBetter: true },
              { label: 'Braço dir.', cur: item.medidas.bracoDirCm, pre: prev.medidas.bracoDirCm, unit: 'cm', lowerBetter: false },
              { label: 'Braço esq.', cur: item.medidas.bracoEsqCm, pre: prev.medidas.bracoEsqCm, unit: 'cm', lowerBetter: false },
              { label: 'Coxa dir.', cur: item.medidas.coxaDirCm, pre: prev.medidas.coxaDirCm, unit: 'cm', lowerBetter: false },
              { label: 'Coxa esq.', cur: item.medidas.coxaEsqCm, pre: prev.medidas.coxaEsqCm, unit: 'cm', lowerBetter: false },
            ].map((m) => {
              const { arrow, color } = getArrow(m.cur, m.pre, m.lowerBetter);
              return (
                <View key={m.label} style={styles.compRow}>
                  <Text style={styles.compLabel}>{m.label}</Text>
                  <Text style={styles.compValue}>
                    {m.cur}{m.unit}
                  </Text>
                  <Text style={[styles.compArrow, { color }]}>{arrow}</Text>
                </View>
              );
            })}
          </View>
        )}

        {isExpanded && !prev && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />
            <Text style={styles.expandedSubtitle}>Primeira avaliação - sem comparativo</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={avaliacoes}
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
              <Text style={styles.headerTitle}>Minhas Avaliações</Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Stats summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{totalAvaliacoes}</Text>
                  <Text style={styles.summaryLabel}>avaliações</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{ultimaData}</Text>
                  <Text style={styles.summaryLabel}>última avaliação</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryTrend, { color: trendDown ? colors.success : colors.danger }]}>
                    {trendDown ? '↓' : '↑'} {Math.abs(pesoAtual - pesoInicial).toFixed(1)}kg
                  </Text>
                  <Text style={styles.summaryLabel}>tendência</Text>
                </View>
              </View>
            </View>

            {/* Chart */}
            <WeightChart avaliacoes={avaliacoes} />

            {/* Section label */}
            <Text style={styles.sectionTitle}>Histórico</Text>
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

  // Summary
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  summaryTrend: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.elevated,
  },

  // Chart
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chartLabel: {
    width: 45,
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  chartBarTrack: {
    flex: 1,
    height: 18,
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  chartBar: {
    height: 18,
    borderRadius: radius.sm,
  },
  chartBarCurrent: {
    opacity: 1,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Avaliacao card
  avalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avalDate: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },
  avalAvaliador: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  avalPontos: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricItem: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },

  // Expanded
  expandedSection: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.elevated,
    marginBottom: spacing.md,
  },
  expandedTitle: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  expandedSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  compLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  compValue: {
    fontSize: 13,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  compArrow: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    width: 24,
    textAlign: 'center',
  },
});
