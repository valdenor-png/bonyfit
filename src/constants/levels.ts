/**
 * Single source of truth for level thresholds.
 * Must match the SQL in migration 027_unify_level_thresholds.sql
 */

export const LEVEL_THRESHOLDS = [
  { name: 'Bronze', min: 0, max: 2000, color: '#CD7F32', icon: '🥉' },
  { name: 'Prata', min: 2000, max: 5000, color: '#C0C0C0', icon: '🥈' },
  { name: 'Ouro', min: 5000, max: 10000, color: '#FFD700', icon: '🥇' },
  { name: 'Platina', min: 10000, max: 25000, color: '#3B82F6', icon: '💠' },
  { name: 'Diamante', min: 25000, max: 50000, color: '#A855F7', icon: '💎' },
  { name: 'Master', min: 50000, max: 100000, color: '#E74C3C', icon: '👑' },
] as const;

export type LevelName = (typeof LEVEL_THRESHOLDS)[number]['name'];

export function getLevelFromPoints(points: number) {
  const level = LEVEL_THRESHOLDS.find((l) => points >= l.min && points < l.max)
    || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = Math.min(1, (points - level.min) / (level.max - level.min));
  const remaining = level.max - points;
  const nextIdx = LEVEL_THRESHOLDS.indexOf(level) + 1;
  const nextLevel = nextIdx < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[nextIdx] : null;
  return { level, progress, remaining, nextLevel };
}

export function getLevelColor(levelName: string): string {
  return LEVEL_THRESHOLDS.find((l) => l.name === levelName)?.color || '#CD7F32';
}

export function getLevelIcon(levelName: string): string {
  return LEVEL_THRESHOLDS.find((l) => l.name === levelName)?.icon || '🥉';
}
