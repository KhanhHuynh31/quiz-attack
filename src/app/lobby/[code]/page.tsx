"use client";
import React, { useCallback, useMemo, useState, useEffect, JSX } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  FaHome,
  FaUsers,
  FaCog,
  FaCopy,
  FaPlay,
  FaClock,
  FaGamepad,
  FaEye,
  FaTrophy,
  FaCheck,
  FaShare,
  FaQrcode,
  FaTimes,
  FaEyeSlash,
  FaQuestionCircle,
  FaUserTimes,
  FaBook,
  FaGlobe,
  FaPlus
} from "react-icons/fa";
import { GiCardPlay, GiDiceTwentyFacesTwenty } from "react-icons/gi";
import { QRCodeSVG } from "qrcode.react";
import Background from "@/components/Background";

// Types
interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
}

interface GameSettings {
  timePerQuestion: number;
  numberOfRounds: number;
  allowedCards: string[];
  showCorrectAnswer: boolean;
  maxPlayers: number | null;
  selectedQuizPack: string;
}

interface QuizPack {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  category: string;
  isCustom?: boolean;
}

interface PowerCard {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface GameMode {
  key: string;
  icon: JSX.Element;
  gradient: string;
}

// Custom hook for scroll management
const useScrollManagement = () => {
  const [scrollableRef, setScrollableRef] = useState<HTMLDivElement | null>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Custom scroll behavior if needed
  }, []);

  return { scrollableRef: setScrollableRef, handleScroll };
};

// Custom hook for enhanced animations
const useEnhancedAnimations = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return { staggerChildren, fadeIn, isAnimating, setIsAnimating };
};

// Translations
const translations = {
  en: {
    home: "Home",
    quizAttack: "Quiz Attack",
    room: "Room",
    players: "Players",
    gameMode: "Game Mode",
    settings: "Settings",
    chooseGameMode: "Choose Game Mode",
    classic: "Classic Quiz",
    classicDesc: "Traditional quiz format with multiple choice questions",
    battle: "Battle Mode",
    battleDesc: "Competitive quiz with power cards and special abilities",
    pve: "PvE Mode", 
    pveDesc: "Player vs Environment with AI opponents",
    gameSettings: "Game Settings",
    timePerQuestion: "Time per Question",
    numberOfRounds: "Number of Rounds",
    allowedPowerCards: "Allowed Power Cards",
    showCorrectAnswer: "Show Correct Answer",
    startGame: "Start Game",
    host: "Host",
    ready: "Ready",
    notReady: "Not Ready",
    maxPlayers: "Max Players",
    unlimited: "Unlimited",
    quizPacks: "Quiz Packs",
    selectedPack: "Selected Pack",
    kickPlayer: "Kick Player",
    createCustomPack: "Create Custom Pack",
    addCustomPack: "Add Custom Pack",
    // Power cards
    boost: "Double Points",
    boostDesc: "Double your score for next question",
    freeze: "Freeze Time", 
    freezeDesc: "Stop the timer for 5 seconds",
    double: "Second Chance",
    doubleDesc: "Get another attempt if wrong",
    peek: "Peek Answer",
    peekDesc: "See one wrong answer eliminated",
    shield: "Shield",
    shieldDesc: "Protect from negative effects",
    swap: "Answer Swap",
    swapDesc: "Swap your answer with another player",
    bomb: "Time Bomb",
    bombDesc: "Reduce other players' time by 50%",
    mystery: "Mystery Box",
    mysteryDesc: "Random power-up effect",
    heal: "Health Boost",
    healDesc: "Restore health in survival mode",
    mirror: "Mirror Shield",
    mirrorDesc: "Reflect attacks back to sender"
  },
  vi: {
    home: "Trang chủ", 
    quizAttack: "Quiz Attack",
    room: "Phòng",
    players: "Người chơi",
    gameMode: "Chế độ chơi",
    settings: "Cài đặt", 
    chooseGameMode: "Chọn chế độ chơi",
    classic: "Quiz Cổ điển",
    classicDesc: "Định dạng quiz truyền thống với câu hỏi trắc nghiệm",
    battle: "Chế độ Đấu",
    battleDesc: "Quiz cạnh tranh với thẻ sức mạnh và khả năng đặc biệt",
    pve: "Chế độ PvE",
    pveDesc: "Người chơi đấu với môi trường có đối thủ AI",
    gameSettings: "Cài đặt trò chơi",
    timePerQuestion: "Thời gian mỗi câu",
    numberOfRounds: "Số vòng chơi", 
    allowedPowerCards: "Thẻ sức mạnh cho phép",
    showCorrectAnswer: "Hiện đáp án đúng",
    startGame: "Bắt đầu",
    host: "Chủ phòng",
    ready: "Sẵn sàng",
    notReady: "Chưa sẵn sàng", 
    maxPlayers: "Tối đa người chơi",
    unlimited: "Không giới hạn",
    quizPacks: "Bộ câu hỏi",
    selectedPack: "Bộ đã chọn",
    kickPlayer: "Đá khỏi phòng",
    createCustomPack: "Tạo bộ câu hỏi",
    addCustomPack: "Thêm bộ câu hỏi",
    // Power cards
    boost: "Điểm Kép",
    boostDesc: "Nhân đôi điểm cho câu tiếp theo",
    freeze: "Đóng Băng Thời Gian",
    freezeDesc: "Dừng đồng hồ đếm ngược 5 giây", 
    double: "Cơ Hội Thứ Hai",
    doubleDesc: "Có thêm lần thử nếu sai",
    peek: "Nhìn Trộm Đáp Án",
    peekDesc: "Thấy một đáp án sai bị loại",
    shield: "Khiên Bảo Vệ", 
    shieldDesc: "Bảo vệ khỏi hiệu ứng tiêu cực",
    swap: "Hoán Đổi Đáp Án",
    swapDesc: "Hoán đổi đáp án với người chơi khác",
    bomb: "Bom Thời Gian",
    bombDesc: "Giảm 50% thời gian của người chơi khác",
    mystery: "Hộp Bí Ẩn", 
    mysteryDesc: "Hiệu ứng sức mạnh ngẫu nhiên",
    heal: "Hồi Máu",
    healDesc: "Khôi phục máu trong chế độ sinh tồn",
    mirror: "Khiên Phản Chiếu",
    mirrorDesc: "Phản chiếu tấn công về người gửi"
  }
} as const;

// Custom hook for i18n
const useI18n = () => {
  const [language, setLanguage] = useState<keyof typeof translations>("en");

  useEffect(() => {
    const saved = localStorage.getItem("quiz-attack-lang");
    const browserLang = navigator.language.split("-")[0];
    const defaultLang = (saved || (browserLang === "vi" ? "vi" : "en")) as keyof typeof translations;
    setLanguage(defaultLang);
  }, []);

  const changeLanguage = useCallback((lang: keyof typeof translations) => {
    setLanguage(lang);
    localStorage.setItem("quiz-attack-lang", lang);
  }, []);

  const t = translations[language];

  return { language, changeLanguage, t };
};

// QR Code Modal Component
const QRCodeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
}> = ({ isOpen, onClose, shareLink }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-md w-full bg-[#2B2D42] rounded-3xl border border-white/10 p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#EAEAEA] hover:text-white transition-colors"
        >
          <FaTimes />
        </button>
        <h3 className="text-xl font-bold text-white mb-4 text-center">QR Code</h3>
        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeSVG value={shareLink} size={200} />
          </div>
        </div>
        <p className="text-[#EAEAEA] text-sm text-center">Scan this QR code to join the room</p>
      </motion.div>
    </motion.div>
  );
};

// Player Card Component
const PlayerCard: React.FC<{
  player: Player;
  onKick: (id: string) => void;
  index: number;
}> = ({ player, onKick, index }) => {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-center justify-between p-3 rounded-lg ${
        player.isReady
          ? "bg-green-500/20 border-green-500/30"
          : "bg-red-500/20 border-red-500/30"
      } border`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{player.avatar}</span>
        <div>
          <p className="font-medium">{player.name}</p>
          {player.isHost ? (
            <p className="text-xs text-yellow-400">Host</p>
          ) : (
            <p className="text-xs text-white/60">
              {player.isReady ? "Ready" : "Not Ready"}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${player.isReady ? "bg-green-500" : "bg-red-500"}`}></div>
        {!player.isHost && (
          <button
            onClick={() => onKick(player.id)}
            className="text-orange-400 hover:text-orange-300 text-xs"
            title="Kick Player"
          >
            <FaUserTimes />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Power Card Component
const PowerCardItem: React.FC<{
  card: PowerCard;
  isEnabled: boolean;
  onToggle: (cardId: string) => void;
}> = ({ card, isEnabled, onToggle }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={() => onToggle(card.id)}
      className={`p-3 rounded-lg cursor-pointer transition-all border ${
        isEnabled
          ? "bg-green-500/20 border-green-500/50"
          : "bg-red-500/10 border-red-500/30"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{card.icon}</span>
          <span className="font-medium text-sm">{card.name}</span>
        </div>
        {isEnabled ? (
          <FaCheck className="text-green-500 text-sm" />
        ) : (
          <FaTimes className="text-red-500 text-sm" />
        )}
      </div>
      <p className="text-xs text-white/70">{card.description}</p>
    </motion.div>
  );
};

// Quiz Pack Item Component
const QuizPackItem: React.FC<{
  pack: QuizPack;
  isSelected: boolean;
  onSelect: (packId: string) => void;
}> = ({ pack, isSelected, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(pack.id)}
      className={`p-3 rounded-lg cursor-pointer transition-all border ${
        isSelected
          ? "bg-purple-500/20 border-purple-500/50"
          : "bg-white/10 border-white/20 hover:bg-white/15"
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-medium text-sm">{pack.name}</h4>
        <span className="text-xs text-white/60">{pack.questionCount}</span>
      </div>
      <p className="text-xs text-white/70 mb-2">{pack.description}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full ${
          pack.isCustom ? "bg-green-500/20 text-green-400" : "bg-white/10"
        }`}>
          {pack.category}
        </span>
        {isSelected && (
          <FaCheck className="text-purple-400 text-sm" />
        )}
      </div>
    </motion.div>
  );
};

// Game Mode Item Component
const GameModeItem: React.FC<{
  mode: GameMode;
  isSelected: boolean;
  onSelect: (modeKey: string) => void;
  t: any;
}> = ({ mode, isSelected, onSelect, t }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(mode.key)}
      className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-all border ${
        isSelected
          ? "bg-gradient-to-r " + mode.gradient + " border-orange-500/50"
          : "bg-white/10 border-white/20 hover:bg-white/15"
      }`}
    >
      <div className="flex-shrink-0">{mode.icon}</div>
      <div className="flex-1">
        <h4 className="font-bold">
          {t[mode.key as keyof typeof t] as string}
        </h4>
        <p className="text-sm text-white/70">
          {t[`${mode.key}Desc` as keyof typeof t] as string}
        </p>
      </div>
      {isSelected && (
        <FaCheck className="text-white" />
      )}
    </motion.div>
  );
};

// Main Component
const QuizAttackLobbyEnhanced: React.FC = () => {
  const { language, changeLanguage, t } = useI18n();
  const { staggerChildren, fadeIn } = useEnhancedAnimations();
  const { scrollableRef, handleScroll } = useScrollManagement();
  
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Host Player", avatar: "👑", isHost: true, isReady: true },
    { id: "2", name: "Player 2", avatar: "😊", isHost: false, isReady: true },
    { id: "3", name: "Player 3", avatar: "🔥", isHost: false, isReady: false },
    { id: "4", name: "Player 4", avatar: "⚡", isHost: false, isReady: true },
  ]);

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    timePerQuestion: 30,
    numberOfRounds: 10,
    allowedCards: ["boost", "freeze", "double", "peek", "shield", "swap", "bomb", "mystery", "heal", "mirror"],
    showCorrectAnswer: true,
    maxPlayers: null,
    selectedQuizPack: "general"
  });
  
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [showRoomCode, setShowRoomCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"mode" | "settings" | "packs">("mode");
  const [selectedGameMode, setSelectedGameMode] = useState<string>("classic");
  const [copied, setCopied] = useState<boolean>(false);

  // Get room code from URL path
  const roomCode = useMemo(() => {
    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split('/');
      return pathParts[pathParts.length - 1] || "QUIZ123";
    }
    return "QUIZ123";
  }, []);

  // Game modes configuration
  const MODES: GameMode[] = useMemo(() => [
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
  ], []);

  // Power cards configuration
  const cardTypes: PowerCard[] = useMemo(() => [
    { id: "boost", name: t.boost, icon: "🚀", description: t.boostDesc },
    { id: "freeze", name: t.freeze, icon: "❄️", description: t.freezeDesc },
    { id: "double", name: t.double, icon: "🎯", description: t.doubleDesc },
    { id: "peek", name: t.peek, icon: "👁️", description: t.peekDesc },
    { id: "shield", name: t.shield, icon: "🛡️", description: t.shieldDesc },
    { id: "swap", name: t.swap, icon: "🔄", description: t.swapDesc },
    { id: "bomb", name: t.bomb, icon: "💣", description: t.bombDesc },
    { id: "mystery", name: t.mystery, icon: "❓", description: t.mysteryDesc },
    { id: "heal", name: t.heal, icon: "💚", description: t.healDesc },
    { id: "mirror", name: t.mirror, icon: "🪞", description: t.mirrorDesc }
  ], [t]);

  // Quiz packs configuration
  const [quizPacks, setQuizPacks] = useState<QuizPack[]>([
    { id: "general", name: "General Knowledge", description: "Mixed topics for everyone", questionCount: 500, category: "General" },
    { id: "science", name: "Science & Technology", description: "Physics, chemistry, biology, IT", questionCount: 300, category: "Science" },
    { id: "history", name: "World History", description: "Historical events and figures", questionCount: 250, category: "History" },
    { id: "sports", name: "Sports & Games", description: "Sports trivia and gaming", questionCount: 200, category: "Sports" },
    { id: "entertainment", name: "Movies & Music", description: "Pop culture entertainment", questionCount: 350, category: "Entertainment" },
    { id: "geography", name: "World Geography", description: "Countries, capitals, landmarks", questionCount: 180, category: "Geography" }
  ]);

  // Event handlers
  const handleSettingChange = useCallback(<K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setGameSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const toggleCard = useCallback((cardId: string) => {
    setGameSettings((prev) => ({
      ...prev,
      allowedCards: prev.allowedCards.includes(cardId)
        ? prev.allowedCards.filter((id) => id !== cardId)
        : [...prev.allowedCards, cardId],
    }));
  }, []);

  const kickPlayer = useCallback((playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  }, []);

  const startGame = useCallback(() => {
    console.log("Starting game with settings:", gameSettings);
    console.log("Selected mode:", selectedGameMode);
  }, [gameSettings, selectedGameMode]);

  const shareLink = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://quiz.attack";
    return `${base}/join/${roomCode}`;
  }, [roomCode]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [shareLink]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: "Join my Quiz Attack room",
        text: "Join my Quiz Attack room with this code: " + roomCode,
        url: shareLink,
      }).catch(console.error);
    } else {
      handleCopy();
    }
  }, [handleCopy, roomCode, shareLink]);

  const handleCreateCustomPack = useCallback(() => {
    const newPack: QuizPack = {
      id: `custom_${Date.now()}`,
      name: "My Custom Pack",
      description: "Custom quiz pack",
      questionCount: 0,
      category: "Custom",
      isCustom: true
    };
    setQuizPacks(prev => [...prev, newPack]);
    handleSettingChange("selectedQuizPack", newPack.id);
  }, [handleSettingChange]);

  return (
    <div className="min-h-screen max-h-screen overflow-hidden text-white flex flex-col">
      <Background />
      
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-4 h-20 flex-shrink-0"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
        >
          <FaHome className="text-lg" />
          <span>{t.home}</span>
        </motion.button>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            {t.quizAttack}
          </h1>
          <div className="flex items-center justify-center space-x-2 mt-1">
            <span className="text-sm text-white/70">{t.room}:</span>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-mono">
                {showRoomCode ? roomCode : "****"}
              </span>
              <button
                onClick={() => setShowRoomCode(!showRoomCode)}
                className="text-white/70 hover:text-white transition-colors"
              >
                {showRoomCode ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        </motion.div>

        <button
          onClick={() => changeLanguage(language === "en" ? "vi" : "en")}
          className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
        >
          <FaGlobe className="text-sm" />
          <span className="text-sm font-medium">{language.toUpperCase()}</span>
        </button>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full max-w-7xl mx-auto w-full flex-1 min-h-0">
          {/* Players List - Left */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex flex-col h-full overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FaUsers className="text-xl text-blue-400" />
                <h2 className="text-lg font-bold">
                  {t.players} ({players.length}/{gameSettings.maxPlayers || "∞"})
                </h2>
              </div>
            </div>

            {/* Max Players Setting */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">{t.maxPlayers}</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSettingChange("maxPlayers", gameSettings.maxPlayers === null ? 8 : null)}
                    className={`px-3 py-1 rounded text-xs ${gameSettings.maxPlayers === null ? "bg-blue-500" : "bg-white/20"}`}
                  >
                    {t.unlimited}
                  </button>
                  {gameSettings.maxPlayers !== null && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleSettingChange("maxPlayers", Math.max(2, (gameSettings.maxPlayers || 8) - 1))}
                        className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-xs"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">{gameSettings.maxPlayers}</span>
                      <button
                        onClick={() => handleSettingChange("maxPlayers", Math.min(20, (gameSettings.maxPlayers || 8) + 1))}
                        className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-xs"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Players List with Scroll */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              <AnimatePresence>
                {players.map((player, index) => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    onKick={kickPlayer} 
                    index={index} 
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Game Mode & Settings - Right */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 flex flex-col h-full overflow-hidden"
          >
            {/* Share link and actions */}
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-[#EAEAEA] flex-shrink-0">
              <div className="flex-1 truncate text-sm">{shareLink}</div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition-all transform hover:scale-105"
                  title="Copy link"
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition-all transform hover:scale-105"
                  title="Share room"
                >
                  <FaShare />
                </button>
                <button
                  onClick={() => setShowQRCode(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition-all transform hover:scale-105"
                  title="Show QR code"
                >
                  <FaQrcode />
                </button>
              </div>
            </div>

            {/* Selected Pack Display */}
            {gameSettings.selectedQuizPack && (
              <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FaBook className="text-purple-400" />
                    <span className="text-sm font-medium">{t.selectedPack}:</span>
                  </div>
                  <span className="text-sm">
                    {quizPacks.find(p => p.id === gameSettings.selectedQuizPack)?.name}
                  </span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-2 mb-4 flex-shrink-0">
              <button
                onClick={() => setActiveTab("mode")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === "mode"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <FaGamepad />
                <span>{t.gameMode}</span>
              </button>
              <button
                onClick={() => setActiveTab("packs")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === "packs"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <FaBook />
                <span>{t.quizPacks}</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === "settings"
                    ? "bg-blue-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                <FaCog />
                <span>{t.settings}</span>
              </button>
            </div>

            {/* Tab Content with Scroll */}
            <div className="flex-1 overflow-hidden min-h-0">
              <AnimatePresence mode="wait">
                {activeTab === "mode" && (
                  <motion.div
                    key="mode"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full overflow-y-auto space-y-4 pr-2"
                  >
                    <h3 className="text-xl font-bold mb-4">{t.chooseGameMode}</h3>
                    <div className="space-y-3">
                      {MODES.map((mode) => (
                        <GameModeItem
                          key={mode.key}
                          mode={mode}
                          isSelected={selectedGameMode === mode.key}
                          onSelect={setSelectedGameMode}
                          t={t}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "packs" && (
                  <motion.div
                    key="packs"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full overflow-y-auto space-y-4 pr-2"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{t.quizPacks}</h3>
                      <button
                        onClick={handleCreateCustomPack}
                        className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 px-3 py-2 rounded-lg border border-green-500/50 transition-colors text-sm"
                      >
                        <FaPlus />
                        <span>{t.addCustomPack}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {quizPacks.map((pack) => (
                        <QuizPackItem
                          key={pack.id}
                          pack={pack}
                          isSelected={gameSettings.selectedQuizPack === pack.id}
                          onSelect={(id) => handleSettingChange("selectedQuizPack", id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "settings" && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full overflow-y-auto space-y-6 pr-2"
                  >
                    <h3 className="text-xl font-bold mb-4">{t.gameSettings}</h3>

                    {/* Time Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaClock className="text-yellow-400" />
                          <label className="font-medium">{t.timePerQuestion}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleSettingChange(
                                "timePerQuestion",
                                Math.max(10, gameSettings.timePerQuestion - 5)
                              )
                            }
                            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
                          >
                            -
                          </button>
                          <span className="w-12 text-center">
                            {gameSettings.timePerQuestion}s
                          </span>
                          <button
                            onClick={() =>
                              handleSettingChange(
                                "timePerQuestion",
                                Math.min(60, gameSettings.timePerQuestion + 5)
                              )
                            }
                            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaTrophy className="text-yellow-400" />
                          <label className="font-medium">{t.numberOfRounds}</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleSettingChange(
                                "numberOfRounds",
                                Math.max(5, gameSettings.numberOfRounds - 1)
                              )
                            }
                            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
                          >
                            -
                          </button>
                          <span className="w-12 text-center">
                            {gameSettings.numberOfRounds}
                          </span>
                          <button
                            onClick={() =>
                              handleSettingChange(
                                "numberOfRounds",
                                Math.min(50, gameSettings.numberOfRounds + 1)
                              )
                            }
                            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Power Cards */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center space-x-2">
                        <span>{t.allowedPowerCards}</span>
                        <span className="text-sm text-white/60">
                          ({gameSettings.allowedCards.length}/{cardTypes.length})
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cardTypes.map((card) => (
                          <PowerCardItem
                            key={card.id}
                            card={card}
                            isEnabled={gameSettings.allowedCards.includes(card.id)}
                            onToggle={toggleCard}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Toggle Settings */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FaEye className="text-purple-400" />
                          <label className="font-medium">{t.showCorrectAnswer}</label>
                        </div>
                        <button
                          onClick={() =>
                            handleSettingChange(
                              "showCorrectAnswer",
                              !gameSettings.showCorrectAnswer
                            )
                          }
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            gameSettings.showCorrectAnswer
                              ? "bg-green-500"
                              : "bg-gray-500"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                              gameSettings.showCorrectAnswer
                                ? "translate-x-6"
                                : "translate-x-0.5"
                            }`}
                          ></div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center mt-6 flex-shrink-0"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-12 py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
          >
            <FaPlay className="text-xl" />
            <span>{t.startGame}</span>
          </motion.button>
        </motion.div>
      </div>
      
      <QRCodeModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        shareLink={shareLink}
      />
    </div>
  );
};

export default QuizAttackLobbyEnhanced;