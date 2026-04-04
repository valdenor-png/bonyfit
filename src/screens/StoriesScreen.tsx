import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../tokens';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORY_DURATION = 5000;

interface Story {
  id: string;
  gradientColors: [string, string];
  timestamp: string;
}

interface StoryUser {
  id: string;
  name: string;
  initials: string;
  stories: Story[];
}

const MOCK_USERS: StoryUser[] = [
  {
    id: 'u1',
    name: 'Maria S.',
    initials: 'MS',
    stories: [
      { id: 's1', gradientColors: ['#F26522', '#D4520F'], timestamp: '2h' },
      { id: 's2', gradientColors: ['#3B82F6', '#1D4ED8'], timestamp: '4h' },
    ],
  },
  {
    id: 'u2',
    name: 'Rafael L.',
    initials: 'RL',
    stories: [
      { id: 's3', gradientColors: ['#2ECC71', '#27AE60'], timestamp: '1h' },
    ],
  },
  {
    id: 'u3',
    name: 'Ana M.',
    initials: 'AM',
    stories: [
      { id: 's4', gradientColors: ['#E74C3C', '#C0392B'], timestamp: '3h' },
      { id: 's5', gradientColors: ['#F39C12', '#E67E22'], timestamp: '5h' },
      { id: 's6', gradientColors: ['#9B59B6', '#8E44AD'], timestamp: '6h' },
    ],
  },
  {
    id: 'u4',
    name: 'Carlos P.',
    initials: 'CP',
    stories: [
      { id: 's7', gradientColors: ['#1ABC9C', '#16A085'], timestamp: '30min' },
      { id: 's8', gradientColors: ['#34495E', '#2C3E50'], timestamp: '2h' },
    ],
  },
  {
    id: 'u5',
    name: 'Juliana F.',
    initials: 'JF',
    stories: [
      { id: 's9', gradientColors: ['#F26522', '#9B59B6'], timestamp: '45min' },
    ],
  },
];

interface Props {
  navigation: any;
  route: { params: { userId: string } };
}

export default function StoriesScreen({ navigation, route }: Props) {
  const { userId } = route.params;

  const userIndex = MOCK_USERS.findIndex((u) => u.id === userId);
  const startUser = userIndex >= 0 ? userIndex : 0;

  const [currentUserIdx, setCurrentUserIdx] = useState(startUser);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const user = MOCK_USERS[currentUserIdx];
  const story = user?.stories[currentStoryIdx];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    const u = MOCK_USERS[currentUserIdx];
    if (currentStoryIdx < u.stories.length - 1) {
      setCurrentStoryIdx((prev) => prev + 1);
    } else if (currentUserIdx < MOCK_USERS.length - 1) {
      setCurrentUserIdx((prev) => prev + 1);
      setCurrentStoryIdx(0);
    } else {
      navigation.goBack();
    }
  }, [currentUserIdx, currentStoryIdx, navigation]);

  const goPrev = useCallback(() => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx((prev) => prev - 1);
    } else if (currentUserIdx > 0) {
      setCurrentUserIdx((prev) => prev + 1);
      const prevUser = MOCK_USERS[currentUserIdx - 1];
      setCurrentStoryIdx(prevUser.stories.length - 1);
    }
  }, [currentUserIdx, currentStoryIdx]);

  // Auto-advance timer
  useEffect(() => {
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
  }, [currentUserIdx, currentStoryIdx, clearTimer, goNext]);

  // Swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 20 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          navigation.goBack();
        }
      },
    })
  ).current;

  const handleTap = (side: 'left' | 'right') => {
    if (side === 'left') {
      goPrev();
    } else {
      goNext();
    }
  };

  if (!user || !story) {
    navigation.goBack();
    return null;
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Story background */}
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
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeBtnText}>X</Text>
        </TouchableOpacity>
      </View>

      {/* Tap zones */}
      <View style={styles.tapZones}>
        <TouchableOpacity
          style={styles.tapLeft}
          activeOpacity={1}
          onPress={() => handleTap('left')}
        />
        <TouchableOpacity
          style={styles.tapRight}
          activeOpacity={1}
          onPress={() => handleTap('right')}
        />
      </View>

      {/* Bottom reply */}
      <View style={styles.replyContainer}>
        <TextInput
          style={styles.replyInput}
          placeholder="Responder..."
          placeholderTextColor={colors.textMuted}
          value={replyText}
          onChangeText={setReplyText}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
          onPress={() => {
            if (replyText.trim()) setReplyText('');
          }}
        >
          <Text style={styles.sendBtnText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  storyBg: {
    ...StyleSheet.absoluteFillObject,
  },
  // Progress bars
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
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  // User info
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
  avatarText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  timeAgo: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: spacing.sm,
  },
  closeBtn: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  // Tap zones
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    top: 120,
    bottom: 80,
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
  },
  // Reply
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
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
});
