import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });
import { PrismaClient, ExerciseType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BADGES = [
  { slug: "first_lesson", name: "First Step", description: "Complete your very first lesson", imageUrl: "/images/badges/first_lesson.png", xpBonus: 25, criteria: { type: "lesson_count", threshold: 1 } },
  { slug: "streak_3", name: "On a Roll", description: "Maintain a 3-day learning streak", imageUrl: "/images/badges/streak_3.png", xpBonus: 25, criteria: { type: "streak_days", threshold: 3 } },
  { slug: "streak_7", name: "Week Warrior", description: "7 days in a row — impressive!", imageUrl: "/images/badges/streak_7.png", xpBonus: 50, criteria: { type: "streak_days", threshold: 7 } },
  { slug: "streak_30", name: "Monthly Master", description: "30-day streak — legendary!", imageUrl: "/images/badges/streak_30.png", xpBonus: 100, criteria: { type: "streak_days", threshold: 30 } },
  { slug: "perfect_lesson", name: "Flawless", description: "Complete a lesson with no mistakes", imageUrl: "/images/badges/perfect.png", xpBonus: 30, criteria: { type: "perfect_lessons", threshold: 1 } },
  { slug: "xp_500", name: "Knowledge Seeker", description: "Earn 500 total XP", imageUrl: "/images/badges/xp_500.png", xpBonus: 50, criteria: { type: "xp_total", threshold: 500 } },
  { slug: "unit_complete", name: "Unit Champion", description: "Complete all lessons in a unit", imageUrl: "/images/badges/unit.png", xpBonus: 50, criteria: { type: "unit_complete", threshold: 1 } },
  { slug: "multilingual", name: "Multilingual", description: "Start learning a second language", imageUrl: "/images/badges/multilingual.png", xpBonus: 75, criteria: { type: "language_count", threshold: 2 } },
];

const KIKUYU_UNITS = [
  {
    title: "Basic Greetings",
    description: "Say hello, goodbye, and ask how someone is",
    sortOrder: 1,
    iconEmoji: "👋",
    color: "emerald",
    lessons: [
      {
        title: "Say Hello",
        description: "Learn the most common greetings",
        sortOrder: 1,
        xpReward: 10,
        exercises: [
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 1, data: { prompt: "Nĩ wega", promptAudio: "/audio/kikuyu/unit-1/ni_wega.mp3", instruction: "What does this mean?", options: [{ id: "a", text: "Goodbye", isCorrect: false }, { id: "b", text: "It is good / Fine", isCorrect: true }, { id: "c", text: "Thank you", isCorrect: false }, { id: "d", text: "Good morning", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 2, data: { prompt: "Nĩ ūhoro waku?", promptAudio: "/audio/kikuyu/unit-1/ni_uhoro_waku.mp3", instruction: "What does this phrase mean?", options: [{ id: "a", text: "What is your name?", isCorrect: false }, { id: "b", text: "Where are you going?", isCorrect: false }, { id: "c", text: "How are you?", isCorrect: true }, { id: "d", text: "Good evening", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 3, data: { prompt: "Nĩ wega", promptAudio: "/audio/kikuyu/unit-1/ni_wega.mp3", instruction: "Someone greets you — how do you say you are fine?", options: [{ id: "a", text: "Nĩ wega", isCorrect: true }, { id: "b", text: "Thiĩ", isCorrect: false }, { id: "c", text: "Ūhoro", isCorrect: false }, { id: "d", text: "Ngai", isCorrect: false }] } },
          { type: "TRANSLATE_INPUT", sortOrder: 4, data: { prompt: "How are you?", acceptedAnswers: ["nĩ ūhoro waku", "ni uhoro waku", "nĩ ūhoro waku?"], hint: "Start with 'Nĩ'" } },
          { type: "WORD_ARRANGE", sortOrder: 5, data: { instruction: "Arrange: 'How are you?'", wordTokens: [{ id: "1", text: "Nĩ" }, { id: "2", text: "ūhoro" }, { id: "3", text: "waku?" }], correctOrder: ["1", "2", "3"], audioUrl: "/audio/kikuyu/unit-1/ni_uhoro_waku.mp3" } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 6, data: { prompt: "Wĩ mwega?", instruction: "What is this greeting?", options: [{ id: "a", text: "Are you well?", isCorrect: true }, { id: "b", text: "Good night", isCorrect: false }, { id: "c", text: "See you later", isCorrect: false }, { id: "d", text: "Thank you very much", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 7, data: { prompt: "Ĩĩ, nĩ mwega", instruction: "Translate: Yes, I am well", options: [{ id: "a", text: "No, I am not", isCorrect: false }, { id: "b", text: "Maybe, thank you", isCorrect: false }, { id: "c", text: "Yes, I am well", isCorrect: true }, { id: "d", text: "I am going", isCorrect: false }] } },
          { type: "MATCH_PAIRS", sortOrder: 8, data: { instruction: "Match the Kikuyu to English", pairs: [{ id: "1", left: "Ĩĩ", right: "Yes" }, { id: "2", left: "Aca", right: "No" }, { id: "3", left: "Nĩ wega", right: "It is good" }, { id: "4", left: "Wĩ mwega?", right: "Are you well?" }] } },
        ],
      },
      {
        title: "Hello & Goodbye",
        description: "Greet people and say farewell",
        sortOrder: 2,
        xpReward: 10,
        exercises: [
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 1, data: { prompt: "Wĩ mwega, (name)?", instruction: "This is used to greet someone. What does it mean?", options: [{ id: "a", text: "Goodbye, (name)!", isCorrect: false }, { id: "b", text: "Good morning, (name)!", isCorrect: false }, { id: "c", text: "Are you well, (name)?", isCorrect: true }, { id: "d", text: "Thank you, (name)!", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 2, data: { prompt: "Thiĩ wega", promptAudio: "/audio/kikuyu/unit-1/thii_wega.mp3", instruction: "This is a farewell. What does it mean?", options: [{ id: "a", text: "Come here", isCorrect: false }, { id: "b", text: "Go well / Goodbye", isCorrect: true }, { id: "c", text: "Stay safe", isCorrect: false }, { id: "d", text: "See you tomorrow", isCorrect: false }] } },
          { type: "TRANSLATE_INPUT", sortOrder: 3, data: { prompt: "Goodbye (Go well)", acceptedAnswers: ["thiĩ wega", "thii wega", "thiī wega"], hint: "Literally means 'go well'" } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 4, data: { prompt: "Tũgũthanane", instruction: "What does this farewell phrase mean?", options: [{ id: "a", text: "Until tomorrow", isCorrect: false }, { id: "b", text: "We will meet again", isCorrect: true }, { id: "c", text: "Go home safely", isCorrect: false }, { id: "d", text: "Thank you for coming", isCorrect: false }] } },
          { type: "MATCH_PAIRS", sortOrder: 5, data: { instruction: "Match greetings to their meanings", pairs: [{ id: "1", left: "Wĩ mwega?", right: "Are you well?" }, { id: "2", left: "Ĩĩ, nĩ mwega", right: "Yes, I am well" }, { id: "3", left: "Thiĩ wega", right: "Go well" }, { id: "4", left: "Tũgũthanane", right: "We will meet again" }] } },
          { type: "WORD_ARRANGE", sortOrder: 6, data: { instruction: "Arrange: 'Go well'", wordTokens: [{ id: "1", text: "Thiĩ" }, { id: "2", text: "wega" }], correctOrder: ["1", "2"], audioUrl: "/audio/kikuyu/unit-1/thii_wega.mp3" } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 7, data: { prompt: "Nĩ mwega", instruction: "Response to 'Are you well?' — translate:", options: [{ id: "a", text: "I am tired", isCorrect: false }, { id: "b", text: "I am not well", isCorrect: false }, { id: "c", text: "I am well", isCorrect: true }, { id: "d", text: "I am going", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 8, data: { prompt: "Aca", promptAudio: "/audio/kikuyu/unit-1/aca.mp3", instruction: "What does this word mean?", options: [{ id: "a", text: "Yes", isCorrect: false }, { id: "b", text: "Please", isCorrect: false }, { id: "c", text: "No", isCorrect: true }, { id: "d", text: "Hello", isCorrect: false }] } },
        ],
      },
    ],
  },
  {
    title: "Numbers 1–10",
    description: "Count from one to ten in Kikuyu",
    sortOrder: 2,
    iconEmoji: "🔢",
    color: "blue",
    lessons: [
      {
        title: "One to Five",
        description: "Learn numbers ĩmwe through ĩtano",
        sortOrder: 1,
        xpReward: 10,
        exercises: [
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 1, data: { prompt: "ĩmwe", instruction: "What number is this?", options: [{ id: "a", text: "Two", isCorrect: false }, { id: "b", text: "Three", isCorrect: false }, { id: "c", text: "One", isCorrect: true }, { id: "d", text: "Five", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 2, data: { prompt: "igĩrĩ", instruction: "What number is this?", options: [{ id: "a", text: "One", isCorrect: false }, { id: "b", text: "Two", isCorrect: true }, { id: "c", text: "Four", isCorrect: false }, { id: "d", text: "Three", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 3, data: { prompt: "ĩtatũ", instruction: "What number is this?", options: [{ id: "a", text: "Five", isCorrect: false }, { id: "b", text: "Two", isCorrect: false }, { id: "c", text: "Four", isCorrect: false }, { id: "d", text: "Three", isCorrect: true }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 4, data: { prompt: "ĩnya", instruction: "What number is this?", options: [{ id: "a", text: "Four", isCorrect: true }, { id: "b", text: "Six", isCorrect: false }, { id: "c", text: "One", isCorrect: false }, { id: "d", text: "Eight", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 5, data: { prompt: "ĩtano", instruction: "What number is this?", options: [{ id: "a", text: "Three", isCorrect: false }, { id: "b", text: "Five", isCorrect: true }, { id: "c", text: "Seven", isCorrect: false }, { id: "d", text: "Ten", isCorrect: false }] } },
          { type: "MATCH_PAIRS", sortOrder: 6, data: { instruction: "Match numbers to their Kikuyu words", pairs: [{ id: "1", left: "1", right: "ĩmwe" }, { id: "2", left: "2", right: "igĩrĩ" }, { id: "3", left: "3", right: "ĩtatũ" }, { id: "4", left: "4", right: "ĩnya" }] } },
          { type: "TRANSLATE_INPUT", sortOrder: 7, data: { prompt: "Five (in Kikuyu)", acceptedAnswers: ["ĩtano", "itano", "ītano"], hint: "The 5th number" } },
          { type: "WORD_ARRANGE", sortOrder: 8, data: { instruction: "Put the numbers in order: 1, 2, 3", wordTokens: [{ id: "1", text: "ĩmwe" }, { id: "2", text: "igĩrĩ" }, { id: "3", text: "ĩtatũ" }], correctOrder: ["1", "2", "3"] } },
        ],
      },
      {
        title: "Six to Ten",
        description: "Learn numbers itandatũ through ikũmi",
        sortOrder: 2,
        xpReward: 10,
        exercises: [
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 1, data: { prompt: "itandatũ", instruction: "What number is this?", options: [{ id: "a", text: "Seven", isCorrect: false }, { id: "b", text: "Six", isCorrect: true }, { id: "c", text: "Eight", isCorrect: false }, { id: "d", text: "Five", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 2, data: { prompt: "mũgwanja", instruction: "What number is this?", options: [{ id: "a", text: "Six", isCorrect: false }, { id: "b", text: "Nine", isCorrect: false }, { id: "c", text: "Eight", isCorrect: false }, { id: "d", text: "Seven", isCorrect: true }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 3, data: { prompt: "ĩnana", instruction: "What number is this?", options: [{ id: "a", text: "Eight", isCorrect: true }, { id: "b", text: "Four", isCorrect: false }, { id: "c", text: "Three", isCorrect: false }, { id: "d", text: "Ten", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 4, data: { prompt: "kenda", instruction: "What number is this?", options: [{ id: "a", text: "Six", isCorrect: false }, { id: "b", text: "Seven", isCorrect: false }, { id: "c", text: "Nine", isCorrect: true }, { id: "d", text: "Ten", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 5, data: { prompt: "ikũmi", instruction: "What number is this?", options: [{ id: "a", text: "Eight", isCorrect: false }, { id: "b", text: "Nine", isCorrect: false }, { id: "c", text: "Ten", isCorrect: true }, { id: "d", text: "Six", isCorrect: false }] } },
          { type: "MATCH_PAIRS", sortOrder: 6, data: { instruction: "Match numbers 6–9", pairs: [{ id: "1", left: "6", right: "itandatũ" }, { id: "2", left: "7", right: "mũgwanja" }, { id: "3", left: "8", right: "ĩnana" }, { id: "4", left: "9", right: "kenda" }] } },
          { type: "TRANSLATE_INPUT", sortOrder: 7, data: { prompt: "Ten (in Kikuyu)", acceptedAnswers: ["ikũmi", "ikumi", "ĩkũmi"], hint: "The last number in this lesson" } },
          { type: "WORD_ARRANGE", sortOrder: 8, data: { instruction: "Order: 8, 9, 10", wordTokens: [{ id: "1", text: "ĩnana" }, { id: "2", text: "kenda" }, { id: "3", text: "ikũmi" }], correctOrder: ["1", "2", "3"] } },
        ],
      },
    ],
  },
  {
    title: "Family",
    description: "Talk about your family members",
    sortOrder: 3,
    iconEmoji: "👨‍👩‍👧",
    color: "purple",
    lessons: [
      {
        title: "Parents & Siblings",
        description: "Mother, father, brother, sister",
        sortOrder: 1,
        xpReward: 10,
        exercises: [
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 1, data: { prompt: "māīthe", instruction: "What family member is this?", options: [{ id: "a", text: "Mother", isCorrect: false }, { id: "b", text: "Father", isCorrect: true }, { id: "c", text: "Brother", isCorrect: false }, { id: "d", text: "Grandfather", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 2, data: { prompt: "nyina", instruction: "What family member is this?", options: [{ id: "a", text: "Sister", isCorrect: false }, { id: "b", text: "Aunt", isCorrect: false }, { id: "c", text: "Mother", isCorrect: true }, { id: "d", text: "Grandmother", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 3, data: { prompt: "mwana wa mūrũme", instruction: "Translate to English:", options: [{ id: "a", text: "Sister", isCorrect: false }, { id: "b", text: "Brother / Son", isCorrect: true }, { id: "c", text: "Uncle", isCorrect: false }, { id: "d", text: "Father", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 4, data: { prompt: "mwana wa mũirĩtu", instruction: "Translate to English:", options: [{ id: "a", text: "Brother", isCorrect: false }, { id: "b", text: "Daughter / Sister", isCorrect: true }, { id: "c", text: "Mother", isCorrect: false }, { id: "d", text: "Aunt", isCorrect: false }] } },
          { type: "MATCH_PAIRS", sortOrder: 5, data: { instruction: "Match family words", pairs: [{ id: "1", left: "māīthe", right: "Father" }, { id: "2", left: "nyina", right: "Mother" }, { id: "3", left: "mwana", right: "Child" }, { id: "4", left: "kūrū", right: "Elder/Grandparent" }] } },
          { type: "TRANSLATE_INPUT", sortOrder: 6, data: { prompt: "Father (in Kikuyu)", acceptedAnswers: ["māīthe", "maithe", "mãĩthe"], hint: "The male parent" } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 7, data: { prompt: "Ndĩ na māīthe na nyina", instruction: "Translate: I have a father and a mother", options: [{ id: "a", text: "I have brothers and sisters", isCorrect: false }, { id: "b", text: "I have a father and a mother", isCorrect: true }, { id: "c", text: "My father is here", isCorrect: false }, { id: "d", text: "My family is big", isCorrect: false }] } },
          { type: "WORD_ARRANGE", sortOrder: 8, data: { instruction: "Arrange: 'I have a father and mother'", wordTokens: [{ id: "1", text: "Ndĩ" }, { id: "2", text: "na" }, { id: "3", text: "māīthe" }, { id: "4", text: "na" }, { id: "5", text: "nyina" }], correctOrder: ["1", "2", "3", "4", "5"] } },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  // Badges
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    });
  }
  console.log(`✓ ${BADGES.length} badges`);

  // Kikuyu language
  const kikuyu = await prisma.language.upsert({
    where: { slug: "kikuyu" },
    update: { isActive: true },
    create: {
      slug: "kikuyu",
      name: "Kikuyu",
      nativeName: "Gĩkũyũ",
      description: "The language of the Kikuyu people of central Kenya",
      flagEmoji: "🇰🇪",
      isActive: true,
      sortOrder: 1,
    },
  });

  // Stub inactive languages
  for (const [slug, name, native] of [["luo", "Luo", "Dholuo"], ["luhya", "Luhya", "Luluhya"], ["kamba", "Kamba", "Kikamba"]]) {
    await prisma.language.upsert({
      where: { slug },
      update: {},
      create: { slug, name, nativeName: native, flagEmoji: "🇰🇪", isActive: false, sortOrder: 2 },
    });
  }

  // Units, lessons, exercises
  let totalExercises = 0;
  for (const unitData of KIKUYU_UNITS) {
    const { lessons: lessonsData, ...unitFields } = unitData;
    const unit = await prisma.unit.upsert({
      where: { id: `kikuyu-unit-${unitFields.sortOrder}` },
      update: { ...unitFields, languageId: kikuyu.id },
      create: { id: `kikuyu-unit-${unitFields.sortOrder}`, ...unitFields, languageId: kikuyu.id },
    });

    for (const lessonData of lessonsData) {
      const { exercises: exercisesData, ...lessonFields } = lessonData;
      const lesson = await prisma.lesson.upsert({
        where: { id: `kikuyu-u${unitFields.sortOrder}-l${lessonFields.sortOrder}` },
        update: { ...lessonFields, unitId: unit.id },
        create: { id: `kikuyu-u${unitFields.sortOrder}-l${lessonFields.sortOrder}`, ...lessonFields, unitId: unit.id },
      });

      for (const ex of exercisesData) {
        const exId = `kikuyu-u${unitFields.sortOrder}-l${lessonFields.sortOrder}-e${ex.sortOrder}`;
        const exTyped = { ...ex, type: ex.type as ExerciseType };
        await prisma.exercise.upsert({
          where: { id: exId },
          update: { ...exTyped, lessonId: lesson.id },
          create: { id: exId, ...exTyped, lessonId: lesson.id },
        });
        totalExercises++;
      }
    }
  }

  console.log(`✓ ${KIKUYU_UNITS.length} units, ${KIKUYU_UNITS.flatMap(u => u.lessons).length} lessons, ${totalExercises} exercises`);
  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
