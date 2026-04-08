import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing, radius } from '../tokens';
import Skull from '../components/Skull';
import ScreenBackground from '../components/ScreenBackground';
import BannerCarousel from '../components/home/BannerCarousel';
import GlassCard from '../components/ui/GlassCard';
import XPRing from '../components/ui/XPRing';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

interface Props {
  navigation: any;
}

export default function HomeScreen({ navigation }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [workoutCount, setWorkoutCount] = useState(0);

  // ── Animations ─────────────────────────────────────────────
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-10)).current;
  const streakScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Header entrance
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Streak pulse
    if (user && (user.current_streak ?? user.streak ?? 0) > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(streakScale, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(streakScale, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [user?.id]);

  // ── Data ───────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { count } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setWorkoutCount(count ?? 0);
      } catch {}
    })();
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
      {/* ── Header ─────────────────────────────────────────── */}
      <Animated.View style={[styles.header, {
        opacity: headerOpacity,
        transform: [{ translateY: headerTranslateY }],
      }]}>
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
        <TouchableOpacity
          onPress={() => navigation.navigate('Calendar')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.calendarBtn}
        >
          <View style={styles.calendarBar} />
          <Text style={styles.calendarDay}>{new Date().getDate()}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── XP Ring ────────────────────────────────────── */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <XPRing points={userPoints} size={100} strokeWidth={6} />
      </View>

      {/* ── Stats Row (glassmorphism + animated numbers) ──── */}
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <AnimatedNumber value={userPoints} style={styles.statValue} />
          <Text style={styles.statLabel}>Pontos</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <View style={styles.streakRow}>
            <Animated.Text style={[styles.streakFire, { transform: [{ scale: streakScale }] }]}>
              🔥
            </Animated.Text>
            <AnimatedNumber value={userStreak} style={styles.statValue} />
          </View>
          <Text style={styles.statLabel}>Streak</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <AnimatedNumber value={workoutCount} style={styles.statValue} />
          <Text style={styles.statLabel}>Treinos</Text>
        </GlassCard>
      </View>

      {/* ── Treino do Dia (glassmorphism + gradient button) ─ */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          navigation.navigate('Treino');
        }}
      >
        <GlassCard style={styles.workoutCard} glow>
          <View style={styles.workoutContent}>
            <View style={styles.workoutLeft}>
              <Text style={styles.workoutLabel}>TREINO DE HOJE</Text>
              <Text style={styles.workoutName}>Peito + Tríceps + Ombro</Text>
              <Text style={styles.workoutSub}>6 exercícios • ~50 min</Text>
              <View style={styles.muscleChips}>
                {['Peito', 'Tríceps', 'Ombro'].map((m) => (
                  <View key={m} style={styles.muscleChip}>
                    <Text style={styles.muscleChipText}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>
            <LinearGradient
              colors={['#F26522', '#C4501A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.workoutBtn}
            >
              <Skull size={20} color="#FFFFFF" />
              <Text style={styles.workoutBtnText}>Iniciar</Text>
            </LinearGradient>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* ── Banner Carousel ────────────────────────────────── */}
      <BannerCarousel slides={[]} onScanQR={() => navigation.navigate('ScanQRAula')} />

      {/* ── Desafios da Semana ──────────────────────────── */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF' }}>⚡ Desafios da Semana</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Desafios')}>
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_500Medium', color: '#F26522' }}>Ver todos →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          <ChallengeCard emoji="🏋️" title="5 treinos na semana" progress={0.6} xp={500} daysLeft={3} />
          <ChallengeCard emoji="🔥" title="Streak de 7 dias" progress={0.85} xp={1000} daysLeft={2} />
          <ChallengeCard emoji="💪" title="100 séries no mês" progress={0.4} xp={750} daysLeft={5} />
        </ScrollView>
      </View>

      {/* Acesso Rápido removido — calendário está no header */}
    </ScrollView>
    </ScreenBackground>
  );
}

function ChallengeCard({ emoji, title, progress, xp, daysLeft }: { emoji: string; title: string; progress: number; xp: number; daysLeft: number }) {
  return (
    <View style={{
      width: 220,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.10)',
      padding: 16,
    }}>
      <Text style={{ fontSize: 28, marginBottom: 8 }}>{emoji}</Text>
      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', marginBottom: 4 }}>{title}</Text>
      <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{daysLeft} dias restantes</Text>
      {/* Progress bar */}
      <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, marginBottom: 8 }}>
        <LinearGradient
          colors={['#F26522', '#FFD700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 6, borderRadius: 3, width: `${Math.round(progress * 100)}%` }}
        />
      </View>
      <Text style={{ fontSize: 12, fontFamily: 'Sora_700Bold', color: '#F26522' }}>+{xp} XP</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 40 },

  // Header
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
    backgroundColor: 'rgba(242,101,34,0.15)',
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
  calendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F26522',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(242,101,34,0.1)',
  },
  calendarBar: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 2,
    backgroundColor: '#F26522',
    borderRadius: 1,
  },
  calendarDay: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: '#F26522',
    marginTop: 3,
  },
  greeting: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary },
  name: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
  },
  statValue: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakFire: {
    fontSize: 14,
  },

  // Workout card
  workoutCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    borderRadius: 20,
    borderColor: 'rgba(242,101,34,0.20)',
  },
  workoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutLeft: { flex: 1 },
  workoutLabel: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
    letterSpacing: 1,
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  workoutSub: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  muscleChips: {
    flexDirection: 'row',
    gap: 6,
  },
  muscleChip: {
    backgroundColor: 'rgba(242,101,34,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  muscleChipText: {
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  workoutBtn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  workoutBtnText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // (Quick grid removed)
});
