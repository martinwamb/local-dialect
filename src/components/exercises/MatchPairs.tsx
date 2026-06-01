"use client";

import { useState } from "react";
import { ExerciseRecord, MatchPairsData } from "@/types/exercise";

interface Props {
  exercise: ExerciseRecord;
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}

export default function MatchPairs({ exercise, onAnswer, disabled }: Props) {
  const data = exercise.data as MatchPairsData;
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({});

  const shuffledRight = [...data.pairs].sort(() => Math.random() - 0.5);
  const matchedIds = new Set(Object.keys(matched));

  function handleLeft(id: string) {
    if (disabled || matchedIds.has(id)) return;
    setSelectedLeft(id);
  }

  function handleRight(id: string) {
    if (disabled || !selectedLeft) return;
    const newMatched = { ...matched, [selectedLeft]: id };
    setMatched(newMatched);
    setSelectedLeft(null);

    if (Object.keys(newMatched).length === data.pairs.length) {
      const correct = data.pairs.every((p) => newMatched[p.id] === p.id);
      onAnswer(correct);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-500 text-sm text-center">{data.instruction}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {data.pairs.map((pair) => {
            const isMatched = matchedIds.has(pair.id);
            const isSelected = selectedLeft === pair.id;
            return (
              <button
                key={`left-${pair.id}`}
                onClick={() => handleLeft(pair.id)}
                disabled={disabled || isMatched}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                  isMatched
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 opacity-60"
                    : isSelected
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : "bg-white border-gray-200 text-gray-800 hover:border-emerald-300"
                }`}
              >
                {pair.left}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {shuffledRight.map((pair) => {
            const isMatched = Object.values(matched).includes(pair.id);
            return (
              <button
                key={`right-${pair.id}`}
                onClick={() => handleRight(pair.id)}
                disabled={disabled || isMatched || !selectedLeft}
                className={`px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                  isMatched
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 opacity-60"
                    : selectedLeft
                    ? "bg-white border-blue-300 text-gray-800 hover:border-blue-500 hover:bg-blue-50"
                    : "bg-white border-gray-200 text-gray-800"
                }`}
              >
                {pair.right}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
