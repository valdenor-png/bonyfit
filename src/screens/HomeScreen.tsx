import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import Skull from '../components/Skull';
import ProgressRing from '../components/ProgressRing';
import UnitBubble from '../components/UnitBubble';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

interface Props {
  navigation: any;
}

const MOCK_UNITS = [
  { id: '1', name: 'Centro', capacity: 120, current_count: 45 },
  { id: '2', name: 'Jaderlândia', capacity: 80, current_count: 62 },
  { id: '3', name: 'Nova Olinda', capacity: 100, current_count: 30 },
  { id: '4', name: 'Apeú', capacity: 60, current_count: 55 },
  { id: '5', name: 'Icuí', capacity: 90, current_count: 20 },
];

const MOCK_AULAS = [
  { id: '1', time: '07:00', name: 'Dança', icon: '💃', instructor: 'Prof. Ana', vagas: 8 },
  { id: '2', time: '09:00', name: 'Funcional', icon: '🏋️', instructor: 'Prof. Carlos', vagas: 5 },
  { id: '3', time: '18:00', name: 'HIIT', icon: '🔥', instructor: 'Prof. Bruna', vagas: 3 },
];

export default function HomeScreen({ navigation }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [units, setUnits] = useState<typeof MOCK_UNITS>([]);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setLoadingData(true);
      try {
        // Load units
        const { data: unitsData } = await supabase
          .from('units')
          .select('id, name, capacity, current_count');
        if (unitsData && unitsData.length > 0) {
          setUnits(unitsData);
        } else {
          setUnits(MOCK_UNITS);
        }

        // Load workout count
        const { count } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id);
        setWorkoutCount(count ?? 0);
      } catch (error) {
        console.error('Error loading home data:', error);
        setUnits(MOCK_UNITS);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [user]);

  if (authLoading || !user) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  const firstName = user.name?.split(' ')[0] ?? 'Aluno';
  const userPoints = user.total_points ?? user.points ?? 0;
  const userStreak = user.current_streak ?? user.streak ?? 0;
  const userLevel = user.level ?? 'Bronze';
  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate('PerfilPessoal')}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Skull size={16} color={colors.orange} />
          <Text style={styles.levelText}>{userLevel}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userPoints.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Pontos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {userStreak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{workoutCount}</Text>
          <Text style={styles.statLabel}>Treinos</Text>
        </View>
      </View>

      {/* Today's workout card */}
      <TouchableOpacity
        style={styles.workoutCard}
        onPress={() => navigation.navigate('Treino')}
        activeOpacity={0.8}
      >
        <View style={styles.workoutLeft}>
          <Text style={styles.workoutLabel}>Treino de hoje</Text>
          <Text style={styles.workoutName}>Peito + Tríceps + Ombro</Text>
          <Text style={styles.workoutSub}>6 exercícios • ~50 min</Text>
        </View>
        <View style={styles.workoutBtn}>
          <Skull size={20} color="#FFFFFF" />
          <Text style={styles.workoutBtnText}>Iniciar</Text>
        </View>
      </TouchableOpacity>

      {/* Aulas de hoje */}
      <Text style={styles.sectionTitle}>Aulas de hoje</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.aulasRow}
      >
        {MOCK_AULAS.map((aula) => (
          <View key={aula.id} style={styles.aulaCard}>
            <Text style={styles.aulaTime}>{aula.time}</Text>
            <Text style={styles.aulaName}>{aula.icon} {aula.name}</Text>
            <Text style={styles.aulaInstructor}>{aula.instructor}</Text>
            <Text style={styles.aulaVagas}>{aula.vagas} vagas</Text>
            <TouchableOpacity
              style={styles.aulaScanBtn}
              onPress={() => navigation.navigate('ScanQRAula')}
              activeOpacity={0.7}
            >
              <Text style={styles.aulaScanText}>Escanear QR</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Unit capacity */}
      <Text style={styles.sectionTitle}>Lotação das unidades</Text>
      {loadingData ? (
        <ActivityIndicator size="small" color={colors.orange} style={{ marginBottom: spacing.xxl }} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bubbles}
        >
          {units.map((unit) => (
            <UnitBubble
              key={unit.id}
              name={unit.name}
              current={unit.current_count}
              capacity={unit.capacity}
            />
          ))}
        </ScrollView>
      )}

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Acesso rápido</Text>
      <View style={styles.quickGrid}>
        <QuickAction icon="🏆" label="Ranking" onPress={() => navigation.navigate('Ranking')} />
        <QuickAction icon="📊" label="Histórico" onPress={() => navigation.navigate('WorkoutHistory')} />
        <QuickAction icon="🥗" label="Nutrição" onPress={() => navigation.navigate('Nutricao')} />
        <QuickAction icon="👨‍🏫" label="Personais" onPress={() => navigation.navigate('Personal')} />
        <QuickAction icon="🎯" label="Desafios" onPress={() => navigation.navigate('Desafios')} />
        <QuickAction icon="🎁" label="Prêmios" onPress={() => navigation.navigate('Recompensas')} />
      </View>
    </ScrollView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  avatarBtn: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    borderWidth: 2,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  headerCenter: { flex: 1 },
  greeting: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary },
  name: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(242, 101, 34, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  levelText: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.orange },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontFamily: fonts.numbersBold, color: colors.text, marginBottom: 2 },
  statLabel: { fontSize: 10, fontFamily: fonts.body, color: colors.textMuted },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(242, 101, 34, 0.2)',
    marginBottom: spacing.xxl,
  },
  workoutLeft: { flex: 1 },
  workoutLabel: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginBottom: 4 },
  workoutName: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: 4 },
  workoutSub: { fontSize: 12, fontFamily: fonts.body, color: colors.textSecondary },
  workoutBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  workoutBtnText: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.text },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  aulasRow: { paddingHorizontal: spacing.xl, gap: spacing.sm, marginBottom: spacing.xxl },
  aulaCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: 160,
    gap: 4,
  },
  aulaTime: {
    fontSize: 18,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
  aulaName: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  aulaInstructor: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  aulaVagas: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  aulaScanBtn: {
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  aulaScanText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  bubbles: { paddingHorizontal: spacing.xl, gap: spacing.lg, marginBottom: spacing.xxl },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  quickItem: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { fontSize: 11, fontFamily: fonts.bodyMedium, color: colors.textSecondary },
});
