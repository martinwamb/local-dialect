export const XP = {
  LESSON_BASE: 10,
  LESSON_PERFECT_BONUS: 5,
  LESSON_REVIEW: 20,
  LESSON_CHALLENGE: 30,
  DAILY_FIRST_BONUS: 15,
  BADGE_BONUS: 25,
} as const;

export const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1800, 2600, 3600];

export const DAILY_GOAL_XP = 20;

// Ordered lowest-to-highest so a unit/placement stage can be compared with <=.
export const STAGE_ORDER = { BEGINNER: 0, ELEMENTARY: 1, INTERMEDIATE: 2, ADVANCED: 3 } as const;
export const STAGES = Object.keys(STAGE_ORDER) as (keyof typeof STAGE_ORDER)[];
export const PLACEMENT_PASS_THRESHOLD = 0.7;

export function getLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function getXpForNextLevel(xp: number): { current: number; next: number; level: number } {
  const level = getLevel(xp);
  const current = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return { current, next, level };
}
