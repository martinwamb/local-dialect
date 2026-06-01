export type ExerciseType =
  | "MULTIPLE_CHOICE_TRANSLATE"
  | "MULTIPLE_CHOICE_AUDIO"
  | "TRANSLATE_INPUT"
  | "WORD_ARRANGE"
  | "MATCH_PAIRS";

export interface ExerciseOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MultipleChoiceData {
  prompt: string;
  promptAudio?: string;
  instruction?: string;
  audioUrl?: string;
  options: ExerciseOption[];
}

export interface TranslateInputData {
  prompt: string;
  promptAudio?: string;
  acceptedAnswers: string[];
  hint?: string;
}

export interface WordToken {
  id: string;
  text: string;
}

export interface WordArrangeData {
  instruction: string;
  wordTokens: WordToken[];
  correctOrder: string[];
  audioUrl?: string;
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
}

export interface MatchPairsData {
  instruction: string;
  pairs: MatchPair[];
}

export type ExerciseData =
  | MultipleChoiceData
  | TranslateInputData
  | WordArrangeData
  | MatchPairsData;

export interface ExerciseRecord {
  id: string;
  lessonId: string;
  type: ExerciseType;
  sortOrder: number;
  data: ExerciseData;
}

export type ExerciseState = "idle" | "answering" | "correct" | "incorrect" | "complete";
