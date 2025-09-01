// File: quizData.ts

import { QuizPack } from "@/types/type";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  imageUrl?: string;
}


export const DEFAULT_QUIZ_PACKS: QuizPack[] = [
  {
    id: "1",
    name: "General Knowledge",
    description: "Mixed topics for everyone",
    questionCount: 500,
    category: "General",
    author: "official",
    questions: [
      {
        id: "gen-1",
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
        explanation: "Paris is the capital and most populous city of France.",
      },
      {
        id: "gen-2",
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 1,
        explanation:
          "Mars is often called the Red Planet due to its reddish appearance.",
      },
    ],
  },
  {
    id: "2",
    name: "Science & Technology",
    description: "Physics, chemistry, biology, IT",
    questionCount: 300,
    category: "Science",
    author: "official",
    questions: [
      {
        id: "sci-1",
        question: "What is the chemical symbol for water?",
        options: ["H2O", "CO2", "O2", "NaCl"],
        correctAnswer: 0,
        explanation:
          "H2O is the chemical formula for water, consisting of two hydrogen atoms and one oxygen atom.",
      },
    ],
  },
];