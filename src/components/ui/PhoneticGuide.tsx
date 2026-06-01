"use client";

import { useState, useEffect } from "react";

interface PhoneticData {
  ipa: string;
  guide: string;
  example: string;
}

interface Props {
  word: string;
  language?: string;
}

export default function PhoneticGuide({ word, language = "Kikuyu" }: Props) {
  const [data, setData] = useState<PhoneticData | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  const cacheKey = `phonetic:${language}:${word}`;

  useEffect(() => {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { setData(JSON.parse(cached)); } catch { /* ignore */ }
      return;
    }
    setLoading(true);
    fetch(`/api/ai/phonetics?word=${encodeURIComponent(word)}&language=${encodeURIComponent(language)}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: PhoneticData | null) => {
        if (d) {
          setData(d);
          sessionStorage.setItem(cacheKey, JSON.stringify(d));
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [word, language, cacheKey]);

  useEffect(() => {
    if (data) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(t);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
        <span className="animate-pulse">Getting pronunciation…</span>
      </div>
    );
  }

  if (!data || !visible) {
    return data ? (
      <button
        onClick={() => setVisible(true)}
        className="mt-1 text-xs text-emerald-600 hover:underline"
      >
        🔤 Show pronunciation
      </button>
    ) : null;
  }

  return (
    <div className="mt-2 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs">
      <span className="font-mono text-emerald-700">{data.ipa}</span>
      <span className="text-gray-400">·</span>
      <span className="text-gray-600 italic">{data.guide}</span>
      <button onClick={() => setVisible(false)} className="ml-1 text-gray-400 hover:text-gray-600">✕</button>
    </div>
  );
}
