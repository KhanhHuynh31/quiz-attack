import { Card } from "@/types/type";


export const powerCards: Card[] = [
  // --- Time manipulation ---
  {
    id: 1,
    name: "Time Reducer",
    type: "offensive",
    description: "Giảm thời gian trả lời của đối thủ đi 5 giây",
    emoji: "⏰",
    color: "from-red-500 to-orange-500",
    effect: { type: "time", value: -5 }
  },
  {
    id: 2,
    name: "Extra Time",
    type: "defensive",
    description: "Thêm 5 giây vào câu hỏi hiện tại của bạn",
    emoji: "🕒",
    color: "from-green-500 to-emerald-600",
    effect: { type: "time", value: 5 }
  },

  // --- CSS/UI disruption ---
  {
    id: 3,
    name: "Blur Vision",
    type: "offensive",
    description: "Làm mờ đáp án đối thủ trong 3 giây",
    emoji: "👓",
    color: "from-gray-500 to-gray-700",
    effect: { type: "css", effect: "blur(4px)" }
  },
  {
    id: 4,
    name: "Mirror Screen",
    type: "offensive",
    description: "Đảo ngược toàn bộ UI của đối thủ trong 5 giây",
    emoji: "🪞",
    color: "from-violet-600 to-indigo-500",
    effect: { type: "css", effect: "transform: rotate(180deg)" }
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
    description: "Loại bỏ 1 đáp án sai khỏi màn hình của bạn",
    emoji: "❌",
    color: "from-blue-500 to-cyan-500",
    effect: { type: "answer", mode: "remove", count: 1 }
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
  {
    id: 9,
    name: "Lock Answer",
    type: "offensive",
    description: "Khóa 1 đáp án bất kỳ của đối thủ",
    emoji: "🔒",
    color: "from-yellow-600 to-orange-600",
    effect: { type: "answer", mode: "lock", count: 1 }
  }
];
