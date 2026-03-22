
window.TEST_PACK = {
  packId: "eiken4_v1",
  examType: "EIKEN",
  level: "4",
  title: "EIKEN Grade 4 Diagnostic Test",
  version: "2026.03",
  timezone: "Asia/Tokyo",
  totalQuestions: 10,
  totalTimeLimitSec: 300,
  sectionOrder: ["vocab", "grammar", "reading", "function"],

  sections: [
    {
      sectionId: "vocab",
      title: "Vocabulary",
      order: 1,
      questionStart: 1,
      questionEnd: 4,
      questionCount: 4,
      timeLimitSec: 96,
      expectedPerQuestionSec: 24,
      instructions: "Choose the best word or phrase to complete each sentence."
    },
    {
      sectionId: "grammar",
      title: "Grammar",
      order: 2,
      questionStart: 5,
      questionEnd: 7,
      questionCount: 3,
      timeLimitSec: 90,
      expectedPerQuestionSec: 30,
      instructions: "Choose the best answer to complete each sentence correctly."
    },
    {
      sectionId: "reading",
      title: "Reading",
      order: 3,
      questionStart: 8,
      questionEnd: 9,
      questionCount: 2,
      timeLimitSec: 86,
      expectedPerQuestionSec: 43,
      instructions: "Read each sentence or passage and choose the best answer."
    },
    {
      sectionId: "function",
      title: "Conversation / Function",
      order: 4,
      questionStart: 10,
      questionEnd: 10,
      questionCount: 1,
      timeLimitSec: 20,
      expectedPerQuestionSec: 20,
      instructions: "Choose the most natural response or best expression for the situation."
    }
  ],

  questions: [
    // q001-q010 exactly as already written
  ]
};
