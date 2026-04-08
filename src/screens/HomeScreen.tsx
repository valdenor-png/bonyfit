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
import ScreenBackground from '../components/ScreenBackground';
import BannerCarousel from '../components/home/BannerCarousel';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

interface Props {
  navigation: any;
}

export default function HomeScreen({ navigation }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [workoutCount, setWorkoutCount] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        // Load workout count
        const { count } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id);
        setWorkoutCount(count ?? 0);
      } catch (error) {
        console.error('Error loading home data:', error);
      }
    }

    loadData();
  }, [user?.id]);

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
    <ScreenBackground>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate('MeuPerfil')}
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

      {/* Banner Carousel */}
      <BannerCarousel slides={[]} onScanQR={() => navigation.navigate('ScanQRAula')} />

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Acesso rápido</Text>
      <View style={styles.quickGrid}>
        <QuickAction icon="🏆" label="Ranking" onPress={() => navigation.navigate('Menu', { screen: 'Ranking' })} />
        <QuickAction icon="📊" label="Histórico" onPress={() => navigation.navigate('Menu', { screen: 'WorkoutHistory' })} />
        <QuickAction icon="📈" label="Progresso" onPress={() => navigation.navigate('Treino', { screen: 'ProgressaoCarga' })} />
        <QuickAction icon="👨‍🏫" label="Personais" onPress={() => navigation.navigate('Menu', { screen: 'Personal' })} />
        <QuickAction icon="🎯" label="Desafios" onPress={() => navigation.navigate('Menu', { screen: 'Desafios' })} />
        <QuickAction icon="🎁" label="Prêmios" onPress={() => navigation.navigate('Menu', { screen: 'Recompensas' })} />
      </View>
    </ScrollView>
    </ScreenBackground>
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
  container: { flex: 1, backgroundColor: 'transparent' },
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
