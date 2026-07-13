"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

interface Props {
  language: {
    id: string;
    slug: string;
    name: string;
    nativeName: string;
    description: string | null;
    flagEmoji: string | null;
    isActive: boolean;
  };
  isEnrolled: boolean;
}

export default function LanguageEnrollCard({ language, isEnrolled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    if (isEnrolled || !language.isActive) {
      router.push(`/languages/${language.slug}`);
      return;
    }
    setLoading(true);
    await fetch("/api/languages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ languageId: language.id }),
    });
    setLoading(false);
    router.push(`/languages/${language.slug}`);
  }

  return (
    <div
      className={`flex items-center gap-4 bg-white rounded-2xl border p-5 shadow-sm transition-all ${
        language.isActive
          ? "border-gray-100 hover:border-emerald-200 cursor-pointer"
          : "border-gray-100 opacity-60 cursor-not-allowed"
      }`}
      onClick={language.isActive ? handleAction : undefined}
    >
      <div className="text-4xl">{language.flagEmoji ?? "🗣️"}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{language.name}</span>
          {!language.isActive && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Coming soon</span>
          )}
          {isEnrolled && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Enrolled</span>
          )}
        </div>
        <div className="text-sm text-gray-500">{language.nativeName}</div>
        {language.description && (
          <div className="text-xs text-gray-400 mt-1 truncate">{language.description}</div>
        )}
        {!isEnrolled && language.isActive && (
          <Link
            href={`/languages/${language.slug}/placement`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 inline-block"
          >
            Already know some? Take a placement quiz →
          </Link>
        )}
      </div>
      {language.isActive && (
        <button
          disabled={loading}
          className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
            isEnrolled
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {loading ? "…" : isEnrolled ? "Continue" : "Start"}
        </button>
      )}
    </div>
  );
}
