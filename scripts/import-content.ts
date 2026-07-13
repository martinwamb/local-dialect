/**
 * Generates new AI-authored practice lessons for any unit, across any active
 * language, that's below its targetLessonCount. Source sentences come from real
 * HuggingFace parallel-text datasets — Ollama only writes the wrong-answer
 * distractors, never the sentences themselves. Writes directly to the DB.
 *
 * Sources:
 *   kikuyu: DigiGreen/KikuyuEnglish_translation (CC BY 4.0)
 *   luo/luhya/kamba: thinkKenya/kenyan-low-resource-language-data (CC BY 4.0)
 *
 * Usage: npx tsx scripts/import-content.ts [--dry-run] [--language kikuyu] [--max N]
 */
import { db } from "./lib/db";
import { askQwen } from "../src/lib/ollama";
import { ExerciseType, type Prisma } from "../src/generated/prisma/client";
import fs from "fs";
import path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const args = process.argv.slice(2);
const languageFilter = args[args.indexOf("--language") + 1]; // optional; loops all active languages if omitted
const MAX_TOTAL_PER_RUN = Number(args[args.indexOf("--max") + 1] ?? (process.env.CONTENT_GEN_MAX_TOTAL_PER_RUN ?? 3));
const EXERCISES_PER_LESSON = 6;

const DATASETS: Record<string, { dataset: string; config: string; srcField: string; tgtField: string }> = {
  kikuyu: { dataset: "DigiGreen/KikuyuEnglish_translation", config: "default", srcField: "source", tgtField: "target" },
  luo: { dataset: "thinkKenya/kenyan-low-resource-language-data", config: "dholuo_swahili", srcField: "source", tgtField: "target" },
  luhya: { dataset: "thinkKenya/kenyan-low-resource-language-data", config: "lubukusu_swahili", srcField: "source", tgtField: "target" },
  kamba: { dataset: "thinkKenya/kenyan-low-resource-language-data", config: "default", srcField: "source", tgtField: "target" },
};

interface GeneratedExercise {
  type: ExerciseType;
  sortOrder: number;
  data: Prisma.InputJsonValue;
}

async function fetchRows(dataset: string, config: string, offset: number, length: number) {
  const url = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(dataset)}&config=${config}&split=train&offset=${offset}&length=${length}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HF API error: ${res.status}`);
  const json = (await res.json()) as { rows: { row: Record<string, string> }[] };
  return json.rows.map((r) => r.row);
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
    const raw = await askQwen(prompt);
    const match = raw.match(/\[[\s\S]*?\]/);
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

async function existingPromptsForLanguage(languageId: string): Promise<Set<string>> {
  const exercises = await db.exercise.findMany({
    where: { lesson: { unit: { languageId } } },
    select: { data: true },
  });
  const set = new Set<string>();
  for (const ex of exercises) {
    const p = (ex.data as Record<string, unknown>)?.prompt;
    if (typeof p === "string") set.add(p);
  }
  return set;
}

async function buildLessonExercises(languageSlug: string, existingPrompts: Set<string>): Promise<GeneratedExercise[] | null> {
  const info = DATASETS[languageSlug];
  if (!info) return null;

  // Random offset so repeated runs sample different parts of the dataset instead
  // of always re-fetching the same rows (most of which get filtered out anyway).
  const offset = Math.floor(Math.random() * 2000);
  const rows = await fetchRows(info.dataset, info.config, offset, EXERCISES_PER_LESSON * 6);
  const usable = rows
    .filter((r) => isUsable(r[info.srcField] ?? "", r[info.tgtField] ?? ""))
    .filter((r) => !existingPrompts.has(r[info.srcField]))
    .slice(0, EXERCISES_PER_LESSON);

  if (usable.length < 3) return null; // not enough fresh material this run

  const exercises: GeneratedExercise[] = [];
  for (let i = 0; i < usable.length; i++) {
    const src = usable[i][info.srcField];
    const tgt = usable[i][info.tgtField];
    const distractors = await generateDistractors(src, tgt, languageSlug);
    if (distractors.length < 3) continue;

    const options = shuffle([
      { id: "a", text: tgt, isCorrect: true },
      ...distractors.map((d, idx) => ({ id: String.fromCharCode(98 + idx), text: d, isCorrect: false })),
    ]);

    exercises.push({
      type: "MULTIPLE_CHOICE_TRANSLATE" as ExerciseType,
      sortOrder: exercises.length + 1,
      data: { prompt: src, instruction: "What does this mean?", options },
    });
  }

  return exercises.length >= 3 ? exercises : null;
}

async function generateLessonsForUnit(unit: {
  id: string;
  languageId: string;
  title: string;
  language: { slug: string; name: string };
}): Promise<number> {
  const [existingPrompts, lessonCount] = await Promise.all([
    existingPromptsForLanguage(unit.languageId),
    db.lesson.count({ where: { unitId: unit.id } }),
  ]);

  const exercises = await buildLessonExercises(unit.language.slug, existingPrompts);
  if (!exercises) {
    console.warn(`    ⚠️  Not enough fresh sentences available for ${unit.language.slug} right now`);
    return 0;
  }

  const nextSortOrder = lessonCount + 1;
  const title = `Extra Practice ${nextSortOrder}`;

  if (DRY_RUN) {
    const outDir = path.join("src", "data", "seed", "generated");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `${unit.language.slug}-${new Date().toISOString().split("T")[0]}-${unit.id}.json`);
    fs.writeFileSync(outFile, JSON.stringify({ title, unitId: unit.id, exercises }, null, 2));
    console.log(`    ✓ (dry-run) "${title}" → ${outFile}`);
    return 1;
  }

  await db.lesson.create({
    data: {
      unitId: unit.id,
      title,
      sortOrder: nextSortOrder,
      xpReward: 10,
      type: "REVIEW",
      source: "ai-generated",
      exercises: { create: exercises },
    },
  });

  console.log(`    ✓ "${title}" (${exercises.length} exercises)`);
  return 1;
}

async function run() {
  const start = Date.now();
  console.log(`\n📝 Content Generator started at ${new Date().toISOString()}${DRY_RUN ? " (dry-run)" : ""}`);

  const units = await db.unit.findMany({
    where: {
      language: { isActive: true, ...(languageFilter ? { slug: languageFilter } : {}) },
    },
    include: { _count: { select: { lessons: true } }, language: true },
    orderBy: [{ language: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const underStocked = units.filter((u) => u._count.lessons < u.targetLessonCount && DATASETS[u.language.slug]);
  console.log(`Found ${underStocked.length} units below target lesson count`);

  let created = 0;
  const errors: string[] = [];

  for (const unit of underStocked) {
    if (created >= MAX_TOTAL_PER_RUN) {
      console.log(`  ⏸️  Reached max per run (${MAX_TOTAL_PER_RUN}) — remaining units continue next run`);
      break;
    }
    console.log(`\n  📚 Unit: "${unit.title}" [${unit.language.name}]`);
    try {
      created += await generateLessonsForUnit(unit);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Unit "${unit.title}": ${msg}`);
      errors.push(`${unit.title}: ${msg}`);
    }
  }

  const durationMs = Date.now() - start;
  if (!DRY_RUN) {
    await db.generatorLog.create({
      data: { workerType: "content", unitsProcessed: underStocked.length, itemsCreated: created, errors, durationMs },
    });
  }

  console.log(`\n✅ Content Generator done — ${created} new lessons, ${(durationMs / 1000).toFixed(1)}s`);
  await db.$disconnect();
}

run().catch(async (err) => {
  console.error("Content Generator fatal error:", err);
  await db.$disconnect();
  process.exit(1);
});
