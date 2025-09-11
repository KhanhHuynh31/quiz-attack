import { Card } from "@/types/type";


export const powerCards: Card[] = [
  // --- Time manipulation ---
  {
    id: 1,
    name: "Time Reducer",
    type: "offensive",
    description: "Giảm thời gian trả lời của đối thủ đi 30 giây",
    emoji: "⏳",
    color: "from-red-500 to-orange-500",
    effect: { type: "time", value: -30}
  },
  {
    id: 2,
    name: "Extra Time",
    type: "defensive",
    description: "Thêm 30 giây vào câu hỏi hiện tại của bạn",
    emoji: "🕒",
    color: "from-green-500 to-emerald-600",
    effect: { type: "time", value: 30 }
  },

  // --- CSS/UI disruption ---
  {
    id: 3,
    name: "Blur Vision",
    type: "offensive",
    description: "Làm mờ đáp án đối thủ trong 30 giây",
    emoji: "👓",
    color: "from-gray-500 to-gray-700",
    effect: { type: "css", effect: "blur(4px)", timeout: 30000 }
  },
  {
    id: 4,
    name: "Mirror Screen",
    type: "offensive",
    description: "Đảo ngược toàn bộ UI của đối thủ trong 30 giây",
    emoji: "🪞",
    color: "from-violet-600 to-indigo-500",
    effect: { type: "css", effect: "transform: rotate(180deg)", timeout: 30000 }
  },

  // --- Score manipulation ---
  {
    id: 5,
    name: "Double Points",
    type: "boost",
    description: "Điểm câu hỏi này x2",
    emoji: "✨",
    color: "from-yellow-400 to-orange-500",
    effect: { type: "score", value: 2 }
  },
  {
    id: 6,
    name: "Point Steal",
    type: "offensive",
    description: "Ăn cắp 50 điểm từ đối thủ",
    emoji: "🦹",
    color: "from-red-600 to-black",
    effect: { type: "score", value: -50 }
  },

  // --- Answer manipulation ---
  {
    id: 7,
    name: "Remove Option",
    type: "defensive",
    description: "Loại bỏ 2 đáp án sai khỏi màn hình của bạn",
    emoji: "❌",
    color: "from-blue-500 to-cyan-500",
    effect: { type: "answer", mode: "remove", count: 2 }
  },
  {
    id: 8,
    name: "Fake Option",
    type: "offensive",
    description: "Thêm 1 đáp án giả vào màn hình đối thủ",
    emoji: "🕵️",
    color: "from-orange-500 to-red-600",
    effect: { type: "answer", mode: "fake", count: 1 }
  },
];
