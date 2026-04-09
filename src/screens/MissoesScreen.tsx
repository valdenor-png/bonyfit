import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, spacing, radius } from '../tokens';
import { Ionicons } from '@expo/vector-icons';

interface Mission {
  id: string;
  icon: string;
  title: string;
  current: number;
  goal: number;
  reward: number;
  completed: boolean;
}

const MOCK_MISSIONS: Mission[] = [
  { id: 'm1', icon: '🏋️', title: 'Treine 4x esta semana', current: 2, goal: 4, reward: 200, completed: false },
  { id: 'm2', icon: '💧', title: 'Beba 2L de agua por 5 dias', current: 3, goal: 5, reward: 150, completed: false },
  { id: 'm3', icon: '📸', title: 'Poste no feed', current: 0, goal: 1, reward: 100, completed: false },
  { id: 'm4', icon: '🏆', title: 'Complete um desafio', current: 1, goal: 1, reward: 250, completed: true },
  { id: 'm5', icon: '🦵', title: 'Faca um treino de perna', current: 0, goal: 1, reward: 150, completed: false },
];

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
function getWeekRange(): string {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7)); // segunda
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6); // domingo
  return `${mon.getDate()} ${MONTHS_PT[mon.getMonth()]} - ${sun.getDate()} ${MONTHS_PT[sun.getMonth()]}`;
}
const WEEK_RANGE = getWeekRange();
const POINTS_THIS_WEEK = 450;

interface Props {
  navigation: any;
}

function ProgressRingLocal({
  progress,
  size,
  strokeWidth,
  color,
  children,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.elevated}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children && (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {children}
          </View>
        </View>
      )}
    </View>
  );
}

export default function MissoesScreen({ navigation }: Props) {
  const [missions] = useState<Mission[]>(MOCK_MISSIONS);

  const completedCount = missions.filter((m) => m.completed).length;
  const totalMissions = missions.length;
  const overallProgress = completedCount / totalMissions;
  const allComplete = completedCount === totalMissions;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Missões da Semana</Text>
          <Text style={styles.headerWeek}>{WEEK_RANGE}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Points earned card */}
        <LinearGradient
          colors={[colors.orange, colors.orangeDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pointsCard}
        >
          <Text style={styles.pointsLabel}>Pontos esta semana</Text>
          <Text style={styles.pointsValue}>{POINTS_THIS_WEEK}</Text>
          <Text style={styles.pointsUnit}>pts</Text>
        </LinearGradient>

        {/* Overall progress ring */}
        <View style={styles.overallContainer}>
          <ProgressRingLocal
            progress={overallProgress}
            size={90}
            strokeWidth={6}
            color={colors.orange}
          >
            <Text style={styles.ringFraction}>
              {completedCount}/{totalMissions}
            </Text>
          </ProgressRingLocal>
          <Text style={styles.overallText}>
            {completedCount}/{totalMissions} missoes completas
          </Text>
        </View>

        {/* Mission cards */}
        {missions.map((mission) => {
          const progress = mission.goal > 0 ? mission.current / mission.goal : 0;
          return (
            <View
              key={mission.id}
              style={[styles.missionCard, mission.completed && styles.missionCardCompleted]}
            >
              <View style={styles.missionLeft}>
                <Text style={styles.missionIcon}>{mission.icon}</Text>
              </View>
              <View style={styles.missionCenter}>
                <Text
                  style={[
                    styles.missionTitle,
                    mission.completed && styles.missionTitleCompleted,
                  ]}
                >
                  {mission.title}
                </Text>
                {/* Progress bar */}
                <View style={styles.missionProgressBar}>
                  <View
                    style={[
                      styles.missionProgressFill,
                      {
                        width: `${Math.min(progress, 1) * 100}%`,
                        backgroundColor: mission.completed
                          ? colors.success
                          : colors.orange,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.missionProgressText}>
                  {mission.current}/{mission.goal}
                </Text>
              </View>
              <View style={styles.missionRight}>
                {mission.completed ? (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                ) : (
                  <Text style={styles.rewardText}>+{mission.reward} pts</Text>
                )}
              </View>
            </View>
          );
        })}

        {/* Bonus card */}
        <View style={styles.bonusCard}>
          <View style={styles.bonusLeft}>
            <Text style={styles.bonusIcon}>🌟</Text>
          </View>
          <View style={styles.bonusContent}>
            <Text style={styles.bonusTitle}>
              Bonus: complete TODAS
            </Text>
            <Text style={styles.bonusReward}>+500 pts extra</Text>
          </View>
          {allComplete ? (
            <View style={styles.checkCircle}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          ) : (
            <Text style={styles.bonusStatus}>
              {completedCount}/{totalMissions}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

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
    paddingTop: 50,
    paddingBottom: spacing.md,
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  headerWeek: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  // Points card
  pointsCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pointsLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  pointsValue: {
    fontSize: 48,
    fontFamily: fonts.numbersExtraBold,
    color: '#FFFFFF',
    lineHeight: 56,
  },
  pointsUnit: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: 'rgba(255,255,255,0.7)',
  },
  // Overall progress
  overallContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  ringFraction: {
    fontSize: 18,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },
  overallText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  // Mission cards
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  missionCardCompleted: {
    opacity: 0.6,
  },
  missionLeft: {
    marginRight: spacing.md,
  },
  missionIcon: {
    fontSize: 28,
  },
  missionCenter: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  missionTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  missionProgressBar: {
    height: 6,
    backgroundColor: colors.elevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  missionProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  missionProgressText: {
    fontSize: 11,
    fontFamily: fonts.numbersBold,
    color: colors.textMuted,
  },
  missionRight: {
    marginLeft: spacing.md,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  // Bonus card
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.orange,
    borderStyle: 'dashed',
  },
  bonusLeft: {
    marginRight: spacing.md,
  },
  bonusIcon: {
    fontSize: 28,
  },
  bonusContent: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  bonusReward: {
    fontSize: 16,
    fontFamily: fonts.numbersExtraBold,
    color: colors.orange,
    marginTop: 2,
  },
  bonusStatus: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.textMuted,
  },
});
