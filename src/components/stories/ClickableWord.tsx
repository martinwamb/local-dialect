"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  word: string;
  translation?: string;
}

export default function ClickableWord({ word, translation }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!translation) return <span className="mx-0.5">{word}</span>;

  return (
    <span ref={ref} className="relative inline-block mx-0.5">
      <button
        onClick={() => setOpen(!open)}
        className="text-emerald-700 underline decoration-dotted decoration-emerald-400 underline-offset-2 hover:text-emerald-900 transition-colors cursor-pointer"
      >
        {word}
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg z-10">
          {translation}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
