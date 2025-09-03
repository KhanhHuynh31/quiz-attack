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
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  imageUrl?: string;
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
  id: number;
  name: string;
  description: string;
  category: string;
  questionCount: number;
  author: string;
  questions: any[]; // Or a more specific type if you have one
  isHidden?: boolean;
}
export interface GameConfig {
  gameSettings: GameSettings;
  selectedGameMode: string;
  players: Player[];
  roomCode: string;
}
export interface GameMode {
  id: string;
  mode: string;
  name: string;
  description: string;
  instructions: string;
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
  uniqueId: string;
  title: string;
  description: string;
  color: string;
  value?: number;
  emoji?: string; // Thêm trường mới
  type?: string; // Thêm trường mới
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
