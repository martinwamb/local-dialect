"use client";

import { useState } from "react";
import { ExerciseRecord, MultipleChoiceData } from "@/types/exercise";
import AudioButton from "@/components/ui/AudioButton";

interface Props {
  exercise: ExerciseRecord;
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}

export default function MultipleChoice({ exercise, onAnswer, disabled }: Props) {
  const data = exercise.data as MultipleChoiceData;
  const [selected, setSelected] = useState<string | null>(null);
  const isAudio = exercise.type === "MULTIPLE_CHOICE_AUDIO";

  function handleSelect(optionId: string, isCorrect: boolean) {
    if (disabled) return;
    setSelected(optionId);
    onAnswer(isCorrect);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        {isAudio && data.audioUrl ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-500 text-sm">{data.instruction ?? "What do you hear?"}</p>
            <AudioButton audioUrl={data.audioUrl} large />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-gray-900">{data.prompt}</p>
              {data.promptAudio && <AudioButton audioUrl={data.promptAudio} />}
            </div>
            <p className="text-gray-500 text-sm">{data.instruction ?? "What does this mean?"}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.options.map((opt) => {
          let cls = "border-2 border-gray-200 bg-white text-gray-800 hover:border-emerald-400";
          if (selected === opt.id) {
            cls = opt.isCorrect
              ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-2 border-red-400 bg-red-50 text-red-800";
          } else if (disabled && opt.isCorrect) {
            cls = "border-2 border-emerald-400 bg-emerald-50 text-emerald-800";
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id, opt.isCorrect)}
              disabled={disabled}
              className={`rounded-xl px-4 py-4 text-sm font-medium transition-all text-left ${cls}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
