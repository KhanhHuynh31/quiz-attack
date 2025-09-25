import { AvatarFullConfig } from "react-nice-avatar";

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  imageUrl?: string;
}
export interface Player {
  id: number;
  nickname: string;
  avatar?: string;
  isHost?: boolean;
  isReady?: boolean;
  score: number;
  cards: number;
  hasAnswered?: boolean;
  selectedAnswer?: number;
}
export interface RoomSettings {
  roomCode: string;
  password: string | null;
  gameModeId: number | null;
  quizPackId: number | null;
  createdAt: number;
}
export interface PlayerData {
  player: Player;
  avatarConfig: AvatarFullConfig;
  customAvatarImage: string | null;
  roomSettings?: RoomSettings;
}

export type TabType = "mode" | "settings" | "packs";

export interface QuizAttackLobbyProps {
  initialRoomCode?: string;
  initialPlayers?: Player[];
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
  selectedGameMode: GameMode | null;
  players: Player[];
  roomCode: string;
}
export interface ExtendedGameConfig extends GameConfig {
  questions?: LocalStorageQuestion[];
}

export interface GameMode {
  id: number;
  mode: string;
  name: string;
  description: string;
  instructions: string;
}
export type PowerCardEffect =
  | { type: "time"; value: number }
  | {
      value: number;
      type: "css";
      effect: string;
    }
  | { type: "score"; value: number }
  | { type: "answer"; mode: "remove" | "fake" | "lock"; count?: number };

export interface ActiveCardEffect {
  id: string;
  type: PowerCardEffect["type"];
  effect: PowerCardEffect;
  duration?: number;
  startTime: number;
  targetPlayer?: number;
  expiresAtQuestionEnd?: boolean;
}

export interface GameModifiers {
  timeModifier: number;
  cssEffects: string[];
  scoreMultiplier: number;
  removedAnswers: number[];
  fakeAnswers: string[];
  lockedAnswers: number[];
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
  uniqueId?: string;
  name: string;
  description: string;
  color: string;
  value?: number;
  emoji?: string;
  type?: string;
  effect?: any;
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
