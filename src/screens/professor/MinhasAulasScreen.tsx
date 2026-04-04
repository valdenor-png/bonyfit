import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';

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
}

// --- MOCK DATA ---

const TODAY = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const TODAY_CLASSES: ClassItem[] = [
  { id: 'h1', modalidade: 'Danca', icone: '💃', horarioInicio: '07:00', horarioFim: '08:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 12, pontosTotal: 150 },
  { id: 'h2', modalidade: 'Funcional', icone: '🏋️', horarioInicio: '09:00', horarioFim: '10:00', unidade: 'Unidade Centro', status: 'em_andamento' },
  { id: 'h3', modalidade: 'Danca', icone: '💃', horarioInicio: '18:00', horarioFim: '19:00', unidade: 'Unidade Norte', status: 'agendada' },
];

const WEEK_CLASSES: Record<string, ClassItem[]> = {
  'Segunda': [
    { id: 'w1', modalidade: 'Danca', icone: '💃', horarioInicio: '07:00', horarioFim: '08:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 14, pontosTotal: 175 },
    { id: 'w2', modalidade: 'Funcional', icone: '🏋️', horarioInicio: '09:00', horarioFim: '10:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 8, pontosTotal: 100 },
  ],
  'Terca': [
    { id: 'w3', modalidade: 'Yoga', icone: '🧘', horarioInicio: '08:00', horarioFim: '09:00', unidade: 'Unidade Sul', status: 'finalizada', alunosCount: 10, pontosTotal: 125 },
  ],
  'Quarta': [
    { id: 'w4', modalidade: 'Danca', icone: '💃', horarioInicio: '07:00', horarioFim: '08:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 12, pontosTotal: 150 },
    { id: 'w5', modalidade: 'Funcional', icone: '🏋️', horarioInicio: '09:00', horarioFim: '10:00', unidade: 'Unidade Centro', status: 'em_andamento' },
    { id: 'w6', modalidade: 'Danca', icone: '💃', horarioInicio: '18:00', horarioFim: '19:00', unidade: 'Unidade Norte', status: 'agendada' },
  ],
  'Quinta': [
    { id: 'w7', modalidade: 'Yoga', icone: '🧘', horarioInicio: '08:00', horarioFim: '09:00', unidade: 'Unidade Sul', status: 'agendada' },
    { id: 'w8', modalidade: 'Funcional', icone: '🏋️', horarioInicio: '17:00', horarioFim: '18:00', unidade: 'Unidade Centro', status: 'agendada' },
  ],
};

const HISTORY_CLASSES: ClassItem[] = [
  { id: 'hs1', modalidade: 'Danca', icone: '💃', horarioInicio: '07:00', horarioFim: '08:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 15, pontosTotal: 188, data: '28/03/2026' },
  { id: 'hs2', modalidade: 'Funcional', icone: '🏋️', horarioInicio: '09:00', horarioFim: '10:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 9, pontosTotal: 113, data: '28/03/2026' },
  { id: 'hs3', modalidade: 'Yoga', icone: '🧘', horarioInicio: '08:00', horarioFim: '09:00', unidade: 'Unidade Sul', status: 'finalizada', alunosCount: 11, pontosTotal: 138, data: '27/03/2026' },
  { id: 'hs4', modalidade: 'Danca', icone: '💃', horarioInicio: '18:00', horarioFim: '19:00', unidade: 'Unidade Norte', status: 'finalizada', alunosCount: 18, pontosTotal: 225, data: '26/03/2026' },
  { id: 'hs5', modalidade: 'Funcional', icone: '🏋️', horarioInicio: '09:00', horarioFim: '10:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 7, pontosTotal: 88, data: '25/03/2026' },
  { id: 'hs6', modalidade: 'Danca', icone: '💃', horarioInicio: '07:00', horarioFim: '08:00', unidade: 'Unidade Centro', status: 'finalizada', alunosCount: 13, pontosTotal: 163, data: '24/03/2026' },
  { id: 'hs7', modalidade: 'Yoga', icone: '🧘', horarioInicio: '08:00', horarioFim: '09:00', unidade: 'Unidade Sul', status: 'finalizada', alunosCount: 10, pontosTotal: 125, data: '23/03/2026' },
  { id: 'hs8', modalidade: 'Funcional', icone: '🏋️', horarioInicio: '17:00', horarioFim: '18:00', unidade: 'Unidade Norte', status: 'finalizada', alunosCount: 6, pontosTotal: 75, data: '22/03/2026' },
];

// --- HELPERS ---

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
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>Iniciar Aula</Text>
        </TouchableOpacity>
      )}
      {cls.status === 'em_andamento' && (
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnGreen]} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>Ver Aula</Text>
        </TouchableOpacity>
      )}
      {cls.status === 'finalizada' && cls.alunosCount !== undefined && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {cls.alunosCount} alunos
          </Text>
          <Text style={styles.summaryDot}>•</Text>
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

      {/* Content */}
      {activeTab === 'hoje' && (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {TODAY_CLASSES.map((cls) => renderClassCard(cls))}
        </ScrollView>
      )}

      {activeTab === 'semana' && (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(WEEK_CLASSES).map(([day, classes]) => (
            <View key={day}>
              <Text style={styles.dayHeader}>{day}</Text>
              {classes.map((cls) => renderClassCard(cls))}
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === 'historico' && (
        <FlatList
          data={HISTORY_CLASSES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => renderClassCard(item, true)}
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
