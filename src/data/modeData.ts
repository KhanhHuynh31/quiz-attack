// types/gameModes.ts

import { GameMode } from "@/types/type";


export const GAME_MODES: GameMode[] = [
  {
    id: 1,
    mode: "classic",
    name: "Classic Mode",
    description: "Answer questions and test your knowledge",
    instructions: "Select the correct answer from multiple choices"
  },
  {
    id: 2,
    mode: "battle",
    name: "Battle Mode",
    description: "Challenge other players in real-time",
    instructions: "Defeat your opponent by answering correctly"
  },
  {
    id: 3,
    mode: "pve",
    name: "PvE Mode",
    description: "Play against computer opponents",
    instructions: "Choose difficulty level and battle against AI"
  }
];