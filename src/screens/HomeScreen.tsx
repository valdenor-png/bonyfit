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
import AnimatedNumber from '../components/ui/AnimatedNumber';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

// ── Quick action config ─────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: '🏆', label: 'Ranking', screen: 'Ranking', tint: '#FFD700' },
  { icon: '📊', label: 'Histórico', screen: 'WorkoutHistory', tint: '#4A90D9' },
  { icon: '📅', label: 'Calendário', screen: 'AcademyCalendar', tint: '#F26522' },
  { icon: '👨‍🏫', label: 'Personais', screen: 'Personal', tint: '#4CAF50' },
  { icon: '🎯', label: 'Desafios', screen: 'Desafios', tint: '#FF4444' },
  { icon: '🎁', label: 'Prêmios', screen: 'Recompensas', tint: '#9C27B0' },
];

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
        <View style={styles.levelBadge}>
          <Skull size={16} color={colors.orange} />
          <Text style={styles.levelText}>{userLevel}</Text>
        </View>
      </Animated.View>

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

      {/* ── Acesso Rápido (colored icons + glassmorphism) ─── */}
      <Text style={styles.sectionTitle}>Acesso rápido</Text>
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((action, index) => (
          <QuickAction
            key={action.screen}
            icon={action.icon}
            label={action.label}
            tint={action.tint}
            delay={index * 80}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(action.screen);
            }}
          />
        ))}
      </View>
    </ScrollView>
    </ScreenBackground>
  );
}

// ── QuickAction with staggered entrance + colored icon ───────
function QuickAction({
  icon,
  label,
  tint,
  delay,
  onPress,
}: {
  icon: string;
  label: string;
  tint: string;
  delay: number;
  onPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], width: '31%' }}>
      <TouchableOpacity
        style={styles.quickItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.quickIconBg, { backgroundColor: tint + '26', borderColor: tint + '40' }]}>
          <Text style={styles.quickIcon}>{icon}</Text>
        </View>
        <Text style={styles.quickLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
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
  greeting: { fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary },
  name: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(242,101,34,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  levelText: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.orange },

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

  // Section
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },

  // Quick grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  quickItem: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: { fontSize: 22 },
  quickLabel: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: 'rgba(255,255,255,0.55)',
  },
});
