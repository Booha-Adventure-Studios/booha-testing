
window.TEST_PACK = {
  packId: "eiken_4_v1",
  examType: "EIKEN",
  level: "4",
  title: "EIKEN Grade 4 Diagnostic Test",
  version: "2026.03",
  timezone: "Asia/Tokyo",
  totalQuestions: 100,
  totalTimeLimitSec: 3000,
  sectionOrder: ["vocab", "grammar", "reading", "function"],

  sections: [
    {
      sectionId: "vocab",
      title: "Vocabulary",
      order: 1,
      questionStart: 1,
      questionEnd: 30,
      questionCount: 30,
      timeLimitSec: 720,
      expectedPerQuestionSec: 24,
      instructions: "Choose the best word or phrase to complete each sentence."
    },
    {
      sectionId: "grammar",
      title: "Grammar",
      order: 2,
      questionStart: 31,
      questionEnd: 60,
      questionCount: 30,
      timeLimitSec: 900,
      expectedPerQuestionSec: 30,
      instructions: "Choose the best answer to complete each sentence correctly."
    },
    {
      sectionId: "reading",
      title: "Reading",
      order: 3,
      questionStart: 61,
      questionEnd: 85,
      questionCount: 25,
      timeLimitSec: 1080,
      expectedPerQuestionSec: 43,
      instructions: "Read each sentence or passage and choose the best answer."
    },
    {
      sectionId: "function",
      title: "Conversation / Function",
      order: 4,
      questionStart: 86,
      questionEnd: 100,
      questionCount: 15,
      timeLimitSec: 300,
      expectedPerQuestionSec: 20,
      instructions: "Choose the most natural response or best expression for the situation."
    }
  ],

  questions: [
    {
      questionId: "q001",
      number: 1,
      sectionId: "vocab",
      type: "mcq_sentence",
      prompt: "I usually ___ my homework after dinner.",
      passage: "",
      choices: ["do", "make", "take", "finish"],
      correctIndex: 0,
      points: 1,
      skill: "vocab",
      subskill: "verb",
      difficulty: 2,
      explanation: 'We say "do homework," not "make homework."'
    },
    {
      questionId: "q002",
      number: 2,
      sectionId: "vocab",
      type: "mcq_sentence",
      prompt: "After running for an hour, she felt very ___.",
      passage: "",
      choices: ["tired", "bored", "hungry", "busy"],
      correctIndex: 0,
      points: 1,
      skill: "vocab",
      subskill: "adjective",
      difficulty: 2,
      explanation: '"Tired" best matches the result of running for an hour.'
    },
    {
      questionId: "q003",
      number: 3,
      sectionId: "vocab",
      type: "mcq_sentence",
      prompt: "He ___ a photo of his friends at the park.",
      passage: "",
      choices: ["took", "did", "made", "got"],
      correctIndex: 0,
      points: 1,
      skill: "vocab",
      subskill: "collocation",
      difficulty: 3,
      explanation: 'The natural collocation is "take a photo."'
    },
    {
      questionId: "q004",
      number: 4,
      sectionId: "vocab",
      type: "mcq_sentence",
      prompt: "The keys are ___ the table next to the door.",
      passage: "",
      choices: ["on", "in", "at", "over"],
      correctIndex: 0,
      points: 1,
      skill: "vocab",
      subskill: "preposition",
      difficulty: 2,
      explanation: 'We say something is "on the table."'
    },
    {
      questionId: "q005",
      number: 5,
      sectionId: "grammar",
      type: "mcq_sentence",
      prompt: "She ___ to school by bus every day.",
      passage: "",
      choices: ["goes", "go", "is go", "going"],
      correctIndex: 0,
      points: 1,
      skill: "grammar",
      subskill: "present_simple",
      difficulty: 2,
      explanation: 'For third-person singular in the present simple, use "goes."'
    },
    {
      questionId: "q006",
      number: 6,
      sectionId: "grammar",
      type: "mcq_sentence",
      prompt: "Last weekend, we ___ a movie at home.",
      passage: "",
      choices: ["watched", "watch", "watching", "watches"],
      correctIndex: 0,
      points: 1,
      skill: "grammar",
      subskill: "past_simple",
      difficulty: 2,
      explanation: '"Last weekend" signals past time, so use "watched."'
    },
    {
      questionId: "q007",
      number: 7,
      sectionId: "grammar",
      type: "mcq_sentence",
      prompt: "___ do you usually meet your friends?",
      passage: "",
      choices: ["Where", "What", "When", "Who"],
      correctIndex: 0,
      points: 1,
      skill: "grammar",
      subskill: "question",
      difficulty: 3,
      explanation: 'The question asks about place, so "Where" is correct.'
    },
    {
      questionId: "q008",
      number: 8,
      sectionId: "reading",
      type: "mcq_passage",
      prompt: "What does Ken do after school?",
      passage: "After school, Ken usually goes to the park with his friends. They often play soccer for about an hour.",
      choices: [
        "He studies at home.",
        "He plays soccer at the park.",
        "He watches TV.",
        "He goes to the library."
      ],
      correctIndex: 1,
      points: 1,
      skill: "reading",
      subskill: "detail",
      difficulty: 2,
      explanation: "The passage says Ken goes to the park and plays soccer."
    },
    {
      questionId: "q009",
      number: 9,
      sectionId: "reading",
      type: "mcq_passage",
      prompt: "Why did Yuki go to the shop?",
      passage: "It started to rain when Yuki was outside. She quickly ran to a nearby shop.",
      choices: ["To buy food", "To meet a friend", "To stay dry", "To study"],
      correctIndex: 2,
      points: 1,
      skill: "reading",
      subskill: "inference",
      difficulty: 3,
      explanation: "The passage implies she went there because it started raining."
    },
    {
      questionId: "q010",
      number: 10,
      sectionId: "function",
      type: "mcq_dialogue",
      prompt: "How was your weekend?",
      passage: "",
      choices: [
        "I went hiking with my family.",
        "I am fine.",
        "It is Saturday.",
        "At home."
      ],
      correctIndex: 0,
      points: 1,
      skill: "function",
      subskill: "response",
      difficulty: 3,
      explanation: "This is the most natural response to a question about the weekend."
    }

    // Q011-Q100 go here
  ]
};
