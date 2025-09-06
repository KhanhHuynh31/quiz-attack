// lib/gameConfig.ts
import { GameConfig, GameSettings } from "@/types/type";

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  timePerQuestion: 30,
  numberOfQuestion: 10,
  allowedCards: [],
  showCorrectAnswer: true,
  maxPlayers: null,
  selectedQuizPack: null,
} as const;

export const saveGameConfig = (roomCode: string, config: GameConfig): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`quizConfig-${roomCode}`, JSON.stringify(config));
  }
};

export const loadGameConfig = (roomCode: string): GameConfig | null => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(`quizConfig-${roomCode}`);
    return item ? JSON.parse(item) : null;
  }
  return null;
};

export const clearGameConfig = (roomCode: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`quizConfig-${roomCode}`);
  }
};