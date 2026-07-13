/**
 * Generates pronunciation audio for exercises/story pages missing it, in any
 * language with a working TTS model (see generate_audio.py — currently Kikuyu
 * and Luo only; Kamba/Luhya stay text-only until a model exists for them).
 * Batches items per language and shells out to the Python TTS script once per
 * batch, not once per item, so the (slow, ~500MB-1GB) model only loads once.
 *
 * Usage: npx tsx scripts/audio-worker.ts [--max N]
 */
import { db } from "./lib/db";
import type { Prisma } from "../src/generated/prisma/client";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const SUPPORTED_LANGUAGES = ["kikuyu", "luo"];
const args = process.argv.slice(2);
const maxArgIdx = args.indexOf("--max");
const MAX_TOTAL_PER_RUN = Number(maxArgIdx >= 0 ? args[maxArgIdx + 1] : (process.env.AUDIO_GEN_MAX_PER_RUN ?? 20));
const PUBLIC_AUDIO_DIR = path.resolve(process.env.AUDIO_DIR ?? "public/audio");
const PYTHON_BIN = process.env.AUDIO_PYTHON_BIN ?? "python3";

interface BatchItem {
  id: string;
  text: string;
  outPath: string;
}

interface PendingExercise {
  kind: "exercise";
  id: string;
  languageSlug: string;
  text: string;
  field: "promptAudio" | "audioUrl";
}
interface PendingStoryPage {
  kind: "storyPage";
  id: string;
  languageSlug: string;
  text: string;
}
type PendingItem = PendingExercise | PendingStoryPage;

function wordArrangeText(data: Record<string, unknown>): string | null {
  const tokens = data.wordTokens as { id: string; text: string }[] | undefined;
  const order = data.correctOrder as string[] | undefined;
  if (!tokens || !order) return null;
  const byId = new Map(tokens.map((t) => [t.id, t.text]));
  const words = order.map((id) => byId.get(id)).filter((w): w is string => !!w);
  return words.length ? words.join(" ") : null;
}

async function findPendingExercises(): Promise<PendingExercise[]> {
  const exercises = await db.exercise.findMany({
    where: {
      type: { in: ["MULTIPLE_CHOICE_TRANSLATE", "MULTIPLE_CHOICE_AUDIO", "TRANSLATE_INPUT", "WORD_ARRANGE"] },
      lesson: { unit: { language: { slug: { in: SUPPORTED_LANGUAGES } } } },
    },
    include: { lesson: { include: { unit: { include: { language: true } } } } },
  });

  const pending: PendingExercise[] = [];
  for (const ex of exercises) {
    const data = ex.data as Record<string, unknown>;
    const languageSlug = ex.lesson.unit.language.slug;
    if (ex.type === "WORD_ARRANGE") {
      if (data.audioUrl) continue;
      const text = wordArrangeText(data);
      if (text) pending.push({ kind: "exercise", id: ex.id, languageSlug, text, field: "audioUrl" });
    } else {
      if (data.promptAudio || typeof data.prompt !== "string") continue;
      pending.push({ kind: "exercise", id: ex.id, languageSlug, text: data.prompt, field: "promptAudio" });
    }
  }
  return pending;
}

async function findPendingStoryPages(): Promise<PendingStoryPage[]> {
  const pages = await db.storyPage.findMany({
    where: { audioUrl: null, story: { language: { slug: { in: SUPPORTED_LANGUAGES } } } },
    include: { story: { include: { language: true } } },
  });
  return pages.map((p) => ({ kind: "storyPage" as const, id: p.id, languageSlug: p.story.language.slug, text: p.sourceText }));
}

function runPythonBatch(
  language: string,
  items: BatchItem[]
): Promise<{ id: string; outPath: string; success: boolean; error?: string }[]> {
  return new Promise((resolve, reject) => {
    const batchFile = path.join(os.tmpdir(), `audio-batch-${language}-${Date.now()}.json`);
    fs.writeFileSync(batchFile, JSON.stringify(items));

    const proc = spawn(PYTHON_BIN, ["scripts/generate_audio.py", "--language", language, "--batch", batchFile]);
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

async function run() {
  const start = Date.now();
  console.log(`\n🔊 Audio Worker started at ${new Date().toISOString()}`);

  const [pendingExercises, pendingStoryPages] = await Promise.all([findPendingExercises(), findPendingStoryPages()]);
  const all: PendingItem[] = [...pendingExercises, ...pendingStoryPages].slice(0, MAX_TOTAL_PER_RUN);
  console.log(
    `Found ${pendingExercises.length} exercises + ${pendingStoryPages.length} story pages pending audio (processing up to ${all.length})`
  );

  const byLanguage = new Map<string, PendingItem[]>();
  for (const item of all) {
    if (!byLanguage.has(item.languageSlug)) byLanguage.set(item.languageSlug, []);
    byLanguage.get(item.languageSlug)!.push(item);
  }

  const publicRoot = path.resolve("public");
  let created = 0;
  const errors: string[] = [];

  for (const [language, items] of byLanguage) {
    console.log(`\n  🌍 ${language}: ${items.length} item(s)`);
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
      const publicPath = "/" + path.relative(publicRoot, result.outPath).split(path.sep).join("/");

      if (item.kind === "storyPage") {
        await db.storyPage.update({ where: { id: item.id }, data: { audioUrl: publicPath } });
      } else {
        const exercise = await db.exercise.findUnique({ where: { id: item.id } });
        if (exercise) {
          const updatedData = { ...(exercise.data as Record<string, unknown>), [item.field]: publicPath } as Prisma.InputJsonValue;
          await db.exercise.update({ where: { id: item.id }, data: { data: updatedData } });
        }
      }
      created++;
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
