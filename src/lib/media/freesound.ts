const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;

interface FreesoundResult {
  previews?: Record<string, string>;
  duration?: number;
  is_explicit?: boolean;
}

// Freesound is community-uploaded (unlike Pexels), so unlike pexels.ts this
// filters explicitly: skip anything flagged is_explicit, and restrict to
// permissively-licensed results (Attribution / CC0) to keep redistribution clean.
export async function searchSound(query: string, maxDurationSec = 30): Promise<string | null> {
  if (!FREESOUND_API_KEY) return null;

  const res = await fetch(
    "https://freesound.org/apiv2/search/text/?" +
      new URLSearchParams({
        query,
        filter: `duration:[1 TO ${maxDurationSec}] (license:"Attribution" OR license:"Creative Commons 0")`,
        page_size: "5",
        fields: "id,previews,duration,is_explicit",
        sort: "score",
      }),
    { headers: { Authorization: `Token ${FREESOUND_API_KEY}` } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const results: FreesoundResult[] = data.results ?? [];

  for (const sound of results) {
    if (sound.is_explicit) continue;
    const preview = sound.previews?.["preview-hq-mp3"] ?? sound.previews?.["preview-lq-mp3"];
    if (preview) return preview;
  }
  return null;
}
