import type { SeedUnit } from "./types";

// Luhya seed content (Lubukusu dialect as base)
// Source: thinkKenya/kenyan-low-resource-language-data (CC BY 4.0)

export const LUHYA_UNITS: SeedUnit[] = [
  {
    title: "Basic Greetings",
    description: "Say hello and ask how someone is in Luhya",
    sortOrder: 1,
    iconEmoji: "👋",
    color: "orange",
    lessons: [
      {
        title: "Say Hello",
        sortOrder: 1,
        xpReward: 10,
        exercises: [
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 1, data: { prompt: "Orie", instruction: "What does this greeting mean?", options: [{ id: "a", text: "Goodbye", isCorrect: false }, { id: "b", text: "Hello", isCorrect: true }, { id: "c", text: "Thank you", isCorrect: false }, { id: "d", text: "Good night", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 2, data: { prompt: "Oli ota?", instruction: "What does this mean?", options: [{ id: "a", text: "What is your name?", isCorrect: false }, { id: "b", text: "How are you?", isCorrect: true }, { id: "c", text: "Where are you from?", isCorrect: false }, { id: "d", text: "What time is it?", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 3, data: { prompt: "Ndi bulai", instruction: "Response to 'How are you?' — what does it mean?", options: [{ id: "a", text: "I am fine", isCorrect: true }, { id: "b", text: "I am tired", isCorrect: false }, { id: "c", text: "I am busy", isCorrect: false }, { id: "d", text: "I don't know", isCorrect: false }] } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 4, data: { prompt: "Khaeni", instruction: "This is a farewell. What does it mean?", options: [{ id: "a", text: "Goodbye", isCorrect: true }, { id: "b", text: "Good morning", isCorrect: false }, { id: "c", text: "Come back", isCorrect: false }, { id: "d", text: "Welcome", isCorrect: false }] } },
          { type: "MATCH_PAIRS", sortOrder: 5, data: { instruction: "Match Luhya to English", pairs: [{ id: "1", left: "Orie", right: "Hello" }, { id: "2", left: "Oli ota?", right: "How are you?" }, { id: "3", left: "Ndi bulai", right: "I am fine" }, { id: "4", left: "Khaeni", right: "Goodbye" }] } },
          { type: "TRANSLATE_INPUT", sortOrder: 6, data: { prompt: "How are you? (in Luhya)", acceptedAnswers: ["oli ota", "oli ota?"], hint: "A common Luhya greeting" } },
          { type: "MULTIPLE_CHOICE_TRANSLATE", sortOrder: 7, data: { prompt: "Asante", instruction: "What does this word mean?", options: [{ id: "a", text: "Sorry", isCorrect: false }, { id: "b", text: "Thank you", isCorrect: true }, { id: "c", text: "Please", isCorrect: false }, { id: "d", text: "Excuse me", isCorrect: false }] } },
          { type: "WORD_ARRANGE", sortOrder: 8, data: { instruction: "Arrange: 'I am fine'", wordTokens: [{ id: "1", text: "Ndi" }, { id: "2", text: "bulai" }], correctOrder: ["1", "2"] } },
        ],
      },
    ],
  },
];
