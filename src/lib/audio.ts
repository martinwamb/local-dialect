const AUDIO_BASE = process.env.NEXT_PUBLIC_AUDIO_BASE_URL ?? "";

export function resolveAudioUrl(path: string): string {
  return `${AUDIO_BASE}${path}`;
}
