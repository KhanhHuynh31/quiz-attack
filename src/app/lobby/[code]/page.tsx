"use client";
import React, { useCallback, useMemo, useState, JSX } from "react";
import { motion, AnimatePresence, Transition, Variants } from "framer-motion";
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
  FaPlus,
  FaCrown,
  FaUserCheck,
  FaUserClock,
  FaShieldAlt,
  FaBolt,
  FaMagic,
} from "react-icons/fa";
import {
  GiBomber,
  GiBrainFreeze,
  GiCardPlay,
  GiDiceTwentyFacesTwenty,
  GiDoubleShot,
  GiHealing,
  GiMirrorMirror,
  GiPearlNecklace,
  GiSwapBag,
} from "react-icons/gi";
import { QRCodeModal } from "@/components/QrCodeModal";
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";

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
  icon: JSX.Element;
  description: string;
}

interface GameMode {
  key: string;
  icon: JSX.Element;
  gradient: string;
}

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
    mirrorDesc: "Reflect attacks back to sender",
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
    mirrorDesc: "Phản chiếu tấn công về người gửi",
  },
} as const;

// Custom hook for i18n
const useI18n = () => {
  const [language, setLanguage] = useState<keyof typeof translations>("en");

  const changeLanguage = useCallback((lang: keyof typeof translations) => {
    setLanguage(lang);
  }, []);

  const t = translations[language];

  return { language, changeLanguage, t };
};

// Enhanced Player Card Component with improved hover effects
const PlayerCard: React.FC<{
  player: Player;
  onKick: (id: string) => void;
  index: number;
}> = ({ player, onKick, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ x: -50, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: -50, opacity: 0, scale: 0.9 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative flex items-center justify-between p-4 rounded-xl cursor-pointer overflow-hidden transition-all duration-300 ${
        player.isReady
          ? "bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/40"
          : "bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/40"
      } border shadow-lg hover:shadow-xl`}
    >
      {/* Animated background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* Glowing border effect on hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: `linear-gradient(45deg, ${
              player.isReady
                ? "rgba(34, 197, 94, 0.3)"
                : "rgba(239, 68, 68, 0.3)"
            }, transparent, ${
              player.isReady
                ? "rgba(34, 197, 94, 0.3)"
                : "rgba(239, 68, 68, 0.3)"
            })`,
            backgroundSize: "300% 300%",
          }}
        />
      )}

      <div className="relative z-10 flex items-center space-x-3">
        <motion.div
          animate={
            isHovered
              ? {
                  scale: 1.2,
                  rotate: [0, -5, 5, 0],
                }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.3 }}
          className="text-3xl relative"
        >
          {player.avatar}
          {player.isHost && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2 + index * 0.1,
                type: "spring",
                stiffness: 300,
              }}
              className="absolute -top-1 -right-1"
            >
              <FaCrown className="text-yellow-400 text-sm drop-shadow-lg" />
            </motion.div>
          )}
        </motion.div>

        <div>
          <motion.p
            animate={isHovered ? { x: 5 } : { x: 0 }}
            className="font-bold text-lg"
          >
            {player.name}
          </motion.p>
          <motion.div
            className="flex items-center space-x-1"
            animate={isHovered ? { x: 5 } : { x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {player.isHost ? (
              <>
                <FaCrown className="text-yellow-400 text-xs" />
                <span className="text-xs text-yellow-400 font-medium">
                  Host
                </span>
              </>
            ) : (
              <>
                {player.isReady ? (
                  <FaUserCheck className="text-green-400 text-xs" />
                ) : (
                  <FaUserClock className="text-red-400 text-xs" />
                )}
                <span
                  className={`text-xs font-medium ${
                    player.isReady ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {player.isReady ? "Ready" : "Not Ready"}
                </span>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 flex items-center space-x-3">
        {/* Status indicator with pulse animation */}
        <motion.div
          className={`w-4 h-4 rounded-full relative ${
            player.isReady ? "bg-green-500" : "bg-red-500"
          }`}
          animate={
            player.isReady
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(34, 197, 94, 0.7)",
                    "0 0 0 10px rgba(34, 197, 94, 0)",
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Kick button with enhanced animation */}
        {!player.isHost && (
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, rotate: 180 }}
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onKick(player.id);
                }}
                className="text-orange-400 hover:text-orange-300 bg-orange-400/20 p-2 rounded-lg border border-orange-400/30 transition-colors"
                title="Kick Player"
              >
                <FaUserTimes className="text-sm" />
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Power Card Component
const PowerCardItem: React.FC<{
  card: PowerCard;
  isEnabled: boolean;
  onToggle: (cardId: string) => void;
  index: number;
}> = ({ card, isEnabled, onToggle, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
      whileHover={{
        scale: 1.05,
        y: -3,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onToggle(card.id)}
      className={`relative p-4 rounded-xl cursor-pointer transition-all border overflow-hidden ${
        isEnabled
          ? "bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/50 shadow-lg"
          : "bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30"
      }`}
    >
      {/* Animated background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={
                isHovered
                  ? {
                      rotate: [0, -10, 10, 0],
                      scale: 1.2,
                    }
                  : { rotate: 0, scale: 1 }
              }
              transition={{ duration: 0.3 }}
              className="text-2xl"
            >
              {card.icon}
            </motion.div>
            <span className="font-bold text-sm">{card.name}</span>
          </div>
          <motion.div
            animate={
              isEnabled
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }
                : { scale: 1, rotate: 0 }
            }
            transition={{ duration: 0.5 }}
          >
            {isEnabled ? (
              <FaCheck className="text-green-400 text-lg drop-shadow-lg" />
            ) : (
              <FaTimes className="text-red-400 text-lg" />
            )}
          </motion.div>
        </div>
        <motion.p
          animate={isHovered ? { x: 3 } : { x: 0 }}
          className="text-xs text-white/80 leading-relaxed"
        >
          {card.description}
        </motion.p>
      </div>
    </motion.div>
  );
};

// Enhanced Quiz Pack Item Component
const QuizPackItem: React.FC<{
  pack: QuizPack;
  isSelected: boolean;
  onSelect: (packId: string) => void;
  index: number;
}> = ({ pack, isSelected, onSelect, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 150 }}
      whileHover={{
        scale: 1.03,
        y: -5,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(pack.id)}
      className={`relative p-4 rounded-xl cursor-pointer transition-all border overflow-hidden ${
        isSelected
          ? "bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/50 shadow-lg"
          : "bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-white/30"
      }`}
    >
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <motion.h4
            animate={isHovered ? { x: 3 } : { x: 0 }}
            className="font-bold text-sm"
          >
            {pack.name}
          </motion.h4>
          <motion.div
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            className="flex items-center space-x-1"
          >
            <FaBook className="text-xs text-blue-400" />
            <span className="text-xs font-mono text-white/80">
              {pack.questionCount}
            </span>
          </motion.div>
        </div>

        <motion.p
          animate={isHovered ? { x: 3 } : { x: 0 }}
          transition={{ delay: 0.05 }}
          className="text-xs text-white/70 mb-3 leading-relaxed"
        >
          {pack.description}
        </motion.p>

        <div className="flex items-center justify-between">
          <motion.span
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              pack.isCustom
                ? "bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-300 border border-green-400/50"
                : "bg-gradient-to-r from-white/10 to-white/5 text-white/80"
            }`}
          >
            {pack.category}
          </motion.span>

          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaCheck className="text-purple-400 text-lg drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Game Mode Item Component
const GameModeItem: React.FC<{
  mode: GameMode;
  isSelected: boolean;
  onSelect: (modeKey: string) => void;
  t: any;
  index: number;
}> = ({ mode, isSelected, onSelect, t, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 150 }}
      whileHover={{
        scale: 1.02,
        y: -3,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(mode.key)}
      className={`relative flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all border overflow-hidden ${
        isSelected
          ? `bg-gradient-to-r ${mode.gradient} border-orange-500/50 shadow-xl`
          : "bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-white/40"
      }`}
    >
      {/* Animated background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex items-center space-x-4 w-full">
        <motion.div
          animate={
            isHovered
              ? {
                  scale: 1.3,
                  rotate: [0, -10, 10, 0],
                }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.4 }}
          className="flex-shrink-0 p-3 rounded-lg bg-white/10"
        >
          {mode.icon}
        </motion.div>

        <div className="flex-1">
          <motion.h4
            animate={isHovered ? { x: 5 } : { x: 0 }}
            className="font-bold text-lg"
          >
            {t[mode.key as keyof typeof t] as string}
          </motion.h4>
          <motion.p
            animate={isHovered ? { x: 5 } : { x: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm text-white/70 leading-relaxed"
          >
            {t[`${mode.key}Desc` as keyof typeof t] as string}
          </motion.p>
        </div>

        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex-shrink-0"
            >
              <FaCheck className="text-white text-xl drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Main Component
const QuizAttackLobbyEnhanced: React.FC = () => {
  const { language, changeLanguage, t } = useI18n();
  const { staggerChildren, slideInLeft, slideInRight, scaleIn, fadeUp } =
    useEnhancedAnimations();

  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "Host Player", avatar: "👑", isHost: true, isReady: true },
    { id: "2", name: "Player 2", avatar: "😊", isHost: false, isReady: true },
    { id: "3", name: "Player 3", avatar: "🔥", isHost: false, isReady: false },
    { id: "4", name: "Player 4", avatar: "⚡", isHost: false, isReady: true },
  ]);

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    timePerQuestion: 30,
    numberOfRounds: 10,
    allowedCards: [
      "boost",
      "freeze",
      "double",
      "peek",
      "shield",
      "swap",
      "bomb",
      "mystery",
      "heal",
      "mirror",
    ],
    showCorrectAnswer: true,
    maxPlayers: null,
    selectedQuizPack: "general",
  });

  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [showRoomCode, setShowRoomCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"mode" | "settings" | "packs">(
    "mode"
  );
  const [selectedGameMode, setSelectedGameMode] = useState<string>("classic");
  const [copied, setCopied] = useState<boolean>(false);

  // Get room code from URL path
  const roomCode = useMemo(() => {
    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split("/");
      return pathParts[pathParts.length - 1] || "QUIZ123";
    }
    return "QUIZ123";
  }, []);

  // Game modes configuration with react-icons
  const MODES: GameMode[] = useMemo(
    () => [
      {
        key: "classic",
        icon: <FaQuestionCircle className="text-2xl text-blue-400" />,
        gradient: "from-blue-500/30 to-blue-600/30",
      },
      {
        key: "battle",
        icon: <GiCardPlay className="text-2xl text-red-400" />,
        gradient: "from-red-500/30 to-red-600/30",
      },
      {
        key: "pve",
        icon: <GiDiceTwentyFacesTwenty className="text-2xl text-purple-400" />,
        gradient: "from-purple-500/30 to-purple-600/30",
      },
    ],
    []
  );

  // Power cards configuration with react-icons
  const cardTypes: PowerCard[] = useMemo(
    () => [
      {
        id: "boost",
        name: t.boost,
        icon: <GiDoubleShot className="text-yellow-400" />,
        description: t.boostDesc,
      },
      {
        id: "freeze",
        name: t.freeze,
        icon: <GiBrainFreeze className="text-blue-400" />,
        description: t.freezeDesc,
      },
      {
        id: "double",
        name: t.double,
        icon: <FaBolt className="text-orange-400" />,
        description: t.doubleDesc,
      },
      {
        id: "peek",
        name: t.peek,
        icon: <GiPearlNecklace className="text-green-400" />,
        description: t.peekDesc,
      },
      {
        id: "shield",
        name: t.shield,
        icon: <FaShieldAlt className="text-gray-400" />,
        description: t.shieldDesc,
      },
      {
        id: "swap",
        name: t.swap,
        icon: <GiSwapBag className="text-purple-400" />,
        description: t.swapDesc,
      },
      {
        id: "bomb",
        name: t.bomb,
        icon: <GiBomber className="text-red-400" />,
        description: t.bombDesc,
      },
      {
        id: "mystery",
        name: t.mystery,
        icon: <GiMirrorMirror className="text-pink-400" />,
        description: t.mysteryDesc,
      },
      {
        id: "heal",
        name: t.heal,
        icon: <GiHealing className="text-green-400" />,
        description: t.healDesc,
      },
      {
        id: "mirror",
        name: t.mirror,
        icon: <GiMirrorMirror className="text-cyan-400" />,
        description: t.mirrorDesc,
      },
    ],
    [t]
  );

  // Quiz packs configuration
  const [quizPacks, setQuizPacks] = useState<QuizPack[]>([
    {
      id: "general",
      name: "General Knowledge",
      description: "Mixed topics for everyone",
      questionCount: 500,
      category: "General",
    },
    {
      id: "science",
      name: "Science & Technology",
      description: "Physics, chemistry, biology, IT",
      questionCount: 300,
      category: "Science",
    },
    {
      id: "history",
      name: "World History",
      description: "Historical events and figures",
      questionCount: 250,
      category: "History",
    },
    {
      id: "sports",
      name: "Sports & Games",
      description: "Sports trivia and gaming",
      questionCount: 200,
      category: "Sports",
    },
    {
      id: "entertainment",
      name: "Movies & Music",
      description: "Pop culture entertainment",
      questionCount: 350,
      category: "Entertainment",
    },
    {
      id: "geography",
      name: "World Geography",
      description: "Countries, capitals, landmarks",
      questionCount: 180,
      category: "Geography",
    },
  ]);

  // Event handlers
  const handleSettingChange = useCallback(
    <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
      setGameSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const toggleCard = useCallback((cardId: string) => {
    setGameSettings((prev) => ({
      ...prev,
      allowedCards: prev.allowedCards.includes(cardId)
        ? prev.allowedCards.filter((id) => id !== cardId)
        : [...prev.allowedCards, cardId],
    }));
  }, []);

  const kickPlayer = useCallback((playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }, []);

  const startGame = useCallback(() => {
    console.log("Starting game with settings:", gameSettings);
    console.log("Selected mode:", selectedGameMode);
  }, [gameSettings, selectedGameMode]);

  const shareLink = useMemo(() => {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://quiz.attack";
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
      navigator
        .share({
          title: "Join my Quiz Attack room",
          text: "Join my Quiz Attack room with this code: " + roomCode,
          url: shareLink,
        })
        .catch(console.error);
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
      isCustom: true,
    };
    setQuizPacks((prev) => [...prev, newPack]);
    handleSettingChange("selectedQuizPack", newPack.id);
  }, [handleSettingChange]);

  return (
    <div className="min-h-screen max-h-screen overflow-hidden text-white flex flex-col">
      {/* Enhanced Header with floating animation */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="flex items-center justify-between p-6 h-24 flex-shrink-0 relative z-10"
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-3 bg-white/10 backdrop-blur-lg px-6 py-3 rounded-xl hover:bg-white/20 transition-all border border-white/20 shadow-lg"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <FaHome className="text-xl text-blue-400" />
          </motion.div>
          <span className="font-medium">{t.home}</span>
        </motion.button>

        <motion.div
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <motion.h1
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 200%" }}
          >
            {t.quizAttack}
          </motion.h1>
          <div className="flex items-center justify-center space-x-3 mt-2">
            <span className="text-sm text-white/70 font-medium">{t.room}:</span>
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-lg">
              <span className="text-sm font-mono font-bold">
                {showRoomCode ? roomCode : "••••••"}
              </span>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => setShowRoomCode(!showRoomCode)}
                className="text-white/70 hover:text-white transition-colors"
              >
                {showRoomCode ? <FaEyeSlash /> : <FaEye />}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => changeLanguage(language === "en" ? "vi" : "en")}
          className="flex items-center space-x-3 bg-white/10 backdrop-blur-lg px-4 py-3 rounded-xl hover:bg-white/20 transition-all border border-white/20"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <FaGlobe className="text-lg text-green-400" />
          </motion.div>
          <span className="text-sm font-bold">{language.toUpperCase()}</span>
        </motion.button>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-w-8xl mx-auto w-full flex-1 min-h-0">
          {/* Enhanced Players List - Left */}
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            animate="visible"
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col h-full overflow-hidden border border-white/20 shadow-xl"
          >
            <motion.div
              className="flex items-center justify-between mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaUsers className="text-2xl text-blue-400" />
                </motion.div>
                <h2 className="text-xl font-bold">
                  {t.players} ({players.length}/{gameSettings.maxPlayers || "∞"}
                  )
                </h2>
              </div>
            </motion.div>

            {/* Enhanced Max Players Setting */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl flex-shrink-0 border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold flex items-center space-x-2">
                  <FaUsers className="text-cyan-400" />
                  <span>{t.maxPlayers}</span>
                </label>
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      handleSettingChange(
                        "maxPlayers",
                        gameSettings.maxPlayers === null ? 8 : null
                      )
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      gameSettings.maxPlayers === null
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    {t.unlimited}
                  </motion.button>
                  <AnimatePresence>
                    {gameSettings.maxPlayers !== null && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="flex items-center space-x-2"
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            handleSettingChange(
                              "maxPlayers",
                              Math.max(2, (gameSettings.maxPlayers || 8) - 1)
                            )
                          }
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-bold transition-all border border-red-400/30"
                        >
                          -
                        </motion.button>
                        <span className="w-8 text-center text-lg font-bold">
                          {gameSettings.maxPlayers}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            handleSettingChange(
                              "maxPlayers",
                              Math.min(20, (gameSettings.maxPlayers || 8) + 1)
                            )
                          }
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-sm font-bold transition-all border border-green-400/30"
                        >
                          +
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Players List with Scroll */}
            <motion.div
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
              }}
            >
              <AnimatePresence mode="popLayout">
                {players.map((player, index) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    onKick={kickPlayer}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Enhanced Game Mode & Settings - Right */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col h-full overflow-hidden border border-white/20 shadow-xl"
          >
            {/* Enhanced Share link and actions */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
              className="mb-6 flex items-center gap-4 rounded-2xl border border-white/20 bg-gradient-to-r from-white/5 to-white/10 p-4 text-[#EAEAEA] flex-shrink-0 shadow-lg"
            >
              <div className="flex-1 truncate text-sm font-mono bg-black/20 p-2 rounded-lg">
                {shareLink}
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all transform border ${
                    copied
                      ? "bg-green-500/20 border-green-400/50 text-green-300"
                      : "bg-white/10 border-white/20 hover:bg-white/20"
                  }`}
                  title="Copy link"
                >
                  <motion.div
                    animate={
                      copied
                        ? { rotate: 360, scale: 1.2 }
                        : { rotate: 0, scale: 1 }
                    }
                    transition={{ duration: 0.3 }}
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                  </motion.div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 border-blue-400/50 px-4 py-3 text-sm font-medium hover:bg-blue-500/30 transition-all transform"
                  title="Share room"
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <FaShare className="text-blue-400" />
                  </motion.div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowQRCode(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-500/20 border-purple-400/50 px-4 py-3 text-sm font-medium hover:bg-purple-500/30 transition-all transform"
                  title="Show QR code"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FaQrcode className="text-purple-400" />
                  </motion.div>
                </motion.button>
              </div>
            </motion.div>

            {/* Enhanced Selected Pack Display */}
            <AnimatePresence>
              {gameSettings.selectedQuizPack && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/40 flex-shrink-0 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <FaBook className="text-purple-400 text-lg" />
                      </motion.div>
                      <span className="text-sm font-bold">
                        {t.selectedPack}:
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {
                        quizPacks.find(
                          (p) => p.id === gameSettings.selectedQuizPack
                        )?.name
                      }
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Tabs */}
            <motion.div
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="flex space-x-3 mb-6 flex-shrink-0 justify-between flex-wrap"
            >
              <div className="flex space-x-3 overflow-x-auto pr-2">
                {[
                  { key: "mode", icon: <FaGamepad />, label: t.gameMode },
                  { key: "packs", icon: <FaBook />, label: t.quizPacks },
                  { key: "settings", icon: <FaCog />, label: t.settings },
                ].map((tab, index) => (
                  <motion.button
                    key={tab.key}
                    variants={fadeUp}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setActiveTab(tab.key as "mode" | "settings" | "packs")
                    }
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-bold transition-all border ${
                      activeTab === tab.key
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400/50 shadow-lg"
                        : "bg-white/10 text-white/70 hover:bg-white/20 border-white/20"
                    }`}
                  >
                    <motion.div
                      animate={
                        activeTab === tab.key ? { rotate: 360 } : { rotate: 0 }
                      }
                      transition={{ duration: 0.5 }}
                    >
                      {tab.icon}
                    </motion.div>
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>
              {/* Enhanced Bottom Actions */}
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                className="flex items-center justify-center flex-shrink-0"
              >
                <motion.button
                  whileHover={{
                    scale: 1.08,
                    y: -3,
                    boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="relative flex items-center space-x-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 px-16 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all overflow-hidden border border-green-400/50"
                >
                  {/* Animated background effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  <div className="relative z-10 flex items-center space-x-4">
                    <motion.div
                      animate={{ x: [0, 5, -5, 0] }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <FaPlay className="text-2xl" />
                    </motion.div>
                    <span>{t.startGame}</span>
                  </div>
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Enhanced Tab Content with Scroll */}
            <div className="flex-1 overflow-hidden min-h-0">
              <AnimatePresence mode="wait">
                {activeTab === "mode" && (
                  <motion.div
                    key="mode"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 150 }}
                    className="h-full overflow-y-auto space-y-6 pr-3"
                  >
                    <motion.h3
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-2xl font-bold mb-6 flex items-center space-x-3"
                    >
                      <FaGamepad className="text-orange-400" />
                      <span>{t.chooseGameMode}</span>
                    </motion.h3>

                    <motion.div
                      variants={staggerChildren}
                      initial="hidden"
                      animate="visible"
                      className="space-y-4 p-3"
                    >
                      {MODES.map((mode, index) => (
                        <GameModeItem
                          key={mode.key}
                          mode={mode}
                          isSelected={selectedGameMode === mode.key}
                          onSelect={setSelectedGameMode}
                          t={t}
                          index={index}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === "packs" && (
                  <motion.div
                    key="packs"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 150 }}
                    className="h-full overflow-y-auto space-y-6 pr-3"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <motion.h3
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-2xl font-bold flex items-center space-x-3"
                      >
                        <FaBook className="text-purple-400" />
                        <span>{t.quizPacks}</span>
                      </motion.h3>

                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.3,
                          type: "spring",
                          stiffness: 200,
                        }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCreateCustomPack}
                        className="flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 px-4 py-3 rounded-xl border border-green-500/50 transition-all text-sm font-medium shadow-lg"
                      >
                        <motion.div
                          animate={{ rotate: [0, 90, 0] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            repeatDelay: 2,
                          }}
                        >
                          <FaPlus className="text-green-400" />
                        </motion.div>
                        <span>{t.addCustomPack}</span>
                      </motion.button>
                    </div>

                    <motion.div
                      variants={staggerChildren}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2"
                    >
                      {quizPacks.map((pack, index) => (
                        <QuizPackItem
                          key={pack.id}
                          pack={pack}
                          isSelected={gameSettings.selectedQuizPack === pack.id}
                          onSelect={(id) =>
                            handleSettingChange("selectedQuizPack", id)
                          }
                          index={index}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === "settings" && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 150 }}
                    className="h-full overflow-y-auto space-y-8 pr-3"
                  >
                    <motion.h3
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-2xl font-bold mb-6 flex items-center space-x-3"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <FaCog className="text-gray-400" />
                      </motion.div>
                      <span>{t.gameSettings}</span>
                    </motion.h3>

                    {/* Enhanced Time Settings */}
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-6"
                    >
                      <div className="p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <FaClock className="text-yellow-400 text-lg" />
                            </motion.div>
                            <label className="font-bold">
                              {t.timePerQuestion}
                            </label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                handleSettingChange(
                                  "timePerQuestion",
                                  Math.max(10, gameSettings.timePerQuestion - 5)
                                )
                              }
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-bold border border-red-400/30 transition-all"
                            >
                              -
                            </motion.button>
                            <motion.span
                              key={gameSettings.timePerQuestion}
                              initial={{ scale: 1.2, color: "#fbbf24" }}
                              animate={{ scale: 1, color: "#ffffff" }}
                              transition={{ duration: 0.3 }}
                              className="w-16 text-center font-bold text-lg"
                            >
                              {gameSettings.timePerQuestion}s
                            </motion.span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                handleSettingChange(
                                  "timePerQuestion",
                                  Math.min(60, gameSettings.timePerQuestion + 5)
                                )
                              }
                              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg font-bold border border-green-400/30 transition-all"
                            >
                              +
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <motion.div
                              animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <FaTrophy className="text-yellow-400 text-lg" />
                            </motion.div>
                            <label className="font-bold">
                              {t.numberOfRounds}
                            </label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                handleSettingChange(
                                  "numberOfRounds",
                                  Math.max(5, gameSettings.numberOfRounds - 1)
                                )
                              }
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-bold border border-red-400/30 transition-all"
                            >
                              -
                            </motion.button>
                            <motion.span
                              key={gameSettings.numberOfRounds}
                              initial={{ scale: 1.2, color: "#fbbf24" }}
                              animate={{ scale: 1, color: "#ffffff" }}
                              transition={{ duration: 0.3 }}
                              className="w-16 text-center font-bold text-lg"
                            >
                              {gameSettings.numberOfRounds}
                            </motion.span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                handleSettingChange(
                                  "numberOfRounds",
                                  Math.min(50, gameSettings.numberOfRounds + 1)
                                )
                              }
                              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg font-bold border border-green-400/30 transition-all"
                            >
                              +
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Enhanced Power Cards */}
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h4 className="font-bold mb-4 flex items-center space-x-3 text-lg">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <FaMagic className="text-pink-400" />
                        </motion.div>
                        <span>{t.allowedPowerCards}</span>
                        <motion.span
                          className="text-sm text-white/60 bg-white/10 px-3 py-1 rounded-full"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ({gameSettings.allowedCards.length}/{cardTypes.length}
                          )
                        </motion.span>
                      </h4>

                      <motion.div
                        variants={staggerChildren}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {cardTypes.map((card, index) => (
                          <PowerCardItem
                            key={card.id}
                            card={card}
                            isEnabled={gameSettings.allowedCards.includes(
                              card.id
                            )}
                            onToggle={toggleCard}
                            index={index}
                          />
                        ))}
                      </motion.div>
                    </motion.div>

                    {/* Enhanced Toggle Settings */}
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <motion.div
                              animate={
                                gameSettings.showCorrectAnswer
                                  ? {
                                      scale: [1, 1.2, 1],
                                      rotate: [0, 10, -10, 0],
                                    }
                                  : { scale: 1, rotate: 0 }
                              }
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <FaEye className="text-purple-400 text-lg" />
                            </motion.div>
                            <label className="font-bold">
                              {t.showCorrectAnswer}
                            </label>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              handleSettingChange(
                                "showCorrectAnswer",
                                !gameSettings.showCorrectAnswer
                              )
                            }
                            className={`w-16 h-8 rounded-full transition-all relative border-2 ${
                              gameSettings.showCorrectAnswer
                                ? "bg-green-500 border-green-400"
                                : "bg-gray-600 border-gray-500"
                            }`}
                          >
                            <motion.div
                              animate={{
                                x: gameSettings.showCorrectAnswer ? 32 : 4,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                              className="w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-lg"
                            />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
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
