"use client";

import { useState } from "react";
import { StoryPageRecord } from "@/types/story";
import ClickableWord from "./ClickableWord";
import AudioButton from "@/components/ui/AudioButton";

interface Props {
  page: StoryPageRecord;
  pageNumber: number;
  totalPages: number;
}

export default function StoryPageView({ page, pageNumber, totalPages }: Props) {
  const [showTranslation, setShowTranslation] = useState(false);
  const wordMap = page.wordMap ?? {};

  const words = page.sourceText.split(/(\s+)/);

  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs text-gray-400 text-center">
        Page {pageNumber} of {totalPages}
      </div>

      {page.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.imageUrl}
          alt=""
          className="w-full aspect-video object-cover bg-emerald-50 rounded-2xl"
        />
      )}

      {/* Kikuyu text with clickable words */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Kikuyu</span>
          {page.audioUrl && <AudioButton audioUrl={page.audioUrl} />}
        </div>
        <p className="text-xl font-medium text-gray-900 leading-relaxed">
          {words.map((segment, i) => {
            const clean = segment.trim().replace(/[.,!?;:]$/, "");
            const punct = segment.trim().slice(clean.length);
            const translation = wordMap[clean.toLowerCase()];
            if (/^\s+$/.test(segment)) return <span key={i}>{segment}</span>;
            return (
              <span key={i}>
                <ClickableWord word={clean} translation={translation} />{punct}
              </span>
            );
          })}
        </p>
        <p className="text-xs text-gray-400 mt-3 italic">Tap any underlined word to see its meaning</p>
      </div>

      {/* English translation */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span>English translation</span>
          <span>{showTranslation ? "▲" : "▼"}</span>
        </button>
        {showTranslation && (
          <div className="px-5 py-4 bg-white">
            <p className="text-gray-600 text-base italic">{page.translatedText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
