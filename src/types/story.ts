export interface StoryPageRecord {
  id: string;
  storyId: string;
  pageNumber: number;
  sourceText: string;
  translatedText: string;
  audioUrl: string | null;
  imageUrl: string | null;
  wordMap: Record<string, string> | null;
}

export interface StoryRecord {
  id: string;
  languageId: string;
  unitId: string | null;
  title: string;
  slug: string;
  description: string | null;
  coverEmoji: string | null;
  sortOrder: number;
  isPublished: boolean;
  pages?: StoryPageRecord[];
}
