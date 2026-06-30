const OLLAMA_BASE = "http://127.0.0.1:11434";

export async function askQwen(prompt: string, model = "qwen3:14b"): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false, think: false }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response as string;
}

export async function getPhonetics(word: string, language = "Kikuyu"): Promise<{
  ipa: string;
  guide: string;
  example: string;
} | null> {
  const prompt = `You are a ${language} language expert. Given the ${language} word "${word}", provide:
1. IPA phonetic transcription
2. Simple English pronunciation guide (syllable by syllable, e.g. "nee-WEH-ga")
3. One short example sentence using the word with English translation

Respond ONLY with valid JSON in this exact format:
{"ipa":"...","guide":"...","example":"..."}`;

  try {
    const raw = await askQwen(prompt);
    const match = raw.match(/\{[^}]+\}/s);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
