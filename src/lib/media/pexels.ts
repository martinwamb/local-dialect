const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

interface PexelsPhoto {
  src: { medium: string; small: string };
  alt?: string;
}

// Pexels is a fully curated, editorially-moderated stock library (no user
// uploads), so there's no safe-search param to set — moderation happens on
// their end.
export async function searchPhoto(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: PEXELS_API_KEY } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const photo: PexelsPhoto | undefined = data.photos?.[0];
  return photo?.src?.medium ?? null;
}
