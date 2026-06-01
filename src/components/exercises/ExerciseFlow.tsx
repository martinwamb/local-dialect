"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExerciseRecord } from "@/types/exercise";
import { useExercise } from "@/hooks/useExercise";
import MultipleChoice from "./MultipleChoice";
import TranslateInput from "./TranslateInput";
import WordArrange from "./WordArrange";
import MatchPairs from "./MatchPairs";
import LessonComplete from "./LessonComplete";

interface Props {
  exercises: ExerciseRecord[];
  lesson: { id: string; title: string; xpReward: number };
  languageSlug: string;
}

export default function ExerciseFlow({ exercises, lesson, languageSlug }: Props) {
  const router = useRouter();
  const { current, state, mistakeCount, progress, isComplete, submitAnswer, advance } =
    useExercise(exercises);

  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<{
    xpEarned: number;
    newBadges: { name: string; description: string; imageUrl: string }[];
    newStreak: number;
    newXpTotal: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isComplete && !submitting && !result) {
      setSubmitting(true);
      const score = Math.max(0, Math.round(100 - (mistakeCount / exercises.length) * 100));
      const durationSec = Math.round((Date.now() - startTime) / 1000);

      fetch("/api/progress/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, score, mistakeCount, durationSec }),
      })
        .then((r) => r.json())
        .then((data) => setResult(data))
        .catch(() => setResult({ xpEarned: lesson.xpReward, newBadges: [], newStreak: 0, newXpTotal: 0 }));
    }
  }, [isComplete, submitting, result, lesson.id, mistakeCount, exercises.length, startTime, lesson.xpReward]);

  if (isComplete) {
    return (
      <LessonComplete
        xpEarned={result?.xpEarned ?? lesson.xpReward}
        newBadges={result?.newBadges ?? []}
        mistakeCount={mistakeCount}
        onContinue={() => router.push(`/languages/${languageSlug}`)}
      />
    );
  }

  if (!current) return null;

  const isAnswered = state === "correct" || state === "incorrect";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Progress bar */}
      <div className="h-3 bg-gray-200">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        {/* Exercise content */}
        <div className="flex-1">
          {current.type === "MULTIPLE_CHOICE_TRANSLATE" || current.type === "MULTIPLE_CHOICE_AUDIO" ? (
            <MultipleChoice
              exercise={current}
              onAnswer={submitAnswer}
              disabled={isAnswered}
            />
          ) : current.type === "TRANSLATE_INPUT" ? (
            <TranslateInput
              exercise={current}
              onAnswer={submitAnswer}
              disabled={isAnswered}
            />
          ) : current.type === "WORD_ARRANGE" ? (
            <WordArrange
              exercise={current}
              onAnswer={submitAnswer}
              disabled={isAnswered}
            />
          ) : current.type === "MATCH_PAIRS" ? (
            <MatchPairs
              exercise={current}
              onAnswer={submitAnswer}
              disabled={isAnswered}
            />
          ) : null}
        </div>

        {/* Feedback + continue */}
        {isAnswered && (
          <div className={`rounded-2xl p-5 mt-4 ${state === "correct" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
            <div className={`font-bold text-lg mb-1 ${state === "correct" ? "text-emerald-700" : "text-red-700"}`}>
              {state === "correct" ? "✅ Correct!" : "❌ Not quite"}
            </div>
            <button
              onClick={advance}
              className={`w-full mt-3 py-3 rounded-xl font-semibold text-white transition-colors ${
                state === "correct" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
