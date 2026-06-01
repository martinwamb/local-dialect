"use client";

import { useState, useRef, useCallback } from "react";
import { resolveAudioUrl } from "@/lib/audio";

export function useAudio(relativePath: string | null | undefined) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    if (!relativePath) return;
    const url = resolveAudioUrl(relativePath);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setIsLoading(true);
    setError(null);

    audio.oncanplaythrough = () => setIsLoading(false);
    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError("Audio unavailable");
    };

    audio.play().catch(() => {
      setIsLoading(false);
      setError("Playback failed");
    });
  }, [relativePath]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  return { play, stop, isPlaying, isLoading, error };
}
