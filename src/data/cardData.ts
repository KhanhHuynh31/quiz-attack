import { Card } from "@/types/type";

export const powerCards: Card[] = [
  // --- Time manipulation ---
  {
    id: 1,
    name: "Time Reducer",
    type: "offensive",
    description: "Thời gian giảm nữa",
    emoji: "⏳",
    color: "from-red-500 to-orange-500",
    effect: { type: "time", value: "-50%" },
  },
  {
    id: 2,
    name: "Extra Time",
    type: "defensive",
    description: "Thời gian sẽ reset từ đầu",
    emoji: "🕒",
    color: "from-green-500 to-emerald-600",
    effect: { type: "time", value: "100%" },
  },

  // --- CSS/UI disruption ---
  {
    id: 3,
    name: "Cận thị",
    type: "offensive",
    description: "Làm mờ đáp án trong 30 giây",
    emoji: "👓",
    color: "from-gray-500 to-gray-700",
    effect: { type: "css", effect: "css-blur", timeout: 30000 },
  },
  {
    id: 4,
    name: "Lốc xoáy",
    type: "offensive",
    description: "Lốc xoáy 30 giây",
    emoji: "🪞",
    color: "from-violet-600 to-indigo-500",
    effect: {
      type: "css",
      effect: "spin-360",
      timeout: 30000,
    },
  },
  {
    id: 5,
    name: "Động đất",
    type: "offensive",
    description: "Động đất 30 giây",
    emoji: "🪞",
    color: "from-violet-600 to-indigo-500",
    effect: {
      type: "css",
      effect: "css-shake",
      timeout: 30000,
    },
  },
  // --- Score manipulation ---
  {
    id: 6,
    name: "Double Points",
    type: "boost",
    description: "Điểm câu hỏi này x2",
    emoji: "✨",
    color: "from-yellow-400 to-orange-500",
    effect: { type: "score", value: 200 },
  },

  // --- Answer manipulation ---
  {
    id: 7,
    name: "50/50",
    type: "defensive",
    description: "Loại bỏ 2 đáp án sai khỏi màn hình của bạn",
    emoji: "❌",
    color: "from-blue-500 to-cyan-500",
    effect: { type: "answer", mode: "remove", count: 2 },
  },
];
