import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Skull from '../components/Skull';

const SCREEN_H = Dimensions.get('window').height;
const STORY_DURATION = 5000;

interface Props {
  navigation: any;
  route: { params: { userId?: string } };
}

export default function StoriesScreen({ navigation, route }: Props) {
  const targetUserId = route.params?.userId;
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const pausedAtRef = useRef(0);

  // ── Load profile ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const userId = targetUserId || currentUser?.id;
      if (!userId) { navigation.goBack(); return; }

      const { data } = await supabase
        .from('public_user_profile')
        .select('id, name, avatar_url, total_points, current_streak, total_workouts')
        .eq('id', userId)
        .single();

      if (!data) { navigation.goBack(); return; }
      setProfile(data);
      setLoading(false);
    })();
  }, [targetUserId, currentUser?.id]);

  // ── Timer ──────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (loading || paused) return;
    setProgress(0);
    startTimeRef.current = Date.now();
    clearTimer();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(p);
      if (p >= 1) { clearTimer(); navigation.goBack(); }
    }, 50);

    return clearTimer;
  }, [loading, paused, clearTimer]);

  // ── Hold to pause ──────────────────────────────────────────
  const handlePressIn = () => {
    setPaused(true);
    pausedAtRef.current = Date.now() - startTimeRef.current;
    clearTimer();
  };

  const handlePressOut = () => {
    startTimeRef.current = Date.now() - pausedAtRef.current;
    setPaused(false);
  };

  // ── Swipe down ─────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 20 && Math.abs(gs.dx) < Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => { if (gs.dy > 100) navigation.goBack(); },
    })
  ).current;

  // ── Tap zones ──────────────────────────────────────────────
  const handleTap = (side: 'left' | 'right') => {
    if (side === 'right') {
      navigation.goBack(); // single story → close
    }
    // left = restart
    if (side === 'left') {
      setProgress(0);
      startTimeRef.current = Date.now();
    }
  };

  if (loading || !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.orange} size="large" />
      </View>
    );
  }

  const name = profile.name || 'Usuário';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const points = profile.total_points ?? 0;
  const streak = profile.current_streak ?? 0;
  const workouts = profile.total_workouts ?? 0;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#1A1A1A', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* User row */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.username}>{name}</Text>
          <Text style={styles.timestamp}>agora</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content (workout story) ────────────────────────── */}
      <View style={styles.content}>
        {/* Tap zones — long press = pause, short tap = nav */}
        <View style={styles.tapZones}>
          <TouchableOpacity
            style={styles.tapLeft}
            activeOpacity={1}
            onPress={() => handleTap('left')}
            onLongPress={handlePressIn}
            onPressOut={handlePressOut}
            delayLongPress={200}
          />
          <TouchableOpacity
            style={styles.tapRight}
            activeOpacity={1}
            onPress={() => handleTap('right')}
            onLongPress={handlePressIn}
            onPressOut={handlePressOut}
            delayLongPress={200}
          />
        </View>

        {/* Centered workout content */}
        <View style={styles.workoutContent}>
            <View style={styles.iconContainer}>
              <Skull size={32} color="#F26522" />
            </View>
            <Text style={styles.workoutTitle}>Treino Completo!</Text>
            <Text style={styles.workoutSubtitle}>{name} acabou de treinar</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workouts}</Text>
                <Text style={styles.statLabel}>treinos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{points.toLocaleString('pt-BR')}</Text>
                <Text style={styles.statLabel}>pontos</Text>
              </View>
            </View>
          </View>
        </View>

      {/* ── Footer (reply) ─────────────────────────────────── */}
      <View style={styles.footer}>
        <TextInput
          style={styles.replyInput}
          placeholder="Responder..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={replyText}
          onChangeText={setReplyText}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
          onPress={() => { if (replyText.trim()) setReplyText(''); }}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(242,101,34,0.2)',
    borderWidth: 1.5,
    borderColor: '#F26522',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontFamily: fonts.bodyBold, color: '#F26522' },
  username: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#FFFFFF' },
  timestamp: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  closeBtn: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: '#FFFFFF' },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
  workoutContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(242,101,34,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  workoutTitle: {
    fontFamily: fonts.numbersBold,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  workoutSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.numbersBold,
    fontSize: 20,
    color: '#F26522',
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 34,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replyInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F26522',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 18, color: '#FFFFFF' },
});
