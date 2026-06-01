import type { SeedUnit } from "./types";

// Kamba (Kikamba) seed content
// Source: thinkKenya/kenyan-low-resource-language-data (CC BY 4.0)

export const KAMBA_UNITS: SeedUnit[] = [
  {
    title: "Basic Greetings",
    description: "Say hello and ask how someone is in Kikamba",
    sortOrder: 1,
    iconEmoji: "👋",
    color: "pink",
    lessons: [
      {
        title: "Say Hello",
        sortOrder: 1,
        xpReward: 10,
        exercises: [
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 1, data: { prompt: "Ũkũũ / Mwamũe", instruction: "What does this Kamba greeting mean?", options: [{ id: "a", text: "Goodbye", isCorrect: false }, { id: "b", text: "Hello / Good day", isCorrect: true }, { id: "c", text: "Good night", isCorrect: false }, { id: "d", text: "Welcome", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 2, data: { prompt: "Wĩ ata?", instruction: "What does this phrase mean?", options: [{ id: "a", text: "What is your name?", isCorrect: false }, { id: "b", text: "How are you?", isCorrect: true }, { id: "c", text: "Where are you going?", isCorrect: false }, { id: "d", text: "Good morning", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 3, data: { prompt: "Nĩ mweo / Ndĩ mweo", instruction: "Response to 'How are you?' — what does it mean?", options: [{ id: "a", text: "I am tired", isCorrect: false }, { id: "b", text: "I am fine / I am alive", isCorrect: true }, { id: "c", text: "I don't know", isCorrect: false }, { id: "d", text: "Not bad", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 4, data: { prompt: "Thiĩ mweo", instruction: "This is a farewell. What does it mean?", options: [{ id: "a", text: "Go well / Goodbye", isCorrect: true }, { id: "b", text: "See you tomorrow", isCorrect: false }, { id: "c", text: "Come back soon", isCorrect: false }, { id: "d", text: "Good night", isCorrect: false }] } },
          { type: "MATCH_PAIRS", sortOrder: 5, data: { instruction: "Match Kikamba to English", pairs: [{ id: "1", left: "Mwamũe", right: "Hello" }, { id: "2", left: "Wĩ ata?", right: "How are you?" }, { id: "3", left: "Ndĩ mweo", right: "I am fine" }, { id: "4", left: "Thiĩ mweo", right: "Go well" }] } },
          { type: "TRANSLATE_INPUT", sortOrder: 6, data: { prompt: "How are you? (in Kikamba)", acceptedAnswers: ["wĩ ata", "wi ata", "wĩ ata?"], hint: "A common Kamba greeting" } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 7, data: { prompt: "Nĩ wĩo / Asante", instruction: "What does this word mean?", options: [{ id: "a", text: "Sorry", isCorrect: false }, { id: "b", text: "Please", isCorrect: false }, { id: "c", text: "Thank you", isCorrect: true }, { id: "d", text: "Good", isCorrect: false }] } },
          { type: "WORD_ARRANGE", sortOrder: 8, data: { instruction: "Arrange: 'Go well'", wordTokens: [{ id: "1", text: "Thiĩ" }, { id: "2", text: "mweo" }], correctOrder: ["1", "2"] } },
        ],
      },
    ],
  },
];
