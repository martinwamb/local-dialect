"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExerciseRecord } from "@/types/exercise";
import { useExercise } from "@/hooks/useExercise";
import MultipleChoice from "@/components/exercises/MultipleChoice";
import TranslateInput from "@/components/exercises/TranslateInput";
import WordArrange from "@/components/exercises/WordArrange";
import MatchPairs from "@/components/exercises/MatchPairs";

interface Section {
  stage: string;
  exercises: ExerciseRecord[];
}

interface Result {
  exerciseId: string;
  stage: string;
  correct: boolean;
}

export default function PlacementQuiz({ languageSlug, sections }: { languageSlug: string; sections: Section[] }) {
  const router = useRouter();
  const [exercises] = useState(() => sections.flatMap((s) => s.exercises));
  const [stageByExerciseId] = useState(() => new Map(sections.flatMap((s) => s.exercises.map((e) => [e.id, s.stage]))));

  const { current, state, isComplete, submitAnswer, advance } = useExercise(exercises);
  const [results, setResults] = useState<Result[]>([]);
  const [outcome, setOutcome] = useState<{ unlockedStage: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleAnswer(correct: boolean) {
    if (!current) return;
    submitAnswer(correct);
    setResults((prev) =>
      prev.some((r) => r.exerciseId === current.id)
        ? prev
        : [...prev, { exerciseId: current.id, stage: stageByExerciseId.get(current.id)!, correct }]
    );
  }

  useEffect(() => {
    if (isComplete && !submitting && !outcome) {
      setSubmitting(true);
      fetch(`/api/languages/${languageSlug}/placement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      })
        .then((r) => r.json())
        .then(setOutcome)
        .catch(() => setOutcome({ unlockedStage: "BEGINNER" }));
    }
  }, [isComplete, submitting, outcome, languageSlug, results]);

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 text-center">
        <p className="text-gray-600 mb-6">No placement content is available for this language yet — start from the beginning instead.</p>
        <button
          onClick={() => router.push(`/languages/${languageSlug}`)}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Go to unit map
        </button>
      </div>
    );
  }

  if (outcome) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {outcome.unlockedStage === "BEGINNER" ? "Let's start from the beginning!" : `You're placed at ${outcome.unlockedStage}!`}
        </h1>
        <p className="text-gray-500 text-sm mb-6">You can jump into that stage now, or review earlier units any time.</p>
        <button
          onClick={() => router.push(`/languages/${languageSlug}`)}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Go to unit map
        </button>
      </div>
    );
  }

  if (!current) return null;
  const isAnswered = state === "correct" || state === "incorrect";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-2 text-center text-sm font-semibold text-gray-500">
        Placement quiz — {results.length}/{exercises.length}
      </div>
      <div className="h-3 bg-gray-200">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${(results.length / exercises.length) * 100}%` }}
        />
      </div>
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        <div className="flex-1" key={current.id}>
          {current.type === "MULTIPLE_CHOICE_TRANSLATE" || current.type === "MULTIPLE_CHOICE_AUDIO" ? (
            <MultipleChoice exercise={current} onAnswer={handleAnswer} disabled={isAnswered} />
          ) : current.type === "TRANSLATE_INPUT" ? (
            <TranslateInput exercise={current} onAnswer={handleAnswer} disabled={isAnswered} />
          ) : current.type === "WORD_ARRANGE" ? (
            <WordArrange exercise={current} onAnswer={handleAnswer} disabled={isAnswered} />
          ) : current.type === "MATCH_PAIRS" ? (
            <MatchPairs exercise={current} onAnswer={handleAnswer} disabled={isAnswered} />
          ) : null}
        </div>
        {isAnswered && (
          <button
            onClick={advance}
            className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
