import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { Challenge } from '../types/social';

type TabKey = 'active' | 'available' | 'completed';

const MOCK_CHALLENGES: Challenge[] = [
  // Active
  {
    id: 'c1',
    title: 'Maratona de Treinos',
    description: 'Complete 20 treinos em 30 dias e ganhe pontos extras!',
    type: 'individual',
    start_date: '2026-03-15',
    end_date: '2026-04-15',
    goal: 20,
    current_progress: 12,
    participants_count: 234,
    prize_points: 500,
    prize_badge: 'Maratonista',
    status: 'active',
  },
  {
    id: 'c2',
    title: 'Bony Fit vs Bony Fit',
    description: 'Desafio entre unidades! Qual unidade treina mais?',
    type: 'inter_unit',
    start_date: '2026-03-20',
    end_date: '2026-04-20',
    goal: 500,
    current_progress: 310,
    participants_count: 412,
    prize_points: 1000,
    prize_badge: 'Campeão Regional',
    status: 'active',
  },
  // Available
  {
    id: 'c3',
    title: 'Desafio 30 Dias',
    description: 'Treine todos os dias por 30 dias consecutivos!',
    type: 'individual',
    start_date: '2026-04-10',
    end_date: '2026-05-10',
    goal: 30,
    current_progress: 0,
    participants_count: 89,
    prize_points: 750,
    prize_badge: 'Consistência de Ferro',
    status: 'available',
  },
  {
    id: 'c4',
    title: 'Squad Power',
    description: 'Forme um time de 5 e completem 100 treinos juntos.',
    type: 'team',
    start_date: '2026-04-15',
    end_date: '2026-05-15',
    goal: 100,
    current_progress: 0,
    participants_count: 156,
    prize_points: 600,
    prize_badge: 'Força do Time',
    status: 'available',
  },
  {
    id: 'c5',
    title: 'Cardio Insano',
    description: 'Acumule 500 minutos de cardio em 3 semanas.',
    type: 'individual',
    start_date: '2026-04-20',
    end_date: '2026-05-11',
    goal: 500,
    current_progress: 0,
    participants_count: 67,
    prize_points: 400,
    prize_badge: 'Coração de Aço',
    status: 'available',
  },
  // Completed
  {
    id: 'c6',
    title: 'Janeiro Fitness',
    description: 'Comece o ano treinando forte! 15 treinos em janeiro.',
    type: 'individual',
    start_date: '2026-01-01',
    end_date: '2026-01-31',
    goal: 15,
    current_progress: 15,
    participants_count: 345,
    prize_points: 300,
    prize_badge: 'Início Forte',
    status: 'completed',
  },
];

const TYPE_LABELS: Record<Challenge['type'], string> = {
  individual: 'Individual',
  team: 'Equipe',
  inter_unit: 'Entre Unidades',
};

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: 'active', label: 'Ativos' },
  { key: 'available', label: 'Disponíveis' },
  { key: 'completed', label: 'Concluídos' },
];

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

interface Props {
  navigation: any;
}

export default function DesafiosScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [challenges, setChallenges] = useState<Challenge[]>(MOCK_CHALLENGES);

  const filtered = challenges.filter((c) => {
    if (activeTab === 'active') return c.status === 'active';
    if (activeTab === 'available') return c.status === 'available';
    return c.status === 'completed';
  });

  const handleJoin = (challengeId: string) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? { ...c, status: 'active' as const, participants_count: c.participants_count + 1 }
          : c
      )
    );
    setActiveTab('active');
  };

  const renderChallenge = ({ item }: { item: Challenge }) => {
    const progress = item.goal > 0 ? Math.min(item.current_progress / item.goal, 1) : 0;
    const daysLeft = getDaysRemaining(item.end_date);
    const isCompleted = item.status === 'completed';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{TYPE_LABELS[item.type]}</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>{item.description}</Text>

        {!isCompleted && (
          <Text style={styles.duration}>{daysLeft} dias restantes</Text>
        )}

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
                isCompleted && styles.progressFillCompleted,
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.current_progress}/{item.goal}
          </Text>
        </View>

        {/* Participants */}
        <View style={styles.participantsRow}>
          <View style={styles.avatarStack}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.stackAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                <Text style={styles.stackAvatarText}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.participantsText}>
            {item.participants_count} participantes
          </Text>
        </View>

        {/* Prize */}
        <Text style={styles.prizeText}>
          🏆 {item.prize_points} pontos + Badge exclusiva
        </Text>

        {/* Action */}
        {isCompleted ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Concluído — {item.prize_points} pontos ganhos</Text>
          </View>
        ) : item.status === 'available' ? (
          <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoin(item.id)}>
            <Text style={styles.joinBtnText}>Participar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desafios</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TAB_CONFIG.map((tab) => (
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderChallenge}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 4,
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
  list: {
    paddingBottom: spacing.xxl,
  },
  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  typeBadge: {
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  duration: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: 4,
  },
  progressFillCompleted: {
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  // Participants
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  stackAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(242, 101, 34, 0.2)',
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackAvatarText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  participantsText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  prizeText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  // Actions
  joinBtn: {
    backgroundColor: colors.orange,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  joinBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  completedBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.success,
  },
});
