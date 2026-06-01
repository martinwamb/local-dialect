export interface BadgeRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  xpBonus: number;
  criteria: BadgeCriteria;
}

export type BadgeCriteriaType =
  | "lesson_count"
  | "streak_days"
  | "xp_total"
  | "perfect_lessons"
  | "unit_complete"
  | "language_count";

export interface BadgeCriteria {
  type: BadgeCriteriaType;
  threshold: number;
}

export interface UserBadgeRecord {
  badge: BadgeRecord;
  earnedAt: string;
}

export interface LessonCompleteResult {
  xpEarned: number;
  newBadges: BadgeRecord[];
  streakUpdated: boolean;
  newStreak: number;
  newXpTotal: number;
  isFirstLessonToday: boolean;
}
