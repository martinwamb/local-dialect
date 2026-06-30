/**
 * Generate initial Kikuyu stories using Qwen2.5:14b via Ollama.
 * Usage: npx tsx scripts/generate-stories.ts [--dry-run]
 *
 * Requires: Ollama running at 127.0.0.1:11434 with qwen2.5:14b loaded.
 * Posts stories to POST /api/admin/stories (requires NEXTAUTH_URL + admin session).
 *
 * Alternatively, writes JSON to src/data/seed/generated/stories-{date}.json
 * if --dry-run is passed.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import fs from "fs";
import path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const MODEL = "qwen3:14b";
const OLLAMA = "http://127.0.0.1:11434";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://dialect.wambugumartin.com";

const STORY_TOPICS = [
  {
    slug: "greeting-grandmother",
    title: "Greeting Grandmother",
    coverEmoji: "👵",
    description: "A child visits their grandmother and practises greetings",
    languageSlug: "kikuyu",
    unitSortOrder: 1,
    topic: "A young child visiting their grandmother and exchanging greetings",
    vocabulary: ["Wĩ mwega?", "Nĩ mwega", "Māīthe", "Nyina", "Thiĩ wega", "Ĩĩ", "mwana"],
  },
  {
    slug: "counting-at-market",
    title: "At the Market",
    coverEmoji: "🛒",
    description: "A child helps count items at the local market",
    languageSlug: "kikuyu",
    unitSortOrder: 2,
    topic: "A child helping their parent count fruits and vegetables at the market",
    vocabulary: ["ĩmwe", "igĩrĩ", "ĩtatũ", "ĩnya", "ĩtano", "mwana", "māīthe"],
  },
  {
    slug: "my-family",
    title: "My Family",
    coverEmoji: "👨‍👩‍👧",
    description: "A child introduces their family members",
    languageSlug: "kikuyu",
    unitSortOrder: 3,
    topic: "A child introducing their family — mother, father, siblings",
    vocabulary: ["māīthe", "nyina", "mwana", "kūrū", "Nĩ mwega", "Ndĩ na māīthe na nyina"],
  },
];

async function generateStoryPages(topic: typeof STORY_TOPICS[0]): Promise<{
  sourceText: string;
  translatedText: string;
  wordMap: Record<string, string>;
}[]> {
  const vocabList = topic.vocabulary.join(", ");
  const prompt = `You are a Kikuyu language teacher creating educational content for beginners.

Write a simple children's story in Kikuyu (Gĩkũyũ language) about: ${topic.topic}

Requirements:
- Exactly 5 short sentences (one per story page)
- Use simple vocabulary appropriate for beginners, including these words where natural: ${vocabList}
- Each sentence should be short (5-12 words in Kikuyu)
- Include a word-by-word vocabulary map for each sentence

Return ONLY valid JSON in this exact format (no other text):
[
  {
    "sourceText": "Kikuyu sentence here",
    "translatedText": "English translation here",
    "wordMap": {"kikuyu_word": "english_meaning", "another_word": "meaning"}
  }
]

Make the story warm, culturally appropriate, and educational. Use authentic Kikuyu vocabulary.`;

  console.log(`  Calling ${MODEL}...`);
  const res = await fetch(`${OLLAMA}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, stream: false, think: false }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json() as { response: string };

  const jsonMatch = data.response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`Could not parse JSON from response: ${data.response.slice(0, 200)}`);

  return JSON.parse(jsonMatch[0]);
}

async function main() {
  const allStories: object[] = [];

  for (const topic of STORY_TOPICS) {
    console.log(`\nGenerating: "${topic.title}"...`);
    try {
      const pages = await generateStoryPages(topic);
      console.log(`  ✓ ${pages.length} pages generated`);

      const storyData = {
        title: topic.title,
        slug: topic.slug,
        coverEmoji: topic.coverEmoji,
        description: topic.description,
        languageSlug: topic.languageSlug,
        unitSortOrder: topic.unitSortOrder,
        pages,
      };

      allStories.push(storyData);

      if (!DRY_RUN) {
        console.log(`  Posting to ${APP_URL}/api/admin/stories...`);
        const postRes = await fetch(`${APP_URL}/api/admin/stories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-bypass": process.env.CRON_SECRET ?? "",
          },
          body: JSON.stringify(storyData),
        });
        if (postRes.ok) {
          console.log(`  ✓ Story created`);
        } else {
          console.error(`  ✗ Failed: ${postRes.status} ${await postRes.text()}`);
        }
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err}`);
    }
  }

  // Always write to file for review
  const outDir = path.join("src", "data", "seed", "generated");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `stories-${new Date().toISOString().split("T")[0]}.json`);
  fs.writeFileSync(outFile, JSON.stringify(allStories, null, 2));
  console.log(`\n✓ Stories written to ${outFile}`);

  if (DRY_RUN) {
    console.log("Dry run — stories not posted to API. Review the file then run without --dry-run.");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
