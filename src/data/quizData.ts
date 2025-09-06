import { QuizPack } from "@/types/type";

export const DEFAULT_QUIZ_PACKS: QuizPack[] = [
  {
    id: 1,
    name: "Kiến thức tổng hợp",
    description: "Các câu hỏi đa dạng phù hợp với mọi người",
    questionCount: 5,
    category: "Tổng hợp",
    author: "official",
    questions: [
      {
        id: 1,
        question: "Thủ đô của Việt Nam là gì?",
        options: ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Huế"],
        imageUrl:
          "https://images.unsplash.com/photo-1549887534-7d8a0c8b87e1?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 0,
        explanation: "Hà Nội là thủ đô của Việt Nam từ năm 1976.",
      },
      {
        id: 2,
        question: "Ai là tác giả của tác phẩm 'Truyện Kiều'?",
        options: ["Nguyễn Du", "Nguyễn Trãi", "Hồ Xuân Hương", "Xuân Diệu"],
        imageUrl:
          "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 0,
        explanation: "'Truyện Kiều' là tác phẩm nổi tiếng nhất của đại thi hào Nguyễn Du.",
      },
      {
        id: 3,
        question: "Quốc gia nào được gọi là 'xứ sở hoa anh đào'?",
        options: ["Trung Quốc", "Nhật Bản", "Hàn Quốc", "Thái Lan"],
        imageUrl:
          "https://images.unsplash.com/photo-1526481280691-9062fd39be44?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 1,
        explanation: "Nhật Bản nổi tiếng với hoa anh đào nở rộ vào mùa xuân.",
      },
      {
        id: 4,
        question: "Ai là người đầu tiên đặt chân lên Mặt Trăng?",
        options: [
          "Neil Armstrong",
          "Buzz Aldrin",
          "Yuri Gagarin",
          "Michael Collins",
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 0,
        explanation:
          "Neil Armstrong là người đầu tiên đặt chân lên Mặt Trăng vào năm 1969.",
      },
      {
        id: 5,
        question: "Loài động vật nào được mệnh danh là 'chúa sơn lâm'?",
        options: ["Sư tử", "Hổ", "Báo", "Voi"],
        imageUrl:
          "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 1,
        explanation: "Hổ thường được gọi là 'chúa sơn lâm' trong văn hóa Á Đông.",
      },
    ],
  },
  {
    id: 2,
    name: "Khoa học & Công nghệ",
    description: "Câu hỏi về vật lý, hóa học, sinh học, công nghệ thông tin",
    questionCount: 10,
    category: "Khoa học",
    author: "official",
    questions: [
      {
        id: 1,
        question: "Nguyên tử số 1 trong bảng tuần hoàn là nguyên tố nào?",
        options: ["Heli", "Hydro", "Oxy", "Nitơ"],
        imageUrl:
          "https://images.unsplash.com/photo-1617172598011-19e0c2c6f0d2?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 1,
        explanation: "Nguyên tử số 1 là Hydro, nguyên tố nhẹ nhất.",
      },
      {
        id: 2,
        question: "Tốc độ ánh sáng trong chân không xấp xỉ bao nhiêu?",
        options: ["3.000 km/s", "30.000 km/s", "300.000 km/s", "3.000.000 km/s"],
        imageUrl:
          "https://images.unsplash.com/photo-1523978591478-c753949ff840?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 2,
        explanation: "Tốc độ ánh sáng trong chân không khoảng 300.000 km/s.",
      },
      {
        id: 3,
        question: "Công nghệ AI là viết tắt của cụm từ nào?",
        options: [
          "Artificial Internet",
          "Advanced Intelligence",
          "Artificial Intelligence",
          "Automated Interface",
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 2,
        explanation: "AI là viết tắt của Artificial Intelligence (Trí tuệ nhân tạo).",
      },
      {
        id: 4,
        question: "Trái Đất quay quanh Mặt Trời mất bao nhiêu ngày?",
        options: ["30", "180", "365", "730"],
        imageUrl:
          "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 2,
        explanation: "Trái Đất mất khoảng 365 ngày để hoàn thành một vòng quanh Mặt Trời.",
      },
      {
        id: 5,
        question: "CPU trong máy tính là viết tắt của cụm từ nào?",
        options: [
          "Central Processing Unit",
          "Computer Power Unit",
          "Control Program Utility",
          "Central Power Utility",
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1587202372775-e229f172b9d4?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 0,
        explanation: "CPU là viết tắt của Central Processing Unit (Bộ xử lý trung tâm).",
      },
      {
        id: 6,
        question: "Máu người có mấy nhóm chính?",
        options: ["2", "3", "4", "5"],
        imageUrl:
          "https://images.unsplash.com/photo-1582719478304-5c9a03db4b6b?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 2,
        explanation: "Có 4 nhóm máu chính: A, B, AB và O.",
      },
      {
        id: 7,
        question: "Ai được coi là cha đẻ của ngành điện?",
        options: ["Albert Einstein", "Michael Faraday", "Isaac Newton", "Nikola Tesla"],
        imageUrl:
          "https://images.unsplash.com/photo-1612178991971-5efb87222e1d?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 1,
        explanation: "Michael Faraday có đóng góp lớn trong nghiên cứu điện từ học.",
      },
      {
        id: 8,
        question: "Thành phần chính của không khí là gì?",
        options: ["Oxy", "Nitơ", "Carbon Dioxide", "Hydro"],
        imageUrl:
          "https://images.unsplash.com/photo-1581090700227-4c4f7dc3e08d?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 1,
        explanation: "Không khí chứa khoảng 78% Nitơ, 21% Oxy và các khí khác.",
      },
      {
        id: 9,
        question: "HTML được sử dụng để làm gì?",
        options: [
          "Thiết kế cơ sở dữ liệu",
          "Mô tả cấu trúc trang web",
          "Viết ứng dụng di động",
          "Tạo hiệu ứng đồ họa",
        ],
        imageUrl:
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 1,
        explanation: "HTML dùng để mô tả cấu trúc của một trang web.",
      },
      {
        id: 10,
        question: "Loài nào sau đây là động vật có vú?",
        options: ["Cá mập", "Cá voi xanh", "Chim cánh cụt", "Cá sấu"],
        imageUrl:
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=873&auto=format&fit=crop",
        correctAnswer: 1,
        explanation: "Cá voi xanh là động vật có vú lớn nhất thế giới.",
      },
    ],
  },
];
