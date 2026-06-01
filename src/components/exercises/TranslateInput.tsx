"use client";

import { useState } from "react";
import { ExerciseRecord, TranslateInputData } from "@/types/exercise";
import AudioButton from "@/components/ui/AudioButton";

interface Props {
  exercise: ExerciseRecord;
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}

function normalise(s: string) {
  return s.toLowerCase().trim().replace(/[.,!?]+$/, "");
}

export default function TranslateInput({ exercise, onAnswer, disabled }: Props) {
  const data = exercise.data as TranslateInputData;
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled || !value.trim()) return;
    const correct = data.acceptedAnswers.some(
      (a) => normalise(a) === normalise(value)
    );
    onAnswer(correct);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold text-gray-900">{data.prompt}</p>
          {data.promptAudio && <AudioButton audioUrl={data.promptAudio} />}
        </div>
        {data.hint && (
          <p className="text-xs text-gray-400 italic">{data.hint}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer…"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-emerald-400 disabled:bg-gray-50"
          autoFocus
        />
        {!disabled && (
          <button
            type="submit"
            disabled={!value.trim()}
            className="py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            Check answer
          </button>
        )}
      </form>
    </div>
  );
}
