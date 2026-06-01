export interface LanguageRecord {
  id: string;
  slug: string;
  name: string;
  nativeName: string;
  description: string | null;
  flagEmoji: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface UnitRecord {
  id: string;
  languageId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  iconEmoji: string | null;
  color: string | null;
}

export interface LessonRecord {
  id: string;
  unitId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  xpReward: number;
  type: "STANDARD" | "REVIEW" | "CHALLENGE";
}

export interface LessonWithProgress extends LessonRecord {
  isCompleted: boolean;
  isLocked: boolean;
  bestScore: number | null;
}

export interface UnitWithLessons extends UnitRecord {
  lessons: LessonWithProgress[];
}
