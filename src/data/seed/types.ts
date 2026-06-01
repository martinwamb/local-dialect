export interface SeedExercise {
  type: string;
  sortOrder: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface SeedLesson {
  title: string;
  description?: string;
  sortOrder: number;
  xpReward: number;
  exercises: SeedExercise[];
}

export interface SeedUnit {
  title: string;
  description?: string;
  sortOrder: number;
  iconEmoji?: string;
  color?: string;
  lessons: SeedLesson[];
}
