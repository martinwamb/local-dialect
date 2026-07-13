"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExerciseRecord } from "@/types/exercise";
import { useExercise } from "@/hooks/useExercise";
import AudioButton from "@/components/ui/AudioButton";
import MultipleChoice from "./MultipleChoice";
import TranslateInput from "./TranslateInput";
import WordArrange from "./WordArrange";
import MatchPairs from "./MatchPairs";
import LessonComplete from "./LessonComplete";

export interface IntroScreen {
  type: "introduction" | "explanation" | "example";
  text: string;
  narrationAudioUrl?: string;
}

interface Props {
  exercises: ExerciseRecord[];
  introContent?: IntroScreen[];
  lesson: { id: string; title: string; xpReward: number };
  languageSlug: string;
}

export default function ExerciseFlow({ exercises, introContent, lesson, languageSlug }: Props) {
  const router = useRouter();
  const introScreens = introContent ?? [];
  const hasIntro = introScreens.length > 0;

  const [inIntro, setInIntro] = useState(hasIntro);
  const [introIndex, setIntroIndex] = useState(0);

  const { current, currentAnswer, state, mistakeCount, isComplete, canRetreat, submitAnswer, advance, retreat } =
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

  const totalScreens = introScreens.length + exercises.length;
  const screensDone = inIntro ? introIndex : introScreens.length + (exercises.length > 0 ? exerciseIndexOf(current) : 0);
  const progress = totalScreens > 0 ? screensDone / totalScreens : 0;

  function exerciseIndexOf(ex: ExerciseRecord | null): number {
    if (!ex) return 0;
    return Math.max(0, exercises.findIndex((e) => e.id === ex.id));
  }

  function goBack() {
    if (inIntro) {
      setIntroIndex((i) => Math.max(0, i - 1));
    } else if (canRetreat) {
      retreat();
    } else if (hasIntro) {
      setInIntro(true);
      setIntroIndex(introScreens.length - 1);
    }
  }

  const canGoBack = inIntro ? introIndex > 0 : canRetreat || hasIntro;

  if (inIntro) {
    const screen = introScreens[introIndex];
    const isLastIntroScreen = introIndex === introScreens.length - 1;

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <FlowHeader progress={progress} onExit={() => router.push(`/languages/${languageSlug}`)} />
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
            {screen.narrationAudioUrl && <AudioButton audioUrl={screen.narrationAudioUrl} large />}
            <p className="text-xl text-gray-900 leading-relaxed">{screen.text}</p>
          </div>
          <NavFooter
            canGoBack={canGoBack}
            onBack={goBack}
            onNext={() => (isLastIntroScreen ? setInIntro(false) : setIntroIndex((i) => i + 1))}
            nextLabel={isLastIntroScreen ? "Start practice →" : "Next →"}
          />
        </div>
      </div>
    );
  }

  if (!current) return null;

  const isAnswered = state === "correct" || state === "incorrect";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <FlowHeader progress={progress} onExit={() => router.push(`/languages/${languageSlug}`)} />

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        <div className="flex-1" key={current.id}>
          {current.type === "MULTIPLE_CHOICE_TRANSLATE" || current.type === "MULTIPLE_CHOICE_AUDIO" ? (
            <MultipleChoice exercise={current} onAnswer={submitAnswer} disabled={isAnswered} />
          ) : current.type === "TRANSLATE_INPUT" ? (
            <TranslateInput exercise={current} onAnswer={submitAnswer} disabled={isAnswered} />
          ) : current.type === "WORD_ARRANGE" ? (
            <WordArrange exercise={current} onAnswer={submitAnswer} disabled={isAnswered} />
          ) : current.type === "MATCH_PAIRS" ? (
            <MatchPairs exercise={current} onAnswer={submitAnswer} disabled={isAnswered} />
          ) : null}
        </div>

        {isAnswered && currentAnswer ? (
          <div
            className={`rounded-2xl p-5 mt-4 ${
              currentAnswer.correct ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
            }`}
          >
            <div className={`font-bold text-lg mb-1 ${currentAnswer.correct ? "text-emerald-700" : "text-red-700"}`}>
              {currentAnswer.correct ? "✅ Correct!" : "❌ Not quite"}
            </div>
            <NavFooter canGoBack={canGoBack} onBack={goBack} onNext={advance} nextLabel="Continue →" compact />
          </div>
        ) : (
          canGoBack && (
            <div className="mt-4">
              <button
                onClick={goBack}
                className="py-2 px-4 text-sm border border-gray-200 rounded-xl font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function FlowHeader({ progress, onExit }: { progress: number; onExit: () => void }) {
  return (
    <>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-700 text-lg transition-colors" aria-label="Exit lesson">
          ✕
        </button>
      </div>
      <div className="h-3 bg-gray-200">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress * 100}%` }} />
      </div>
    </>
  );
}

function NavFooter({
  canGoBack,
  onBack,
  onNext,
  nextLabel,
  compact = false,
}: {
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex gap-3 ${compact ? "mt-3" : "mt-6"}`}>
      {canGoBack && (
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
      >
        {nextLabel}
      </button>
    </div>
  );
}
