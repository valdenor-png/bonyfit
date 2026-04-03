import type { Level } from '../types/user';
import { getLevel } from '../types/user';
import type { WorkoutSession, ExerciseProgress } from '../types/workout';

// Points constants
const POINTS_PER_SET = 15;
const POINTS_PER_EXERCISE = 50;
const POINTS_ALL_COMPLETE_BONUS = 200;
const POINTS_CHECK_IN = 100;

interface LevelThreshold {
  level: Level;
  minPoints: number;
}

const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 'Diamante', minPoints: 30000 },
  { level: 'Platina', minPoints: 15000 },
  { level: 'Ouro', minPoints: 8000 },
  { level: 'Prata', minPoints: 3000 },
  { level: 'Bronze', minPoints: 0 },
];

/**
 * Calculate the user's level based on total points.
 */
export function calculateLevel(points: number): Level {
  return getLevel(points);
}

/**
 * Calculate the current streak based on an array of last workout dates (ISO strings).
 * Dates should be sorted descending (most recent first).
 * A streak counts consecutive days with at least one workout.
 */
export function calculateStreak(lastWorkoutDates: string[]): number {
  if (lastWorkoutDates.length === 0) return 0;

  // Normalize to date-only strings and deduplicate
  const uniqueDays = [
    ...new Set(
      lastWorkoutDates.map((d) => {
        const date = new Date(d);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }),
    ),
  ].sort((a, b) => (a > b ? -1 : 1)); // descending

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // The most recent workout must be today or yesterday to have an active streak
  const mostRecent = uniqueDays[0];
  const mostRecentDate = new Date(mostRecent + 'T00:00:00');
  const todayDate = new Date(todayStr + 'T00:00:00');
  const diffMs = todayDate.getTime() - mostRecentDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1] + 'T00:00:00');
    const curr = new Date(uniqueDays[i] + 'T00:00:00');
    const gap = Math.round(
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (gap === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get the points multiplier based on streak length.
 * 1-6 days = 1.0x, 7-29 days = 1.5x, 30+ days = 2.0x
 */
export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 7) return 1.5;
  return 1.0;
}

/**
 * Get the progress toward the next level.
 */
export function getLevelProgress(points: number): {
  level: Level;
  current: number;
  next: number;
  progress: number;
} {
  const level = getLevel(points);

  // Find current level threshold and the next one
  const currentThresholdIndex = LEVEL_THRESHOLDS.findIndex(
    (t) => t.level === level,
  );
  const currentThreshold = LEVEL_THRESHOLDS[currentThresholdIndex];

  // If already at the max level (Diamante)
  if (currentThresholdIndex === 0) {
    return {
      level,
      current: points,
      next: currentThreshold.minPoints,
      progress: 1,
    };
  }

  const nextThreshold = LEVEL_THRESHOLDS[currentThresholdIndex - 1];
  const rangeStart = currentThreshold.minPoints;
  const rangeEnd = nextThreshold.minPoints;
  const progress = (points - rangeStart) / (rangeEnd - rangeStart);

  return {
    level,
    current: points,
    next: rangeEnd,
    progress: Math.min(Math.max(progress, 0), 1),
  };
}

interface PointsBreakdownItem {
  label: string;
  points: number;
}

/**
 * Get an itemized breakdown of points earned in a workout session.
 */
export function getPointsBreakdown(
  exerciseProgress: ExerciseProgress[],
): PointsBreakdownItem[] {
  const items: PointsBreakdownItem[] = [];

  // Check-in points
  items.push({ label: 'Check-in na unidade', points: POINTS_CHECK_IN });

  // Per-exercise breakdown
  for (const ep of exerciseProgress) {
    if (ep.setsCompleted > 0) {
      items.push({
        label: `${ep.exercise.name} — ${ep.setsCompleted} série(s)`,
        points: ep.setsCompleted * POINTS_PER_SET,
      });
    }
    if (ep.status === 'completed') {
      items.push({
        label: `${ep.exercise.name} — completo`,
        points: POINTS_PER_EXERCISE,
      });
    }
  }

  // All-complete bonus
  const allCompleted = exerciseProgress.every(
    (ep) => ep.status === 'completed' || ep.status === 'skipped',
  );
  const anyCompleted = exerciseProgress.some(
    (ep) => ep.status === 'completed',
  );

  if (allCompleted && anyCompleted) {
    items.push({
      label: 'Bônus: treino completo',
      points: POINTS_ALL_COMPLETE_BONUS,
    });
  }

  return items;
}
