// src/data/powerCards.ts
export interface PowerCard {
  id: string;
  name: string;
  type: string;
  description: string;
  value?: number;
  emoji: string;
  color: string;
}

export const powerCards: PowerCard[] = [
  // --- Offensive / Quấy rối ---
  {
    id: "blurVision",
    name: "Blur Vision",
    type: "offensive",
    description: "Làm mờ đáp án đối thủ trong 3 giây",
    emoji: "👓",
    color: "from-gray-500 to-gray-700"
  },
  {
    id: "shuffleAnswers",
    name: "Shuffle Answers",
    type: "offensive",
    description: "Xáo trộn lại vị trí các đáp án của đối thủ",
    emoji: "🔀",
    color: "from-pink-500 to-rose-500"
  },
  {
    id: "fakeOption",
    name: "Fake Option",
    type: "offensive",
    description: "Thêm 1 đáp án giả vào màn hình đối thủ",
    emoji: "🕵️",
    color: "from-orange-500 to-red-600"
  },
  {
    id: "mirrorScreen",
    name: "Mirror Screen",
    type: "offensive",
    description: "Đảo ngược giao diện câu hỏi của đối thủ trong 5 giây",
    emoji: "🪞",
    color: "from-violet-600 to-indigo-500"
  },
  {
    id: "answerLock",
    name: "Answer Lock",
    type: "offensive",
    description: "Khóa một đáp án bất kỳ của đối thủ",
    emoji: "🔒",
    color: "from-yellow-600 to-orange-600"
  },

  // --- Defensive ---
  {
    id: "clearMind",
    name: "Clear Mind",
    type: "defensive",
    description: "Hủy bỏ hiệu ứng quấy rối hiện tại",
    emoji: "🧘",
    color: "from-emerald-500 to-green-600"
  },
  {
    id: "reflect",
    name: "Reflect",
    type: "defensive",
    description: "Phản ngược card đối thủ định dùng lên chính họ",
    emoji: "🪩",
    color: "from-cyan-500 to-sky-500"
  },

  // --- Fun / Troll ---
  {
    id: "emojiRain",
    name: "Emoji Rain",
    type: "offensive",
    description: "Spam icon rơi loạn xạ trên màn hình đối thủ",
    emoji: "😂",
    color: "from-fuchsia-500 to-purple-700"
  },
  {
    id: "slowMotion",
    name: "Slow Motion",
    type: "offensive",
    description: "Làm chậm UI và thao tác của đối thủ trong vài giây",
    emoji: "🐌",
    color: "from-blue-400 to-indigo-600"
  }
];
