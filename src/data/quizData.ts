import { QuizPack } from "@/types/type";

export const DEFAULT_QUIZ_PACKS: QuizPack[] = [
  {
    id: 1,
    name: "Kiến thức tổng hợp",
    description: "Các câu hỏi đa dạng phù hợp với mọi người",
    questionCount: 5,
    category: "Tổng hợp",
    author: "official",
  },
  {
    id: 2,
    name: "Khoa học & Công nghệ",
    description: "Câu hỏi về vật lý, hóa học, sinh học, công nghệ thông tin",
    questionCount: 10,
    category: "Khoa học",
    author: "official",
  },
];
