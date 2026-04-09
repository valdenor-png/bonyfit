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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORY_DURATION = 5000;

// ── Gradient colors for stories without images ───────────────
const GRADIENT_PALETTE: [string, string][] = [
  ['#F26522', '#D4520F'],
  ['#3B82F6', '#1D4ED8'],
  ['#2ECC71', '#27AE60'],
  ['#E74C3C', '#C0392B'],
  ['#9B59B6', '#8E44AD'],
  ['#F39C12', '#E67E22'],
  ['#1ABC9C', '#16A085'],
  ['#34495E', '#2C3E50'],
];

interface StoryData {
  id: string;
  gradientColors: [string, string];
  timestamp: string;
  text?: string;
}

interface StoryUser {
  id: string;
  name: string;
  initials: string;
  stories: StoryData[];
}

interface Props {
  navigation: any;
  route: { params: { userId?: string } };
}

export default function StoriesScreen({ navigation, route }: Props) {
  const targetUserId = route.params?.userId;
  const { user: currentUser } = useAuth();
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserIdx, setCurrentUserIdx] = useState(0);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  // ── Load stories from Supabase ─────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // For now, create a story entry for the target user
        // In future: query 'stories' table
        const userId = targetUserId || currentUser?.id;
        if (!userId) {
          navigation.goBack();
          return;
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .eq('id', userId)
          .single();

        if (!profile) {
          navigation.goBack();
          return;
        }

        const name = profile.name || 'Usuário';
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

        // Generate placeholder stories for this user
        const gradientIdx = Math.abs(userId.charCodeAt(0)) % GRADIENT_PALETTE.length;
        const userStories: StoryUser = {
          id: profile.id,
          name,
          initials,
          stories: [
            {
              id: `story-${profile.id}-1`,
              gradientColors: GRADIENT_PALETTE[gradientIdx],
              timestamp: 'agora',
            },
          ],
        };

        setStoryUsers([userStories]);
        setCurrentUserIdx(0);
        setCurrentStoryIdx(0);
      } catch {
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [targetUserId, currentUser?.id]);

  // ── Timer ──────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    if (storyUsers.length === 0) return;
    const u = storyUsers[currentUserIdx];
    if (!u) { navigation.goBack(); return; }

    if (currentStoryIdx < u.stories.length - 1) {
      setCurrentStoryIdx((prev) => prev + 1);
    } else if (currentUserIdx < storyUsers.length - 1) {
      setCurrentUserIdx((prev) => prev + 1);
      setCurrentStoryIdx(0);
    } else {
      navigation.goBack();
    }
  }, [currentUserIdx, currentStoryIdx, storyUsers, navigation]);

  const goPrev = useCallback(() => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx((prev) => prev - 1);
    } else if (currentUserIdx > 0) {
      const prevIdx = currentUserIdx - 1;
      setCurrentUserIdx(prevIdx);
      setCurrentStoryIdx(storyUsers[prevIdx].stories.length - 1);
    }
  }, [currentUserIdx, currentStoryIdx, storyUsers]);

  useEffect(() => {
    if (loading || storyUsers.length === 0) return;
    setProgress(0);
    startTimeRef.current = Date.now();
    clearTimer();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        clearTimer();
        goNext();
      }
    }, 50);

    return clearTimer;
  }, [currentUserIdx, currentStoryIdx, loading, storyUsers, clearTimer, goNext]);

  // ── Swipe down ─────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 20 && Math.abs(gs.dx) < Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100) navigation.goBack();
      },
    })
  ).current;

  // ── Loading / empty ────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.orange} size="large" />
      </View>
    );
  }

  const user = storyUsers[currentUserIdx];
  const story = user?.stories[currentStoryIdx];
  if (!user || !story) {
    navigation.goBack();
    return null;
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <LinearGradient
        colors={story.gradientColors}
        style={styles.storyBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {user.stories.map((s, idx) => (
          <View key={s.id} style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    idx < currentStoryIdx
                      ? '100%'
                      : idx === currentStoryIdx
                      ? `${progress * 100}%`
                      : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* User info */}
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.initials}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.timeAgo}>{story.timestamp}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Tap zones */}
      <View style={styles.tapZones}>
        <TouchableOpacity style={styles.tapLeft} activeOpacity={1} onPress={() => goPrev()} />
        <TouchableOpacity style={styles.tapRight} activeOpacity={1} onPress={() => goNext()} />
      </View>

      {/* Reply */}
      <View style={styles.replyContainer}>
        <TextInput
          style={styles.replyInput}
          placeholder="Responder..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={replyText}
          onChangeText={setReplyText}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
          onPress={() => { if (replyText.trim()) setReplyText(''); }}
        >
          <Text style={styles.sendBtnText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  storyBg: { ...StyleSheet.absoluteFillObject },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingTop: 50,
    gap: 3,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2 },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontFamily: fonts.bodyBold, color: '#FFFFFF' },
  userName: { fontSize: 14, fontFamily: fonts.bodyBold, color: '#FFFFFF', marginLeft: spacing.sm },
  timeAgo: { fontSize: 12, fontFamily: fonts.body, color: 'rgba(255,255,255,0.7)', marginLeft: spacing.sm },
  closeBtn: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, fontFamily: fonts.bodyBold, color: '#FFFFFF' },
  tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', top: 120, bottom: 80 },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
  replyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  replyInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.lg,
    fontSize: 14,
    fontFamily: fonts.body,
    color: '#FFFFFF',
  },
  sendBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { fontSize: 13, fontFamily: fonts.bodyBold, color: '#FFFFFF' },
});
