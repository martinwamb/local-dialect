/**
 * Generates stories for any unit, across any active language, that's below its
 * targetStoryCount — pulling vocabulary already taught in that unit's lessons so
 * new stories stay thematically grounded. Writes directly to the DB via Prisma
 * (no HTTP round-trip through the session-authed admin API).
 *
 * Usage: npx tsx scripts/generate-stories.ts [--dry-run] [--max N]
 *
 * Requires: Ollama running at 127.0.0.1:11434 with qwen3:14b loaded.
 */
import { db } from "./lib/db";
import { askQwen } from "../src/lib/ollama";
import fs from "fs";
import path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const args = process.argv.slice(2);
const maxArgIdx = args.indexOf("--max");
const MAX_TOTAL_PER_RUN = Number(
  maxArgIdx >= 0 ? args[maxArgIdx + 1] : (process.env.STORY_GEN_MAX_TOTAL_PER_RUN ?? 4)
);

interface GeneratedStory {
  title: string;
  coverEmoji: string;
  description: string;
  pages: { sourceText: string; translatedText: string; wordMap: Record<string, string> }[];
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildPrompt(languageName: string, unitTitle: string, vocab: string[], existingTitles: string[]): string {
  const vocabList = vocab.length ? vocab.slice(0, 12).join(", ") : "simple everyday words";
  return `You are a ${languageName} language teacher creating educational content for beginners.

Write a short children's story in ${languageName} themed around: "${unitTitle}"

Requirements:
- Exactly 5 short sentences (one per story page)
- Use simple vocabulary appropriate for beginners, naturally including some of these already-taught words where possible: ${vocabList}
- Each sentence should be short (5-12 words)
- Include a word-by-word vocabulary map for each sentence
- Give the story a short title (in English) and one cover emoji
- Do NOT reuse any of these existing titles: ${existingTitles.length ? existingTitles.join(", ") : "(none yet)"}

Return ONLY valid JSON in this exact format (no other text):
{
  "title": "Story title in English",
  "coverEmoji": "📖",
  "description": "One sentence description in English",
  "pages": [
    { "sourceText": "${languageName} sentence here", "translatedText": "English translation here", "wordMap": {"word": "meaning"} }
  ]
}

Make the story warm, culturally appropriate for Kenya, and educational. Use authentic ${languageName} vocabulary.`;
}

function extractJson(raw: string): GeneratedStory | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as GeneratedStory;
  } catch {
    return null;
  }
}

async function vocabForUnit(unitId: string): Promise<string[]> {
  const exercises = await db.exercise.findMany({
    where: { lesson: { unitId } },
    select: { data: true },
    take: 30,
  });
  const words = new Set<string>();
  for (const ex of exercises) {
    const prompt = (ex.data as Record<string, unknown>)?.prompt;
    if (typeof prompt === "string") words.add(prompt);
  }
  return [...words];
}

async function generateStoryForUnit(unit: {
  id: string;
  sortOrder: number;
  title: string;
  language: { id: string; name: string };
  _count: { stories: number };
}): Promise<boolean> {
  const existing = await db.story.findMany({ where: { languageId: unit.language.id }, select: { title: true } });
  const existingTitles = existing.map((s) => s.title);
  const vocab = await vocabForUnit(unit.id);

  const prompt = buildPrompt(unit.language.name, unit.title, vocab, existingTitles);
  let story: GeneratedStory | null = null;
  try {
    const raw = await askQwen(prompt);
    story = extractJson(raw);
    if (!story) {
      const raw2 = await askQwen(prompt + "\n\nRemember: respond with ONLY the JSON object, no other text.");
      story = extractJson(raw2);
    }
  } catch (err) {
    console.error(`    ❌ Ollama error: ${err}`);
    return false;
  }

  if (!story || !story.title || !story.pages?.length) {
    console.warn(`    ⚠️  Malformed story response, skipping`);
    return false;
  }
  if (existingTitles.some((t) => t.toLowerCase() === story!.title.toLowerCase())) {
    console.warn(`    ⚠️  Duplicate title "${story.title}", skipping`);
    return false;
  }

  let slug = slugify(story.title);
  let suffix = 1;
  while (await db.story.findUnique({ where: { slug } })) {
    slug = `${slugify(story.title)}-${++suffix}`;
  }

  if (DRY_RUN) {
    const outDir = path.join("src", "data", "seed", "generated");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `stories-${new Date().toISOString().split("T")[0]}-${slug}.json`);
    fs.writeFileSync(outFile, JSON.stringify({ ...story, slug, unitId: unit.id }, null, 2));
    console.log(`    ✓ (dry-run) "${story.title}" → ${outFile}`);
    return true;
  }

  await db.story.create({
    data: {
      languageId: unit.language.id,
      unitId: unit.id,
      title: story.title,
      slug,
      description: story.description,
      coverEmoji: story.coverEmoji,
      sortOrder: unit._count.stories + 1,
      isPublished: true,
      pages: {
        create: story.pages.map((p, i) => ({
          pageNumber: i + 1,
          sourceText: p.sourceText,
          translatedText: p.translatedText,
          wordMap: p.wordMap,
        })),
      },
    },
  });

  console.log(`    ✓ "${story.title}" (${story.pages.length} pages)`);
  return true;
}

async function run() {
  const start = Date.now();
  console.log(`\n📖 Story Generator started at ${new Date().toISOString()}${DRY_RUN ? " (dry-run)" : ""}`);

  const units = await db.unit.findMany({
    where: { language: { isActive: true } },
    include: { _count: { select: { stories: true } }, language: true },
    orderBy: [{ language: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const underStocked = units.filter((u) => u._count.stories < u.targetStoryCount);
  console.log(`Found ${underStocked.length} units below target story count`);

  let created = 0;
  const errors: string[] = [];

  for (const unit of underStocked) {
    if (created >= MAX_TOTAL_PER_RUN) {
      console.log(`  ⏸️  Reached max per run (${MAX_TOTAL_PER_RUN}) — remaining units continue next run`);
      break;
    }
    console.log(`\n  📚 Unit: "${unit.title}" [${unit.language.name}]`);
    try {
      const ok = await generateStoryForUnit(unit);
      if (ok) created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Unit "${unit.title}": ${msg}`);
      errors.push(`${unit.title}: ${msg}`);
    }
  }

  const durationMs = Date.now() - start;
  if (!DRY_RUN) {
    await db.generatorLog.create({
      data: { workerType: "stories", unitsProcessed: underStocked.length, itemsCreated: created, errors, durationMs },
    });
  }

  console.log(`\n✅ Story Generator done — ${created} new stories, ${(durationMs / 1000).toFixed(1)}s`);
  await db.$disconnect();
}

run().catch(async (err) => {
  console.error("Story Generator fatal error:", err);
  await db.$disconnect();
  process.exit(1);
});
