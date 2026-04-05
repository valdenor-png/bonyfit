import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

// --- TYPES ---

type TabKey = 'hoje' | 'semana' | 'historico';
type ClassStatus = 'agendada' | 'em_andamento' | 'finalizada';

interface ClassItem {
  id: string;
  modalidade: string;
  icone: string;
  horarioInicio: string;
  horarioFim: string;
  unidade: string;
  status: ClassStatus;
  alunosCount?: number;
  pontosTotal?: number;
  data?: string;
  qr_token?: string;
  modalidade_id?: string;
  pontos_aula_completa?: number;
}

// --- MOCK DATA (fallback) ---

const TODAY = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const FALLBACK_TODAY: ClassItem[] = [
  { id: 'h1', modalidade: 'Danca', icone: '\u{1F483}', horarioInicio: '07:00', horarioFim: '08:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 12, pontosTotal: 150 },
  { id: 'h2', modalidade: 'Funcional', icone: '\u{1F3CB}\u{FE0F}', horarioInicio: '09:00', horarioFim: '10:00', unidade: 'Unidade Centro', status: 'em_andamento' },
  { id: 'h3', modalidade: 'Danca', icone: '\u{1F483}', horarioInicio: '18:00', horarioFim: '19:00', unidade: 'Unidade Norte', status: 'agendada' },
];

const FALLBACK_HISTORY: ClassItem[] = [
  { id: 'hs1', modalidade: 'Danca', icone: '\u{1F483}', horarioInicio: '07:00', horarioFim: '08:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 15, pontosTotal: 188, data: '28/03/2026' },
  { id: 'hs2', modalidade: 'Funcional', icone: '\u{1F3CB}\u{FE0F}', horarioInicio: '09:00', horarioFim: '10:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 9, pontosTotal: 113, data: '28/03/2026' },
];

// Hardcoded modalidades as fallback
const MODALIDADES_FALLBACK = [
  { id: 'mod-danca', nome: 'Danca', icone: '\u{1F483}', pontos_aula_completa: 15 },
  { id: 'mod-funcional', nome: 'Funcional', icone: '\u{1F3CB}\u{FE0F}', pontos_aula_completa: 15 },
  { id: 'mod-abdominal', nome: 'Abdominal', icone: '\u{1F4AA}', pontos_aula_completa: 10 },
];

// --- HELPERS ---

function formatTime(isoStr: string | null): string {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function mapStatus(status: string): ClassStatus {
  if (status === 'aberta' || status === 'em_andamento') return 'em_andamento';
  if (status === 'finalizada') return 'finalizada';
  return 'agendada';
}

function StatusBadge({ status }: { status: ClassStatus }) {
  const config = {
    agendada: { label: 'Agendada', bg: 'rgba(102,102,102,0.15)', color: colors.textMuted },
    em_andamento: { label: 'Em andamento', bg: 'rgba(46,204,113,0.15)', color: colors.success },
    finalizada: { label: 'Finalizada', bg: 'rgba(59,130,246,0.15)', color: colors.info },
  }[status];

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      {status === 'em_andamento' && <View style={styles.pulseDot} />}
      <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// --- COMPONENT ---

interface Props {
  navigation?: any;
}

export default function MinhasAulasScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('hoje');
  const [sessions, setSessions] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalidades, setModalidades] = useState(MODALIDADES_FALLBACK);
  const user = useAuth((s) => s.user);

  const loadSessions = useCallback(async () => {
    if (!user?.id) {
      setSessions([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('aula_sessoes')
        .select('*, modalidades(nome, icone, pontos_aula_completa)')
        .eq('professor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: ClassItem[] = data.map((s: any) => ({
          id: s.id,
          modalidade: s.modalidades?.nome ?? 'Aula',
          icone: s.modalidades?.icone ?? '\u{1F3CB}\u{FE0F}',
          horarioInicio: formatTime(s.horario_inicio),
          horarioFim: formatTime(s.horario_fim),
          unidade: 'Unidade Centro',
          status: mapStatus(s.status),
          qr_token: s.qr_token,
          modalidade_id: s.modalidade_id,
          pontos_aula_completa: s.modalidades?.pontos_aula_completa ?? 15,
          data: s.horario_inicio
            ? new Date(s.horario_inicio).toLocaleDateString('pt-BR')
            : undefined,
        }));
        setSessions(mapped);
      } else {
        // Keep fallback if no real data
        setSessions([]);
      }
    } catch (err) {
      console.warn('Error loading sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadModalidades = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('modalidades')
        .select('id, nome, icone, pontos_aula_completa');
      if (error) throw error;
      if (data && data.length > 0) {
        setModalidades(data as any);
      }
    } catch (err) {
      console.warn('Error loading modalidades:', err);
      // keep fallback
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadModalidades();
  }, [loadSessions, loadModalidades]);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      loadSessions();
    });
    return unsubscribe;
  }, [navigation, loadSessions]);

  const handleIniciarAula = () => {
    const options = modalidades.map((m) => m.nome);
    Alert.alert(
      'Selecione a Modalidade',
      'Escolha a modalidade para iniciar a aula:',
      [
        ...options.map((nome) => ({
          text: nome,
          onPress: () => criarSessao(nome),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  };

  const criarSessao = async (modalidadeNome: string) => {
    const mod = modalidades.find((m) => m.nome === modalidadeNome);
    if (!mod || !user?.id) return;

    const qr_token = `BONYFIT_AULA_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    try {
      const { data, error } = await supabase
        .from('aula_sessoes')
        .insert({
          modalidade_id: mod.id,
          professor_id: user.id,
          qr_token,
          status: 'aberta',
          horario_inicio: new Date().toISOString(),
        })
        .select('*, modalidades(nome, icone, pontos_aula_completa)')
        .single();

      if (error) throw error;

      // Navigate to AulaAtiva tab (Presenca tab) with session params
      navigation?.navigate?.('Presen\u00E7a', {
        screen: 'AulaAtivaMain',
        params: {
          sessionId: data.id,
          qrToken: data.qr_token,
          modalidadeNome: mod.nome,
          modalidadeIcone: mod.icone ?? '\u{1F3CB}\u{FE0F}',
          pontosAula: mod.pontos_aula_completa ?? 15,
        },
      });
    } catch (err) {
      console.warn('Error creating session:', err);
      Alert.alert('Erro', 'Nao foi possivel iniciar a aula. Tente novamente.');
    }
  };

  const handleVerAula = (cls: ClassItem) => {
    navigation?.navigate?.('Presen\u00E7a', {
      screen: 'AulaAtivaMain',
      params: {
        sessionId: cls.id,
        qrToken: cls.qr_token,
        modalidadeNome: cls.modalidade,
        modalidadeIcone: cls.icone,
        pontosAula: cls.pontos_aula_completa ?? 15,
      },
    });
  };

  // Determine which data to display
  const todayStr = new Date().toLocaleDateString('pt-BR');
  const todayClasses = sessions.length > 0
    ? sessions.filter((s) => s.data === todayStr || s.status === 'em_andamento')
    : FALLBACK_TODAY;
  const historyClasses = sessions.length > 0
    ? sessions.filter((s) => s.status === 'finalizada')
    : FALLBACK_HISTORY;

  const renderClassCard = (cls: ClassItem, showDate = false) => (
    <View key={cls.id} style={styles.classCard}>
      <View style={styles.classCardTop}>
        <View style={styles.timeBox}>
          <Text style={styles.timeText}>{cls.horarioInicio}</Text>
          <Text style={styles.timeSep}>-</Text>
          <Text style={styles.timeText}>{cls.horarioFim}</Text>
        </View>
        <View style={styles.classInfo}>
          <View style={styles.classNameRow}>
            <Text style={styles.classIcon}>{cls.icone}</Text>
            <Text style={styles.className}>{cls.modalidade}</Text>
          </View>
          <Text style={styles.classUnit}>{cls.unidade}</Text>
          {showDate && cls.data && <Text style={styles.classDate}>{cls.data}</Text>}
        </View>
        <StatusBadge status={cls.status} />
      </View>

      {/* Action area */}
      {cls.status === 'agendada' && (
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={handleIniciarAula}>
          <Text style={styles.actionBtnText}>Iniciar Aula</Text>
        </TouchableOpacity>
      )}
      {cls.status === 'em_andamento' && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnGreen]}
          activeOpacity={0.7}
          onPress={() => handleVerAula(cls)}
        >
          <Text style={styles.actionBtnText}>Ver Aula</Text>
        </TouchableOpacity>
      )}
      {cls.status === 'finalizada' && cls.alunosCount !== undefined && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {cls.alunosCount} alunos
          </Text>
          <Text style={styles.summaryDot}>{'\u2022'}</Text>
          <Text style={styles.summaryPoints}>{cls.pontosTotal} pts</Text>
        </View>
      )}
    </View>
  );

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: 'semana', label: 'Semana' },
    { key: 'historico', label: 'Historico' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Aulas</Text>
        <Text style={styles.headerDate}>{TODAY}</Text>
      </View>

      {/* Start new class button */}
      <TouchableOpacity
        style={styles.newAulaBtn}
        activeOpacity={0.7}
        onPress={handleIniciarAula}
      >
        <Text style={styles.newAulaBtnText}>+ Iniciar Nova Aula</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.orange} size="large" />
        </View>
      )}

      {/* Content */}
      {!loading && activeTab === 'hoje' && (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {todayClasses.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma aula hoje</Text>
          ) : (
            todayClasses.map((cls) => renderClassCard(cls))
          )}
        </ScrollView>
      )}

      {!loading && activeTab === 'semana' && (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {sessions.length > 0 ? (
            sessions.map((cls) => renderClassCard(cls, true))
          ) : (
            FALLBACK_TODAY.map((cls) => renderClassCard(cls))
          )}
        </ScrollView>
      )}

      {!loading && activeTab === 'historico' && (
        <FlatList
          data={historyClasses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => renderClassCard(item, true)}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma aula no historico</Text>
          }
        />
      )}
    </View>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerDate: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  newAulaBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  newAulaBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.orange,
  },
  tabText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  // Day header (semana tab)
  dayHeader: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  // Class card
  classCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  classCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeBox: {
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 56,
    marginRight: spacing.md,
  },
  timeText: {
    fontSize: 13,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },
  timeSep: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  classInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  classNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  classIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  className: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  classUnit: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  classDate: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
  },
  // Action button
  actionBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  actionBtnGreen: {
    backgroundColor: colors.success,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  // Summary row (finished class)
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.elevated,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  summaryDot: {
    fontSize: 13,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  summaryPoints: {
    fontSize: 13,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
});
