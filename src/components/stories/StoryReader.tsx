"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StoryRecord, StoryPageRecord } from "@/types/story";
import StoryPageView from "./StoryPageView";

interface Props {
  story: StoryRecord;
  pages: StoryPageRecord[];
  languageSlug: string;
}

export default function StoryReader({ story, pages, languageSlug }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const isLast = currentIndex === pages.length - 1;
  const page = pages[currentIndex];

  useEffect(() => {
    if (!story.backgroundAudioUrl) return;
    const audio = bgAudioRef.current;
    if (!audio) return;
    audio.volume = 0.15;
    if (!muted) audio.play().catch(() => {});
    else audio.pause();
  }, [muted, story.backgroundAudioUrl]);

  if (!page) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {story.backgroundAudioUrl && <audio ref={bgAudioRef} src={story.backgroundAudioUrl} loop />}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push(`/languages/${languageSlug}/stories`)}
          className="text-gray-500 hover:text-gray-900 text-sm transition-colors"
        >
          ← Stories
        </button>
        <span className="font-semibold text-gray-900 text-sm truncate mx-4">{story.title}</span>
        <div className="flex items-center gap-3 shrink-0">
          {story.backgroundAudioUrl && (
            <button
              onClick={() => setMuted((m) => !m)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
              aria-label={muted ? "Unmute background music" : "Mute background music"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          )}
          <span className="text-xs text-gray-400">{currentIndex + 1}/{pages.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / pages.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <StoryPageView page={page} pageNumber={currentIndex + 1} totalPages={pages.length} />

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(i => i - 1)}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </button>
          )}
          {!isLast ? (
            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => router.push(`/languages/${languageSlug}/stories`)}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Finish story ✓
            </button>
          )}
        </div>
      </div>

      {/* Completion screen */}
      {isLast && currentIndex === pages.length - 1 && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-30 pb-8 px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-xl">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Story complete!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Great reading! You just practised real Kikuyu sentences in context.
            </p>
            <button
              onClick={() => router.push(`/languages/${languageSlug}/stories`)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Back to stories
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
