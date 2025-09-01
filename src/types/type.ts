// types.ts
export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
}

export interface GameSettings {
  timePerQuestion: number;
  numberOfRounds: number;
  allowedCards: string[];
  showCorrectAnswer: boolean;
  maxPlayers: number | null;
  selectedQuizPack: QuizPack | null;
}

export interface QuizPack {
  id: string;
  name: string;
  description: string;
  category: string;
  questionCount: number;
  author: string;
  questions: any[]; // Or a more specific type if you have one
  isHidden?: boolean;
}