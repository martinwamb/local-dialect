"use client";

import { useState } from "react";
import { ExerciseRecord, WordArrangeData } from "@/types/exercise";
import AudioButton from "@/components/ui/AudioButton";

interface Props {
  exercise: ExerciseRecord;
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}

export default function WordArrange({ exercise, onAnswer, disabled }: Props) {
  const data = exercise.data as WordArrangeData;
  const [selected, setSelected] = useState<string[]>([]);

  function addToken(id: string) {
    if (disabled) return;
    setSelected((prev) => [...prev, id]);
  }

  function removeToken(idx: number) {
    if (disabled) return;
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleCheck() {
    const correct = JSON.stringify(selected) === JSON.stringify(data.correctOrder);
    onAnswer(correct);
  }

  const remaining = data.wordTokens.filter((t) => !selected.includes(t.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-2">{data.instruction}</p>
        {data.audioUrl && <AudioButton audioUrl={data.audioUrl} />}
      </div>

      {/* Answer area */}
      <div className="min-h-14 flex flex-wrap gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        {selected.map((id, idx) => {
          const tok = data.wordTokens.find((t) => t.id === id)!;
          return (
            <button
              key={`${id}-${idx}`}
              onClick={() => removeToken(idx)}
              disabled={disabled}
              className="px-3 py-1.5 bg-white border-2 border-emerald-300 rounded-lg text-sm font-medium text-gray-800 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              {tok.text}
            </button>
          );
        })}
      </div>

      {/* Token bank */}
      <div className="flex flex-wrap gap-2 justify-center">
        {remaining.map((tok) => (
          <button
            key={tok.id}
            onClick={() => addToken(tok.id)}
            disabled={disabled}
            className="px-3 py-1.5 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-800 hover:border-emerald-400 transition-colors"
          >
            {tok.text}
          </button>
        ))}
      </div>

      {!disabled && selected.length > 0 && (
        <button
          onClick={handleCheck}
          className="py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Check answer
        </button>
      )}
    </div>
  );
}
