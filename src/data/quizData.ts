import { QuizPack } from "@/types/type";

export const DEFAULT_QUIZ_PACKS: QuizPack[] = [
  {
    id: 1,
    name: "General Knowledge",
    description: "Mixed topics for everyone",
    questionCount: 500,
    category: "General",
    author: "official",
    questions: [
      {
        id: 1,
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=873&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        correctAnswer: 2,
        explanation: "Paris is the capital and most populous city of France.",
      },
      {
        id: 1,
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        imageUrl: "https://example.com/paris.jpg",
        correctAnswer: 1,
        explanation:
          "Mars is often called the Red Planet due to its reddish appearance.",
      },
    ],
  },
  {
    id: 2,
    name: "Science & Technology",
    description: "Physics, chemistry, biology, IT",
    questionCount: 300,
    category: "Science",
    author: "official",
    questions: [
      {
        id: "1",
        question: "What is the chemical symbol for water?",
        options: ["H2O", "CO2", "O2", "NaCl"],
        imageUrl: "https://example.com/paris.jpg",

        correctAnswer: 0,
        explanation:
          "H2O is the chemical formula for water, consisting of two hydrogen atoms and one oxygen atom.",
      },
    ],
  },
];
