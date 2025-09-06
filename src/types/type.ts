// types.ts
export interface Player {
  id: number;
  name: string;
  avatar?: string;
  isHost?: boolean;
  isReady?: boolean;
  score: number;
  cards: number;
  hasAnswered?: boolean;
  selectedAnswer?: number;
}
export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  imageUrl?: string;
}

export interface ActiveEffect {
  id: string;
  type: "time" | "css" | "score" | "answer";
  value?: any;
  mode?: "remove" | "fake" | "lock";
  count?: number;
  duration: number | null;
}
export interface GameSettings {
  timePerQuestion: number;
  numberOfQuestion: number;
  allowedCards: string[];
  showCorrectAnswer: boolean;
  maxPlayers: number | null;
  selectedQuizPack: QuizPack | null;
}

export interface QuizPack {
  id: number;
  name: string;
  description: string;
  category: string;
  questionCount: number;
  author: string;
  questions: any[]; // Or a more specific type if you have one
  isHidden?: boolean;
}

export interface LocalStorageQuestion {
  id: string;
  question: string;
  options: string[];
  imageUrl?: string;
  correctAnswer: number;
  explanation: string;
}
export interface GameConfig {
  gameSettings: GameSettings;
  selectedGameMode: string;
  players: Player[];
  roomCode: string;
}
export interface ExtendedGameConfig extends GameConfig {
  questions?: LocalStorageQuestion[];
}

export interface GameMode {
  id: string;
  mode: string;
  name: string;
  description: string;
  instructions: string;
}
export type PowerCardEffect =
  | { type: "time"; value: number }
  | {
    value: number; type: "css"; effect: string 
}
  | { type: "score"; value: number }
  | { type: "answer"; mode: "remove" | "fake" | "lock"; count?: number };

export interface ActiveCardEffect {
  id: string;
  type: PowerCardEffect['type'];
  effect: PowerCardEffect;
  duration?: number;
  startTime: number;
  targetPlayer?: number; // 1 for current player, others for opponents
}

export interface GameModifiers {
  timeModifier: number; // Additional time (positive) or reduced time (negative)
  cssEffects: string[]; // CSS effects to apply
  scoreMultiplier: number; // Score multiplier for current question
  removedAnswers: number[]; // Indices of removed wrong answers
  fakeAnswers: string[]; // Fake answers to add
  lockedAnswers: number[]; // Indices of locked answers
}
export interface Question {
  id: number;
  text: string;
  imageUrl: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Card {
  id: number;
  uniqueId?: string; // Thêm trường uniqueId
  name: string;
  description: string;
  color: string;
  value?: number;
  emoji?: string; // Thêm trường mới
  type?: string; // Thêm trường mới
  effect?: any; // Thêm trường mới
}

export interface CardUsage {
  playerName: string;
  cardTitle: string;
  round: number;
  questionNumber: number;
  cardDescription: string;
}

export interface ActiveCard {
  card: Card;
  id: string;
}

export interface ScoreUpdate {
  playerId: number;
  points: number;
  animationId: string;
}
