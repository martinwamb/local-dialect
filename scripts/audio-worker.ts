/**
 * Generates audio for exercises/story pages missing it. Two separate tracks,
 * because exercise fields mix two different kinds of text:
 *  - Dialect text (the word/phrase actually being taught) needs the per-
 *    language dialect model (see generate_audio.py — Kikuyu/Luo only).
 *  - English instructional text (e.g. TRANSLATE_INPUT's `prompt`, which is
 *    the English phrase the learner translates FROM, not the answer) needs
 *    the language-agnostic edge-tts narrator voice, not a dialect model —
 *    feeding English through a Kikuyu-trained model produces garbled audio.
 *
 * Usage: npx tsx scripts/audio-worker.ts [--max N]
 */
import { db } from "./lib/db";
import { synthesizeNarration } from "./lib/edgeTts";
import type { Prisma } from "../src/generated/prisma/client";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const SUPPORTED_DIALECT_LANGUAGES = ["kikuyu", "luo"];
const args = process.argv.slice(2);
const maxArgIdx = args.indexOf("--max");
const MAX_TOTAL_PER_RUN = Number(maxArgIdx >= 0 ? args[maxArgIdx + 1] : (process.env.AUDIO_GEN_MAX_PER_RUN ?? 20));
const PUBLIC_AUDIO_DIR = path.resolve(process.env.AUDIO_DIR ?? "public/audio");
const publicRoot = path.resolve("public");

// Each dialect model has its own Python venv (mirrors the `learn` project's
// one-venv-per-tool convention) — coqui-tts (Luo) and transformers (Kikuyu)
// have historically pulled in mutually incompatible dependency versions when
// sharing one environment.
function pythonBinFor(language: string): string {
  if (language === "luo") return process.env.LUO_PYTHON_BIN ?? "python3";
  return process.env.AUDIO_PYTHON_BIN ?? "python3";
}

interface BatchItem {
  id: string;
  text: string;
  outPath: string;
}

type AudioField = "promptAudio" | "audioUrl";

interface PendingItem {
  kind: "exercise" | "storyPage";
  id: string;
  text: string;
  field: AudioField;
  languageSlug?: string; // only set (and required) for dialect items
}

function toPublicPath(absPath: string): string {
  return "/" + path.relative(publicRoot, absPath).split(path.sep).join("/");
}

function wordArrangeText(data: Record<string, unknown>): string | null {
  const tokens = data.wordTokens as { id: string; text: string }[] | undefined;
  const order = data.correctOrder as string[] | undefined;
  if (!tokens || !order) return null;
  const byId = new Map(tokens.map((t) => [t.id, t.text]));
  const words = order.map((id) => byId.get(id)).filter((w): w is string => !!w);
  return words.length ? words.join(" ") : null;
}

// Dialect pronunciation audio: the word/phrase being taught, in the language
// being taught. Only exercise types where `prompt`/wordTokens actually hold
// dialect text qualify — TRANSLATE_INPUT's prompt is English, so it's excluded.
async function findPendingDialectExercises(): Promise<PendingItem[]> {
  const exercises = await db.exercise.findMany({
    where: {
      type: { in: ["MULTIPLE_CHOICE_TRANSLATE", "MULTIPLE_CHOICE_AUDIO", "WORD_ARRANGE"] },
      lesson: { unit: { language: { slug: { in: SUPPORTED_DIALECT_LANGUAGES } } } },
    },
    include: { lesson: { include: { unit: { include: { language: true } } } } },
  });

  const pending: PendingItem[] = [];
  for (const ex of exercises) {
    const data = ex.data as Record<string, unknown>;
    const languageSlug = ex.lesson.unit.language.slug;
    if (ex.type === "WORD_ARRANGE") {
      if (data.audioUrl) continue;
      const text = wordArrangeText(data);
      if (text) pending.push({ kind: "exercise", id: ex.id, languageSlug, text, field: "audioUrl" });
    } else if (ex.type === "MULTIPLE_CHOICE_AUDIO") {
      if (data.audioUrl || typeof data.prompt !== "string") continue;
      pending.push({ kind: "exercise", id: ex.id, languageSlug, text: data.prompt, field: "audioUrl" });
    } else {
      if (data.promptAudio || typeof data.prompt !== "string") continue;
      pending.push({ kind: "exercise", id: ex.id, languageSlug, text: data.prompt, field: "promptAudio" });
    }
  }
  return pending;
}

// English narration: TRANSLATE_INPUT's prompt is the English source phrase —
// no dialect language, so not gated by SUPPORTED_DIALECT_LANGUAGES.
async function findPendingNarrationExercises(): Promise<PendingItem[]> {
  const exercises = await db.exercise.findMany({ where: { type: "TRANSLATE_INPUT" } });
  const pending: PendingItem[] = [];
  for (const ex of exercises) {
    const data = ex.data as Record<string, unknown>;
    if (data.promptAudio || typeof data.prompt !== "string") continue;
    pending.push({ kind: "exercise", id: ex.id, text: data.prompt, field: "promptAudio" });
  }
  return pending;
}

async function findPendingStoryPages(): Promise<PendingItem[]> {
  const pages = await db.storyPage.findMany({
    where: { audioUrl: null, story: { language: { slug: { in: SUPPORTED_DIALECT_LANGUAGES } } } },
    include: { story: { include: { language: true } } },
  });
  return pages.map((p) => ({
    kind: "storyPage" as const,
    id: p.id,
    languageSlug: p.story.language.slug,
    text: p.sourceText,
    field: "audioUrl" as const,
  }));
}

function runPythonBatch(
  language: string,
  items: BatchItem[]
): Promise<{ id: string; outPath: string; success: boolean; error?: string }[]> {
  return new Promise((resolve, reject) => {
    const batchFile = path.join(os.tmpdir(), `audio-batch-${language}-${Date.now()}.json`);
    fs.writeFileSync(batchFile, JSON.stringify(items));

    const proc = spawn(pythonBinFor(language), ["scripts/generate_audio.py", "--language", language, "--batch", batchFile]);
    let stdout = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => process.stdout.write(`    [py] ${d}`));
    proc.on("close", (code) => {
      fs.unlink(batchFile, () => {});
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(`generate_audio.py exited ${code} with no output`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim().split("\n").pop() ?? "[]"));
      } catch (e) {
        reject(new Error(`Could not parse generate_audio.py output: ${e}`));
      }
    });
    proc.on("error", reject);
  });
}

async function writeAudioField(item: PendingItem, publicPath: string) {
  if (item.kind === "storyPage") {
    await db.storyPage.update({ where: { id: item.id }, data: { audioUrl: publicPath } });
    return;
  }
  const exercise = await db.exercise.findUnique({ where: { id: item.id } });
  if (!exercise) return;
  const updatedData = { ...(exercise.data as Record<string, unknown>), [item.field]: publicPath } as Prisma.InputJsonValue;
  await db.exercise.update({ where: { id: item.id }, data: { data: updatedData } });
}

async function run() {
  const start = Date.now();
  console.log(`\n🔊 Audio Worker started at ${new Date().toISOString()}`);

  const [dialectItems, narrationItems, storyPageItems] = await Promise.all([
    findPendingDialectExercises(),
    findPendingNarrationExercises(),
    findPendingStoryPages(),
  ]);
  console.log(
    `Found ${dialectItems.length} dialect exercises, ${narrationItems.length} narration exercises, ${storyPageItems.length} story pages pending audio`
  );

  let created = 0;
  const errors: string[] = [];

  // Dialect track — batched per language so the (slow, large) model loads once.
  const dialectPool = [...dialectItems, ...storyPageItems].slice(0, MAX_TOTAL_PER_RUN);
  const byLanguage = new Map<string, PendingItem[]>();
  for (const item of dialectPool) {
    const lang = item.languageSlug!;
    if (!byLanguage.has(lang)) byLanguage.set(lang, []);
    byLanguage.get(lang)!.push(item);
  }

  for (const [language, items] of byLanguage) {
    console.log(`\n  🌍 ${language} (dialect): ${items.length} item(s)`);
    const batch: BatchItem[] = items.map((item) => ({
      id: item.id,
      text: item.text,
      outPath: path.join(PUBLIC_AUDIO_DIR, language, item.kind === "storyPage" ? "stories" : "exercises", `${item.id}.mp3`),
    }));

    let results: { id: string; outPath: string; success: boolean; error?: string }[] = [];
    try {
      results = await runPythonBatch(language, batch);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ ${language} batch failed: ${msg}`);
      errors.push(`${language}: ${msg}`);
      continue;
    }

    for (const result of results) {
      if (!result.success) {
        errors.push(`${result.id}: ${result.error ?? "unknown error"}`);
        continue;
      }
      const item = items.find((i) => i.id === result.id);
      if (!item) continue;
      await writeAudioField(item, toPublicPath(result.outPath));
      created++;
    }
  }

  // Narration track — edge-tts is a fast per-call network request, no model
  // load to amortize, so no batching needed.
  const narrationPool = narrationItems.slice(0, Math.max(0, MAX_TOTAL_PER_RUN - dialectPool.length));
  if (narrationPool.length > 0) console.log(`\n  🗣️  narration (English): ${narrationPool.length} item(s)`);
  for (const item of narrationPool) {
    const outPath = path.join(PUBLIC_AUDIO_DIR, "narration", "exercises", `${item.id}.mp3`);
    try {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      await synthesizeNarration(item.text, outPath);
      await writeAudioField(item, toPublicPath(outPath));
      console.log(`    ✓ '${item.text}' -> ${outPath}`);
      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`    ✗ '${item.text}': ${msg}`);
      errors.push(`${item.id}: ${msg}`);
    }
  }

  const durationMs = Date.now() - start;
  await db.generatorLog.create({
    data: { workerType: "audio", unitsProcessed: byLanguage.size, itemsCreated: created, errors, durationMs },
  });

  console.log(`\n✅ Audio Worker done — ${created} new audio files, ${(durationMs / 1000).toFixed(1)}s`);
  await db.$disconnect();
}

run().catch(async (err) => {
  console.error("Audio Worker fatal error:", err);
  await db.$disconnect();
  process.exit(1);
});
