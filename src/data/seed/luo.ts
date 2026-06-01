import type { SeedUnit } from "./types";

// Luo (Dholuo) seed content
// Source: thinkKenya/kenyan-low-resource-language-data (CC BY 4.0)
// Run: npx tsx scripts/import-content.ts --language luo --limit 100
// to auto-generate additional exercises, then merge here after review.

export const LUO_UNITS: SeedUnit[] = [
  {
    title: "Basic Greetings",
    description: "Say hello and ask how someone is in Dholuo",
    sortOrder: 1,
    iconEmoji: "👋",
    color: "emerald",
    lessons: [
      {
        title: "Say Hello",
        description: "Learn the most common Luo greetings",
        sortOrder: 1,
        xpReward: 10,
        exercises: [
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 1, data: { prompt: "Misawa", instruction: "What does this greeting mean?", options: [{ id: "a", text: "Goodbye", isCorrect: false }, { id: "b", text: "Hello / Good day", isCorrect: true }, { id: "c", text: "Thank you", isCorrect: false }, { id: "d", text: "Good night", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 2, data: { prompt: "Idhi nade?", instruction: "What does this phrase mean?", options: [{ id: "a", text: "What is your name?", isCorrect: false }, { id: "b", text: "Where are you going?", isCorrect: false }, { id: "c", text: "How are you?", isCorrect: true }, { id: "d", text: "How old are you?", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 3, data: { prompt: "Adhi maber", instruction: "What does this response mean?", options: [{ id: "a", text: "I am fine / I go well", isCorrect: true }, { id: "b", text: "I am tired", isCorrect: false }, { id: "c", text: "I don't know", isCorrect: false }, { id: "d", text: "See you later", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 4, data: { prompt: "Oriti", instruction: "This is a farewell. What does it mean?", options: [{ id: "a", text: "See you / Goodbye", isCorrect: true }, { id: "b", text: "Thank you", isCorrect: false }, { id: "c", text: "Good morning", isCorrect: false }, { id: "d", text: "Come back", isCorrect: false }] } },
          { type: "MATCH_PAIRS", sortOrder: 5, data: { instruction: "Match Dholuo to English", pairs: [{ id: "1", left: "Misawa", right: "Hello" }, { id: "2", left: "Idhi nade?", right: "How are you?" }, { id: "3", left: "Adhi maber", right: "I am fine" }, { id: "4", left: "Oriti", right: "Goodbye" }] } },
          { type: "TRANSLATE_INPUT", sortOrder: 6, data: { prompt: "How are you? (in Dholuo)", acceptedAnswers: ["idhi nade", "idhi nade?"], hint: "A common Luo greeting" } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 7, data: { prompt: "Erokamano", instruction: "What does this word mean?", options: [{ id: "a", text: "Sorry", isCorrect: false }, { id: "b", text: "Please", isCorrect: false }, { id: "c", text: "Thank you", isCorrect: true }, { id: "d", text: "Welcome", isCorrect: false }] } },
          { type: "WORD_ARRANGE", sortOrder: 8, data: { instruction: "Arrange: 'I am fine'", wordTokens: [{ id: "1", text: "Adhi" }, { id: "2", text: "maber" }], correctOrder: ["1", "2"] } },
        ],
      },
    ],
  },
  {
    title: "Numbers 1–10",
    description: "Count in Dholuo",
    sortOrder: 2,
    iconEmoji: "🔢",
    color: "blue",
    lessons: [
      {
        title: "One to Five",
        description: "achiel through abich",
        sortOrder: 1,
        xpReward: 10,
        exercises: [
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 1, data: { prompt: "achiel", instruction: "What number?", options: [{ id: "a", text: "Two", isCorrect: false }, { id: "b", text: "One", isCorrect: true }, { id: "c", text: "Three", isCorrect: false }, { id: "d", text: "Five", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 2, data: { prompt: "ariyo", instruction: "What number?", options: [{ id: "a", text: "One", isCorrect: false }, { id: "b", text: "Three", isCorrect: false }, { id: "c", text: "Two", isCorrect: true }, { id: "d", text: "Four", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 3, data: { prompt: "adek", instruction: "What number?", options: [{ id: "a", text: "Five", isCorrect: false }, { id: "b", text: "Three", isCorrect: true }, { id: "c", text: "Two", isCorrect: false }, { id: "d", text: "Four", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 4, data: { prompt: "ang'wen", instruction: "What number?", options: [{ id: "a", text: "Four", isCorrect: true }, { id: "b", text: "Six", isCorrect: false }, { id: "c", text: "Eight", isCorrect: false }, { id: "d", text: "Two", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 5, data: { prompt: "abich", instruction: "What number?", options: [{ id: "a", text: "Three", isCorrect: false }, { id: "b", text: "Six", isCorrect: false }, { id: "c", text: "Five", isCorrect: true }, { id: "d", text: "Ten", isCorrect: false }] } },
          { type: "MATCH_PAIRS", sortOrder: 6, data: { instruction: "Match numbers to Dholuo", pairs: [{ id: "1", left: "1", right: "achiel" }, { id: "2", left: "2", right: "ariyo" }, { id: "3", left: "3", right: "adek" }, { id: "4", left: "4", right: "ang'wen" }] } },
          { type: "TRANSLATE_INPUT", sortOrder: 7, data: { prompt: "Five (in Dholuo)", acceptedAnswers: ["abich"], hint: "The 5th Dholuo number" } },
          { type: "WORD_ARRANGE", sortOrder: 8, data: { instruction: "Order: 1, 2, 3", wordTokens: [{ id: "1", text: "achiel" }, { id: "2", text: "ariyo" }, { id: "3", text: "adek" }], correctOrder: ["1", "2", "3"] } },
        ],
      },
    ],
  },
];
