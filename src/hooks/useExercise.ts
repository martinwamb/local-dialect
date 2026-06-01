"use client";

import { useState, useCallback } from "react";
import { ExerciseRecord, ExerciseState } from "@/types/exercise";

interface UseExerciseReturn {
  current: ExerciseRecord | null;
  state: ExerciseState;
  mistakeCount: number;
  progress: number;
  isComplete: boolean;
  submitAnswer: (correct: boolean) => void;
  advance: () => void;
}

export function useExercise(exercises: ExerciseRecord[]): UseExerciseReturn {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<ExerciseState>("answering");
  const [mistakeCount, setMistakeCount] = useState(0);

  const current = exercises[index] ?? null;
  const isComplete = index >= exercises.length;
  const progress = exercises.length > 0 ? index / exercises.length : 0;

  const submitAnswer = useCallback((correct: boolean) => {
    setState(correct ? "correct" : "incorrect");
    if (!correct) setMistakeCount((c) => c + 1);
  }, []);

  const advance = useCallback(() => {
    const next = index + 1;
    if (next >= exercises.length) {
      setState("complete");
      setIndex(next);
    } else {
      setIndex(next);
      setState("answering");
    }
  }, [index, exercises.length]);

  return { current, state, mistakeCount, progress, isComplete, submitAnswer, advance };
}
