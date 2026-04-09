import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../../tokens';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';

// --- MOCK DATA ---

interface StudentResult {
  id: string;
  nome: string;
  initials: string;
  pontos: number;
  removido: boolean;
  motivo?: string;
}

const STUDENTS: StudentResult[] = [
  { id: 'a1', nome: 'Carlos Pereira', initials: 'CP', pontos: 15, removido: false },
  { id: 'a2', nome: 'Juliana Ferreira', initials: 'JF', pontos: 15, removido: false },
  { id: 'a3', nome: 'Ana Maria Santos', initials: 'AM', pontos: 15, removido: false },
  { id: 'a4', nome: 'Roberto Lima', initials: 'RL', pontos: 15, removido: false },
  { id: 'a5', nome: 'Patricia Souza', initials: 'PS', pontos: 15, removido: false },
  { id: 'a6', nome: 'Fernando Costa', initials: 'FC', pontos: 0, removido: true, motivo: 'Saiu antes do fim' },
  { id: 'a7', nome: 'Gabriela Oliveira', initials: 'GO', pontos: 15, removido: false },
  { id: 'a8', nome: 'Lucas Mendes', initials: 'LM', pontos: 15, removido: false },
  { id: 'a9', nome: 'Mariana Alves', initials: 'MA', pontos: 15, removido: false },
];

const AULA_INFO = {
  modalidade: 'Funcional',
  icone: '🏋️',
  data: '04/04/2026',
  duracao: '01:02:34',
};

// --- COMPONENT ---

interface Props {
  navigation?: any;
}

export default function AulaFinalizadaScreen({ navigation }: Props) {
  const presentes = STUDENTS.filter((s) => !s.removido);
  const removidos = STUDENTS.filter((s) => s.removido);
  const pontosAluno = presentes.length > 0 ? presentes[0].pontos : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aula Finalizada</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <LinearGradient
          colors={[colors.orange, colors.orangeDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryTop}>
            <Text style={styles.summaryIcon}>{AULA_INFO.icone}</Text>
            <Text style={styles.summaryModalidade}>{AULA_INFO.modalidade}</Text>
          </View>
          <View style={styles.summaryMeta}>
            <Text style={styles.summaryMetaText}>{AULA_INFO.data}</Text>
            <Text style={styles.summaryMetaDot}>•</Text>
            <Text style={styles.summaryMetaText}>{AULA_INFO.duracao}</Text>
          </View>
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{presentes.length}</Text>
            <Text style={styles.statLabel}>presentes</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxCenter]}>
            <Text style={[styles.statValue, { color: colors.danger }]}>
              {removidos.length}
            </Text>
            <Text style={styles.statLabel}>removidos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.orange }]}>
              {pontosAluno}
            </Text>
            <Text style={styles.statLabel}>pts/aluno</Text>
          </View>
        </View>

        {/* Present students */}
        <Text style={styles.sectionTitle}>Presentes</Text>
        {presentes.map((s) => (
          <View key={s.id} style={styles.studentRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentInitials}>{s.initials}</Text>
            </View>
            <Text style={styles.studentName}>{s.nome}</Text>
            <Text style={styles.studentPoints}>+{s.pontos} pts</Text>
          </View>
        ))}

        {/* Removed students */}
        {removidos.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
              Removidos
            </Text>
            {removidos.map((s) => (
              <View key={s.id} style={styles.studentRow}>
                <View style={[styles.checkCircle, styles.xCircle]}>
                  <Text style={styles.xText}>✕</Text>
                </View>
                <View style={[styles.studentAvatar, styles.studentAvatarRemoved]}>
                  <Text style={styles.studentInitials}>{s.initials}</Text>
                </View>
                <View style={styles.studentRemovedInfo}>
                  <Text style={[styles.studentName, { color: colors.textMuted }]}>
                    {s.nome}
                  </Text>
                  {s.motivo && (
                    <Text style={styles.studentMotivo}>{s.motivo}</Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Back button */}
        <View style={styles.bottomAction}>
          <Button
            title="Voltar ao inicio"
            variant="outline"
            onPress={() => navigation?.goBack?.()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 54,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  // Summary card
  summaryCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  summaryModalidade: {
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryMetaText: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: 'rgba(255,255,255,0.85)',
  },
  summaryMetaDot: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: spacing.sm,
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxCenter: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: colors.elevated,
  },
  statValue: {
    fontSize: 22,
    fontFamily: fonts.numbersExtraBold,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  // Section
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  // Student rows
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(46,204,113,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.success,
  },
  xCircle: {
    backgroundColor: 'rgba(231,76,60,0.15)',
  },
  xText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.danger,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  studentAvatarRemoved: {
    backgroundColor: colors.elevated,
  },
  studentInitials: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  studentName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  studentPoints: {
    fontSize: 13,
    fontFamily: fonts.numbersBold,
    color: colors.success,
  },
  studentRemovedInfo: {
    flex: 1,
  },
  studentMotivo: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Bottom
  bottomAction: {
    marginTop: spacing.xxl,
  },
});
