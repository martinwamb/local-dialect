"use client";

import { useState, useCallback, useMemo } from "react";
import { ExerciseRecord, ExerciseState } from "@/types/exercise";

interface Answer {
  state: "correct" | "incorrect";
  correct: boolean;
}

interface UseExerciseReturn {
  current: ExerciseRecord | null;
  currentAnswer: Answer | null;
  state: ExerciseState;
  mistakeCount: number;
  progress: number;
  isComplete: boolean;
  canRetreat: boolean;
  submitAnswer: (correct: boolean) => void;
  advance: () => void;
  retreat: () => void;
}

export function useExercise(exercises: ExerciseRecord[]): UseExerciseReturn {
  const [index, setIndex] = useState(0);
  // Answered exercises keep their result here so navigating back re-shows the
  // same feedback instead of allowing a do-over that would corrupt scoring.
  const [answers, setAnswers] = useState<Record<number, Answer>>({});

  const current = exercises[index] ?? null;
  const currentAnswer = answers[index] ?? null;
  const isComplete = index >= exercises.length;
  const progress = exercises.length > 0 ? Math.min(index, exercises.length) / exercises.length : 0;
  const state: ExerciseState = currentAnswer ? currentAnswer.state : "answering";
  const mistakeCount = useMemo(() => Object.values(answers).filter((a) => !a.correct).length, [answers]);

  const submitAnswer = useCallback(
    (correct: boolean) => {
      setAnswers((prev) => (prev[index] ? prev : { ...prev, [index]: { state: correct ? "correct" : "incorrect", correct } }));
    },
    [index]
  );

  const advance = useCallback(() => {
    setIndex((i) => Math.min(i + 1, exercises.length));
  }, [exercises.length]);

  const retreat = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  return {
    current,
    currentAnswer,
    state,
    mistakeCount,
    progress,
    isComplete,
    canRetreat: index > 0,
    submitAnswer,
    advance,
    retreat,
  };
}
