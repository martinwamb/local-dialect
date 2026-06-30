/**
 * Import content from HuggingFace datasets and enrich with Qwen distractors.
 * Usage: npx tsx scripts/import-content.ts --language kikuyu --limit 100
 *
 * Sources:
 *   kikuyu: DigiGreen/KikuyuEnglish_translation (CC BY 4.0)
 *   luo/luhya/kamba: thinkKenya/kenyan-low-resource-language-data (CC BY 4.0)
 *
 * Output: src/data/seed/generated/{language}-{date}.json (review before seeding)
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const language = args[args.indexOf("--language") + 1] ?? "kikuyu";
const limit = Number(args[args.indexOf("--limit") + 1] ?? 50);
const model = args[args.indexOf("--model") + 1] ?? "qwen3:14b";

const DATASETS: Record<string, { dataset: string; config: string; srcField: string; tgtField: string }> = {
  kikuyu: { dataset: "DigiGreen/KikuyuEnglish_translation", config: "default", srcField: "source", tgtField: "target" },
  luo:    { dataset: "thinkKenya/kenyan-low-resource-language-data", config: "dholuo_swahili", srcField: "source", tgtField: "target" },
  luhya:  { dataset: "thinkKenya/kenyan-low-resource-language-data", config: "lubukusu_swahili", srcField: "source", tgtField: "target" },
  kamba:  { dataset: "thinkKenya/kenyan-low-resource-language-data", config: "default", srcField: "source", tgtField: "target" },
};

const info = DATASETS[language];
if (!info) { console.error(`Unknown language: ${language}`); process.exit(1); }

async function fetchRows(dataset: string, config: string, length: number) {
  const url = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(dataset)}&config=${config}&split=train&offset=0&length=${length}`;
  console.log(`Fetching from HuggingFace: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HF API error: ${res.status} ${await res.text()}`);
  const json = await res.json() as { rows: { row: Record<string, string> }[] };
  return json.rows.map(r => r.row);
}

function isUsable(src: string, tgt: string): boolean {
  const words = src.trim().split(/\s+/);
  return words.length >= 3 && words.length <= 12 && !/[<>{}[\]\\]/.test(src) && tgt.length > 3;
}

async function generateDistractors(src: string, tgt: string, lang: string): Promise<string[]> {
  const prompt = `Given this sentence pair:
  ${lang} source: "${src}"
  Correct English translation: "${tgt}"

Generate exactly 3 plausible but WRONG English translations as multiple-choice distractors.
They should be believable mistakes — wrong meaning but grammatically natural English.
Output ONLY a valid JSON array with exactly 3 strings: ["wrong1","wrong2","wrong3"]`;

  try {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, think: false }),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json() as { response: string };
    const match = data.response.match(/\[[\s\S]*?\]/);
    if (!match) return [];
    const arr = JSON.parse(match[0]) as unknown[];
    if (!Array.isArray(arr) || arr.length < 3) return [];
    return arr.slice(0, 3).map(String);
  } catch {
    return [];
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const rows = await fetchRows(info.dataset, info.config, Math.min(limit * 3, 500));
  const usable = rows.filter(r => isUsable(r[info.srcField] ?? "", r[info.tgtField] ?? "")).slice(0, limit);
  console.log(`Got ${usable.length} usable sentences (filtered from ${rows.length})`);

  const exercises: object[] = [];
  for (let i = 0; i < usable.length; i++) {
    const src = usable[i][info.srcField];
    const tgt = usable[i][info.tgtField];
    process.stdout.write(`\r[${i + 1}/${usable.length}] Generating distractors...`);

    const distractors = await generateDistractors(src, tgt, language);
    if (distractors.length < 3) { console.log(`\nSkipping (no distractors): ${src}`); continue; }

    const options = shuffle([
      { id: "a", text: tgt, isCorrect: true },
      ...distractors.map((d, idx) => ({ id: String.fromCharCode(98 + idx), text: d, isCorrect: false })),
    ]);

    exercises.push({
      type: "MULTIPLE_CHOICE_TRANSLATE",
      sortOrder: i + 1,
      data: {
        prompt: src,
        instruction: "What does this mean?",
        options,
      },
    });
  }

  console.log(`\nGenerated ${exercises.length} exercises`);

  const outDir = path.join("src", "data", "seed", "generated");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${language}-${new Date().toISOString().split("T")[0]}.json`);
  fs.writeFileSync(outFile, JSON.stringify(exercises, null, 2));
  console.log(`\n✓ Written to ${outFile}`);
  console.log("Review the file, then add exercises to src/data/seed/{language}.ts and run npm run db:seed");
}

main().catch(e => { console.error(e); process.exit(1); });
