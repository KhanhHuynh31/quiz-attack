"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  FaCopy,
  FaCheck,
  FaGlobe,
  FaQuestionCircle,
  FaDoorOpen,
  FaPlus,
  FaTimes,
  FaInfoCircle,
  FaFacebook,
  FaGoogle,
  FaUserCircle,
  FaUpload,
} from "react-icons/fa";
import { GiCardPlay, GiDiceTwentyFacesTwenty } from "react-icons/gi";
import Avatar, { genConfig } from "react-nice-avatar";
import Background from "@/components/Background";
import Link from "next/link";

// Types for translations
interface ModeTranslation {
  title: string;
  desc: string;
  help: string;
}

interface TranslationData {
  title: string;
  howToPlay: string;
  patchNotes: string;
  discord: string;
  gameModes: string;
  questionPacks: string;
  nickname: string;
  yourName: string;
  login: string;
  register: string;
  username: string;
  password: string;
  loginWithFacebook: string;
  loginWithGoogle: string;
  createRoom: string;
  roomCodePlaceholder: string;
  create: string;
  joinRoom: string;
  enterRoomCode: string;
  join: string;
  copy: string;
  copied: string;
  startLobby: string;
  addCustomPacks: string;
  setPassword: string;
  roomPassword: string;
  shareRoom: string;
  showQRCode: string;
  chooseAvatar: string;
  uploadAvatar: string;
  modes: {
    classic: ModeTranslation;
    battle: ModeTranslation;
    pve: ModeTranslation;
  };
  rules: string[];
}

// i18n translations
const translations: Record<string, TranslationData> = {
  en: {
    title: "QUIZ ATTACK",
    howToPlay: "How to Play",
    patchNotes: "Patch Notes",
    discord: "Discord",
    gameModes: "Game Modes",
    questionPacks: "Question Packs",
    nickname: "Nickname",
    yourName: "Your name",
    login: "Login",
    register: "Register Account",
    username: "Username",
    password: "Password",
    loginWithFacebook: "Login with Facebook",
    loginWithGoogle: "Login with Google",
    createRoom: "Create Room",
    roomCodePlaceholder: "ROOM CODE (auto if empty)",
    create: "Create",
    joinRoom: "Join Room",
    enterRoomCode: "Enter room code",
    join: "Join",
    copy: "Copy",
    copied: "Copied",
    startLobby: "Start Lobby",
    addCustomPacks: "Add Custom Packs",
    setPassword: "Set Password",
    roomPassword: "Room Password",
    shareRoom: "Share Room",
    showQRCode: "Show QR Code",
    chooseAvatar: "Choose Avatar",
    uploadAvatar: "Upload Avatar",
    modes: {
      classic: {
        title: "Classic Quiz",
        desc: "Answer fast – earn points – highest score wins.",
        help: "Classic mode is the traditional quiz format where players compete to answer questions as quickly and accurately as possible. Each correct answer earns points, with bonus points for faster responses. The player with the highest total score after all rounds wins the game.",
      },
      battle: {
        title: "Card Battle",
        desc: "Use cards to disrupt time, shuffle answers, choose topics.",
        help: "Card Battle mode adds strategic elements with special cards that can change the game dynamics. Players can use cards to extend or reduce time limits, shuffle answer choices, select question categories, or apply other tactical advantages. Timing your card usage is key to victory.",
      },
      pve: {
        title: "VS AI Host",
        desc: "AI asks questions and plays challenge cards for the room.",
        help: "In VS AI Host mode, an artificial intelligence acts as the game master, generating questions and strategically playing challenge cards that affect all players. This creates a cooperative-competitive environment where players must adapt to AI-controlled game modifications while competing against each other.",
      },
    },
    rules: [
      "Answer correctly to earn points. Submit earlier for higher bonus points.",
      "Cards can change time, shuffle answers, select topics.",
      "After 10 rounds, the player with the **highest total score** wins.",
    ],
  },
  vi: {
    title: "QUIZ ATTACK",
    howToPlay: "Cách Chơi",
    patchNotes: "Ghi Chú Bản Vá",
    discord: "Discord",
    gameModes: "Chế Độ Chơi",
    questionPacks: "Gói Câu Hỏi",
    nickname: "Biệt Danh",
    yourName: "Tên của bạn",
    login: "Đăng nhập",
    register: "Đăng ký tài khoản",
    username: "Tên đăng nhập",
    password: "Mật khẩu",
    loginWithFacebook: "Đăng nhập với Facebook",
    loginWithGoogle: "Đăng nhập với Google",
    createRoom: "Tạo Phòng",
    roomCodePlaceholder: "MÃ PHÒNG (tự động nếu để trống)",
    create: "Tạo",
    joinRoom: "Vào Phòng",
    enterRoomCode: "Nhập mã phòng",
    join: "Vào",
    copy: "Sao Chép",
    copied: "Đã Sao Chép",
    startLobby: "Bắt Đầu Phòng Chờ",
    addCustomPacks: "Thêm Gói Tự Tạo",
    setPassword: "Đặt mật khẩu",
    roomPassword: "Mật khẩu phòng",
    shareRoom: "Chia sẻ phòng",
    showQRCode: "Hiện mã QR",
    chooseAvatar: "Chọn ảnh đại diện",
    uploadAvatar: "Tải ảnh lên",
    modes: {
      classic: {
        title: "Quiz Cổ Điển",
        desc: "Trả lời nhanh – tích điểm – ai cao nhất thắng.",
        help: "Chế độ Cổ điển là định dạng quiz truyền thống nơi người chơi cạnh tranh trả lời câu hỏi nhanh và chính xác nhất có thể. Mỗi câu trả lời đúng kiếm điểm, với điểm thưởng cho những phản hồi nhanh hơn. Người chơi có tổng điểm cao nhất sau tất cả các vòng sẽ thắng cuộc.",
      },
      battle: {
        title: "Đấu Thẻ Bài",
        desc: "Dùng thẻ gây rối thời gian, đảo đáp án, chọn chủ đề.",
        help: "Chế độ Đấu Thẻ Bài thêm các yếu tố chiến thuật với thẻ đặc biệt có thể thay đổi động lực trò chơi. Người chơi có thể sử dụng thẻ để kéo dài hoặc giảm giới hạn thời gian, xáo trộn các lựa chọn trả lời, chọn danmục câu hỏi, hoặc áp dụng các lợi thế chiến thuật khác. Thời điểm sử dụng thẻ là chìa khóa chiến thắng.",
      },
      pve: {
        title: "Đấu AI Host",
        desc: "Máy ra câu hỏi và tung thẻ thử thách cho cả phòng.",
        help: "Trong chế độ Đấu AI Host, trí tuệ nhân tạo đóng vai trò chủ trò chơi, tạo ra câu hỏi và chiến thuật chơi thẻ thách thức ảnh hưởng đến tất cả người chơi. Điều này tạo ra môi trường hợp tác-cạnh tranh nơi người chơi phải thích ứng với các sửa đổi trò chơi do AI kiểm soát trong khi cạnh tranh với nhau.",
      },
    },
    rules: [
      "Trả lời đúng để tích điểm. Nộp càng sớm, điểm bonus càng cao.",
      "Thẻ bài có thể thay đổi thời gian, xáo đáp án, chọn chủ đề.",
      "Hết 10 vòng, người có **tổng điểm cao nhất** thắng.",
    ],
  },
};

// Constants with animations
const MODES = [
  {
    key: "classic",
    icon: <FaQuestionCircle className="text-xl" />,
    gradient: "from-[#FF6B35] to-[#FF6B35]/80",
  },
  {
    key: "battle",
    icon: <GiCardPlay className="text-xl" />,
    gradient: "from-[#FF6B35] to-[#FF6B35]/80",
  },
  {
    key: "pve",
    icon: <GiDiceTwentyFacesTwenty className="text-xl" />,
    gradient: "from-[#FF6B35] to-[#FF6B35]/80",
  },
] as const;

const QUESTION_PACKS = [
  { id: "gen", name: "General" },
  { id: "game", name: "Gaming" },
  { id: "anime", name: "Anime" },
  { id: "tech", name: "Tech" },
  { id: "hist", name: "History" },
  { id: "geo", name: "Geography" },
] as const;

// Custom hook for i18n with proper typing
const useI18n = () => {
  const [language, setLanguage] = useState<string>("en");

  useEffect(() => {
    // Get saved language or detect browser language
    const saved = localStorage.getItem("quiz-attack-lang");
    const browserLang = navigator.language.split("-")[0];
    const defaultLang = saved || (browserLang === "vi" ? "vi" : "en");
    setLanguage(defaultLang);
  }, []);

  const changeLanguage = useCallback((lang: string) => {
    setLanguage(lang);
    localStorage.setItem("quiz-attack-lang", lang);
  }, []);

  const t =
    translations[language as keyof typeof translations] || translations.en;

  return { language, changeLanguage, t };
};

// Types
type GameMode = (typeof MODES)[number]["key"];

// Components with proper typing
const Header = ({
  t,
  language,
  changeLanguage,
}: {
  t: TranslationData;
  language: string;
  changeLanguage: (lang: string) => void;
}) => (
  <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FF6B35] shadow-lg shadow-[#FF6B35]/20 ring-2 ring-white/10 animate-bounce">
        <FaQuestionCircle className="text-2xl text-white" />
      </div>
      <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-[#EAEAEA] bg-clip-text text-transparent">
        {t.title}
      </div>
    </div>
    <nav className="hidden items-center gap-3 text-[#EAEAEA] md:flex">
      <button className="rounded-xl px-3 py-2 text-sm hover:text-white transition-colors">
        {t.howToPlay}
      </button>
      <button className="rounded-xl px-3 py-2 text-sm hover:text-white transition-colors">
        {t.patchNotes}
      </button>
      <button className="rounded-xl px-3 py-2 text-sm hover:text-white transition-colors">
        {t.discord}
      </button>
      <div className="ml-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10">
        <FaGlobe />
        <select
          className="bg-transparent outline-none text-white [&>option]:bg-[#2B2D42] [&>option]:text-white"
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
        >
          <option value="en">EN</option>
          <option value="vi">VI</option>
        </select>
      </div>
    </nav>
  </header>
);

const HelpModal = ({
  isOpen,
  onClose,
  mode,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: GameMode;
  t: TranslationData;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-md w-full bg-[#2B2D42] rounded-3xl border border-white/10 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#EAEAEA] hover:text-white transition-colors"
        >
          <FaTimes />
        </button>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2">
            {t.modes[mode].title}
          </h3>
          <p className="text-[#EAEAEA] text-sm leading-relaxed">
            {t.modes[mode].help}
          </p>
        </div>
      </div>
    </div>
  );
};

const AvatarModal = ({
  isOpen,
  onClose,
  onSelect,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (config: any) => void;
  t: TranslationData;
}) => {
  const [config, setConfig] = useState(genConfig());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRandomize = () => {
    setConfig(genConfig());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onSelect({ type: "upload", data: event.target?.result });
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-md w-full bg-[#2B2D42] rounded-3xl border border-white/10 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#EAEAEA] hover:text-white transition-colors"
        >
          <FaTimes />
        </button>
        <h3 className="text-xl font-bold text-white mb-4">{t.chooseAvatar}</h3>

        <div className="flex justify-center mb-4">
          <Avatar className="w-32 h-32" {...config} />
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={handleRandomize}
            className="rounded-xl bg-[#FF6B35] px-4 py-2 text-white font-semibold"
          >
            Randomize
          </button>
        </div>

        <button
          onClick={() => onSelect({ type: "avatar", config })}
          className="w-full mb-3 rounded-xl bg-[#FF6B35] px-4 py-3 text-white font-semibold"
        >
          Use This Avatar
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4CC9F0] px-4 py-3 text-white font-semibold"
        >
          <FaUpload /> {t.uploadAvatar}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};

const LoginModal = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (data: { username: string; password: string; avatar: any }) => void;
  onRegister: (data: {
    username: string;
    password: string;
    avatar: any;
  }) => void;
  t: TranslationData;
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [avatarConfig, setAvatarConfig] = useState<any>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      onRegister({ ...formData, avatar: avatarConfig });
    } else {
      onLogin({ ...formData, avatar: avatarConfig });
    }
    onClose();
  };

  const handleAvatarSelect = (config: any) => {
    setAvatarConfig(config);
    setShowAvatarModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative max-w-md w-full bg-[#2B2D42] rounded-3xl border border-white/10 p-6 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#EAEAEA] hover:text-white transition-colors"
          >
            <FaTimes />
          </button>

          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isRegister ? t.register : t.login}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20"
              >
                {avatarConfig ? (
                  avatarConfig.type === "avatar" ? (
                    <Avatar
                      className="w-full h-full"
                      {...avatarConfig.config}
                    />
                  ) : (
                    <img
                      src={avatarConfig.data}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <FaUserCircle className="text-5xl text-[#EAEAEA]" />
                )}
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder={t.username}
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder={t.password}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20 transform hover:scale-105 transition-all"
            >
              {isRegister ? t.register : t.login}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-[#EAEAEA]">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#3b5998] px-4 py-3 text-white font-medium"
              >
                <FaFacebook /> Facebook
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#DB4437] px-4 py-3 text-white font-medium"
              >
                <FaGoogle /> Google
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-[#FF6B35] hover:underline"
              >
                {isRegister
                  ? "Already have an account? Login"
                  : "Need an account? Register"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSelect={handleAvatarSelect}
        t={t}
      />
    </>
  );
};

const GameModes = ({
  mode,
  setMode,
  t,
}: {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  t: TranslationData;
}) => {
  const [helpMode, setHelpMode] = useState<GameMode | null>(null);

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-xl shadow-black/30 backdrop-blur-md">
        <h2 className="mb-2 px-2 text-sm font-medium uppercase tracking-wider text-[#EAEAEA]">
          {t.gameModes}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {MODES.map((m, index) => (
            <div
              key={m.key}
              className={`group flex items-start gap-3 rounded-2xl border p-3 text-left transition-all duration-300 ${
                mode === m.key
                  ? "border-[#FF6B35] bg-[#FF6B35]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <button
                onClick={() => setMode(m.key)}
                className="flex-1 flex items-start gap-3"
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${m.gradient} text-white shadow-lg`}
                >
                  {m.icon}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {t.modes[m.key].title}
                  </div>
                  <div className="text-xs text-[#EAEAEA]">
                    {t.modes[m.key].desc}
                  </div>
                </div>
              </button>
              <button
                onClick={() => setHelpMode(m.key)}
                className="text-[#EAEAEA] hover:text-[#FF6B35] transition-colors p-1"
              >
                <FaInfoCircle className="text-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <HelpModal
        isOpen={helpMode !== null}
        onClose={() => setHelpMode(null)}
        mode={helpMode!}
        t={t}
      />
    </>
  );
};

const QuestionPacks = ({
  selectedPacks,
  togglePack,
  t,
}: {
  selectedPacks: string[];
  togglePack: (id: string) => void;
  t: TranslationData;
}) => (
  <div
    className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/30 backdrop-blur-md h-full flex flex-col min-h-0"
  >
    {/* Header */}
    <div className="flex items-center justify-between mb-3 flex-shrink-0">
      <h2 className="text-sm font-medium uppercase tracking-wider text-[#EAEAEA]">
        {t.questionPacks}
      </h2>
      <button className="text-[#FF6B35] hover:text-[#FF6B35]/80 transition-colors text-sm flex items-center gap-1">
        <FaPlus className="text-xs" />
        {t.addCustomPacks}
      </button>
    </div>

    {/* Danh sách cuộn */}
    <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-2">
      {QUESTION_PACKS.map((p, index) => (
        <div
          key={p.id}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
            selectedPacks.includes(p.id)
              ? "border-[#FF6B35] bg-[#FF6B35]/10"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          }`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <span className="text-sm font-medium text-white">{p.name}</span>
          <button
            onClick={() => togglePack(p.id)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              selectedPacks.includes(p.id)
                ? "border-[#FF6B35] bg-[#FF6B35]"
                : "border-[#EAEAEA]"
            }`}
          >
            {selectedPacks.includes(p.id) && (
              <FaCheck className="text-xs text-white" />
            )}
          </button>
        </div>
      ))}
    </div>
  </div>
);

// Main Component
export default function QuizAttackStart() {
  const { language, changeLanguage, t } = useI18n();
  const [nickname, setNickname] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [isPasswordProtected, setIsPasswordProtected] =
    useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [mode, setMode] = useState<GameMode>("classic");
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [userAvatar, setUserAvatar] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Generate random room code
  const generateRoomCode = useCallback(() => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }, []);

  // Initialize room code on component mount
  useEffect(() => {
    setRoomCode(generateRoomCode());
  }, [generateRoomCode]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [roomCode]);

  const togglePack = useCallback((id: string) => {
    setSelectedPacks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleLogin = (data: {
    username: string;
    password: string;
    avatar: any;
  }) => {
    setIsLoggedIn(true);
    setUserAvatar(data.avatar);
    // In a real app, you would handle authentication here
  };

  const handleRegister = (data: {
    username: string;
    password: string;
    avatar: any;
  }) => {
    setIsLoggedIn(true);
    setUserAvatar(data.avatar);
    // In a real app, you would handle registration here
  };

  return (
    <div className="relative h-screen w-full font-sans flex flex-col">
      <Background />
      <Header t={t} language={language} changeLanguage={changeLanguage} />

      {/* Main Grid */}
      <main className=" flex-1 mx-auto w-full max-w-7xl grid grid-cols-1 gap-6 px-6 pb-4 lg:grid-cols-12  overflow-y-hidden ">
        {/* Left: Modes */}
        <section className="lg:col-span-4 space-y-4 h-full flex flex-col min-h-0">
          {/* GameModes cố định */}
          <div className="flex-shrink-0">
            <GameModes mode={mode} setMode={setMode} t={t} />
          </div>
          {/* QuestionPacks chiếm phần còn lại */}
          <QuestionPacks
            selectedPacks={selectedPacks}
            togglePack={togglePack}
            t={t}
          />
        </section>
        {/* Center: Create / Join */}
        <section className="lg:col-span-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-md">
            {/* User Profile Section */}
            <div className="flex items-center gap-4 mb-6">
              {isLoggedIn ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
                    {userAvatar ? (
                      userAvatar.type === "avatar" ? (
                        <Avatar
                          className="w-full h-full"
                          {...userAvatar.config}
                        />
                      ) : (
                        <img
                          src={userAvatar.data}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <FaUserCircle className="text-3xl text-[#EAEAEA]" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">Welcome!</p>
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="text-[#FF6B35] text-sm"
                    >
                      Change account
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
                    <FaUserCircle className="text-3xl text-[#EAEAEA]" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{t.nickname}</p>
                    <button
                      onClick={() => setShowLoginModal(true)}
                      className="text-[#FF6B35] text-sm"
                    >
                      Login/Register
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Nickname Input for non-logged in users */}
            {!isLoggedIn && (
              <div className="mb-6 space-y-2">
                <label className="block text-sm font-medium text-[#EAEAEA]">
                  {t.nickname}
                </label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t.yourName}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                />
              </div>
            )}

            {/* Create Room */}
            <div className="mb-6 space-y-2">
              <label className="block text-sm font-medium text-[#EAEAEA]">
                {t.createRoom}
              </label>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 relative">
                  <input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder={t.roomCodePlaceholder}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#EAEAEA] hover:text-white p-2"
                    title="Copy room code"
                  >
                    {copied ? (
                      <FaCheck className="text-sm" />
                    ) : (
                      <FaCopy className="text-sm" />
                    )}
                  </button>
                </div>
                <button className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20">
                  <FaPlus /> {t.create}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="password-protection"
                  checked={isPasswordProtected}
                  onChange={() => setIsPasswordProtected(!isPasswordProtected)}
                  className="w-4 h-4 rounded border-white/10 bg-white/10 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <label
                  htmlFor="password-protection"
                  className="text-sm text-[#EAEAEA]"
                >
                  {t.setPassword}
                </label>
              </div>

              {isPasswordProtected && (
                <div className="mt-2">
                  <input
                    type="password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder={t.roomPassword}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Join Room */}
            <div className="mb-6 space-y-2">
              <label className="block text-sm font-medium text-[#EAEAEA]">
                {t.joinRoom}
              </label>
              <div className="flex items-center gap-3">
                <input
                  placeholder={t.enterRoomCode}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                />
                <button className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20">
                  <FaDoorOpen /> {t.join}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        t={t}
      />
    </div>
  );
}
