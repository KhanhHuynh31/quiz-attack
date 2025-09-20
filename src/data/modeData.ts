// types/gameModes.ts

import { GameMode } from "@/types/type";

export const GAME_MODES: GameMode[] = [
  {
    id: 1,
    mode: "battle",
    name: "Attack Mode",
    description: "Answer questions and test your knowledge",
    instructions: "Select the correct answer from multiple choices",
  },
  {
    id: 2,
    mode: "classic",
    name: "Quiz Mode",
    description: "Challenge other players in real-time",
    instructions: "Defeat your opponent by answering correctly",
  },
];
