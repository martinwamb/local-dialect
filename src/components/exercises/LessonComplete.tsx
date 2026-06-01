"use client";

import { useEffect } from "react";

interface Props {
  xpEarned: number;
  mistakeCount: number;
  newBadges: { name: string; description: string; imageUrl?: string }[];
  onContinue: () => void;
}

export default function LessonComplete({ xpEarned, mistakeCount, newBadges, onContinue }: Props) {
  useEffect(() => {
    // Simple CSS confetti effect via background animation
    document.body.classList.add("confetti-active");
    return () => document.body.classList.remove("confetti-active");
  }, []);

  const isPerfect = mistakeCount === 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="text-8xl">{isPerfect ? "🏆" : "🎉"}</div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isPerfect ? "Perfect!" : "Lesson complete!"}
        </h1>
        <p className="text-gray-600">
          {isPerfect
            ? "Flawless — no mistakes at all!"
            : `${mistakeCount} mistake${mistakeCount !== 1 ? "s" : ""} — keep practising!`}
        </p>

        {/* XP earned */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
          <div className="text-4xl font-bold text-emerald-600">+{xpEarned} XP</div>
          <div className="text-sm text-gray-500 mt-1">added to your total</div>
        </div>

        {/* New badges */}
        {newBadges.length > 0 && (
          <div className="space-y-3">
            <p className="font-semibold text-gray-900">New badge{newBadges.length > 1 ? "s" : ""} earned!</p>
            {newBadges.map((badge) => (
              <div key={badge.name} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="text-3xl">🏅</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{badge.name}</div>
                  <div className="text-xs text-gray-500">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
