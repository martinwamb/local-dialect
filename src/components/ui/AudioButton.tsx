"use client";

import { useAudio } from "@/hooks/useAudio";

interface Props {
  audioUrl: string;
  large?: boolean;
}

export default function AudioButton({ audioUrl, large }: Props) {
  const { play, isPlaying, isLoading } = useAudio(audioUrl);

  return (
    <button
      onClick={play}
      disabled={isLoading}
      title="Play pronunciation"
      className={`rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center justify-center ${
        large ? "w-16 h-16 text-3xl" : "w-9 h-9 text-base"
      } ${isLoading ? "opacity-50" : ""}`}
    >
      {isPlaying ? "⏹" : isLoading ? "⏳" : "🔊"}
    </button>
  );
}
