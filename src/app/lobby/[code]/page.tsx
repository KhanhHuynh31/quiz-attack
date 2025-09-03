"use client";

import React, { useCallback, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome,
  FaUsers,
  FaCog,
  FaPlay,
  FaGamepad,
  FaEye,
  FaEyeSlash,
  FaBook,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
} from "react-icons/fa";

// Import components
import { QRCodeModal } from "@/components/QrCodeModal";

import { ShareSection } from "@/components/lobby/ShareSection";

// Import hooks
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";
import { useI18n } from "@/hooks/useI18n";

// Import types and translations
import { GameConfig, GameSettings, Player, QuizPack } from "@/types/type";
import { lobbyTranslations } from "@/i18n/translations";
import GameSettingSelector from "@/components/Selector/GameSetingSelector";
import { useRouter } from "next/navigation";
import { DEFAULT_GAME_SETTINGS, saveGameConfig } from "@/data/gameConfig";
import GameModeSelector from "@/components/Selector/GameModeSelector";
import QuizPackSelector from "@/components/Selector/QuizPackSelector";
import PlayerCard from "@/components/PlayerCard";
import { DEFAULT_QUIZ_PACKS } from "@/data/quizData";

// Import the default quiz packs

// Types
type TabType = "mode" | "settings" | "packs";

interface QuizAttackLobbyProps {
  initialRoomCode?: string;
  initialPlayers?: Player[];
}

// Constants
const DEFAULT_PLAYERS: Player[] = [
  {
    id: 1,
    name: "Host Player",
    avatar: "👑",
    isHost: true,
    isReady: true,
    score: 0,
    cards: 0,
  },
  {
    id: 2,
    name: "Player 2",
    avatar: "😊",
    isHost: false,
    isReady: true,
    score: 0,
    cards: 0,
  },
  {
    id: 3,
    name: "Player 3",
    avatar: "🔥",
    isHost: false,
    isReady: false,
    score: 0,
    cards: 0,
  },
  {
    id: 4,
    name: "Player 4",
    avatar: "⚡",
    isHost: false,
    isReady: true,
    score: 0,
    cards: 0,
  },
] as const;

const TABS = [
  { key: "mode" as const, icon: FaGamepad, labelKey: "gameMode" as const },
  { key: "packs" as const, icon: FaBook, labelKey: "quizPacks" as const },
  { key: "settings" as const, icon: FaCog, labelKey: "settings" as const },
] as const;

// Animation variants
const animationVariants = {
  header: {
    initial: { y: -80, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
  shareSection: {
    initial: { y: -30, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.6, type: "spring" as const, stiffness: 150 },
  },
  startButton: {
    initial: { y: 80, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.8, type: "spring" as const, stiffness: 100 },
  },
  maxPlayersSection: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.5 },
  },
  tabContent: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      duration: 0.2,
    },
  },
} as const;

// Utility functions
const generateRoomCode = (): string => {
  if (typeof window === "undefined") return "QUIZ123";

  try {
    const pathParts = window.location.pathname.split("/");
    return pathParts[pathParts.length - 1] || "QUIZ123";
  } catch {
    return "QUIZ123";
  }
};

const generateShareLink = (roomCode: string): string => {
  if (typeof window === "undefined") return "";

  try {
    return `${window.location.origin}/join/${roomCode}`;
  } catch {
    return "";
  }
};

// Custom hooks
const useRoomData = (initialRoomCode?: string) => {
  const [roomCode, setRoomCode] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>("");

  useEffect(() => {
    const code = initialRoomCode || generateRoomCode();
    const link = generateShareLink(code);

    setRoomCode(code);
    setShareLink(link);
  }, [initialRoomCode]);

  return { roomCode, shareLink };
};

// Main Component
const QuizAttackLobbyEnhanced: React.FC<QuizAttackLobbyProps> = ({
  initialRoomCode,
  initialPlayers = DEFAULT_PLAYERS,
}) => {
  // Hooks
  const { language } = useI18n();
  const { staggerChildren, slideInLeft, slideInRight, fadeUp } =
    useEnhancedAnimations();
  const { roomCode, shareLink } = useRoomData(initialRoomCode);

  // Translations
  const t = useMemo(
    () =>
      lobbyTranslations[language as keyof typeof lobbyTranslations] ||
      lobbyTranslations.en,
    [language]
  );

  // State
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    ...DEFAULT_GAME_SETTINGS,
    selectedQuizPack: DEFAULT_QUIZ_PACKS[0] // Set first quiz pack as default
  });
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [showRoomCode, setShowRoomCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("mode");
  const [selectedGameMode, setSelectedGameMode] = useState<string>("classic");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [showPlayersOnMobile, setShowPlayersOnMobile] = useState(false);

  // Router
  const router = useRouter();

  // Effect to handle window resize and close dropdown on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileDropdownOpen(false);
        setShowPlayersOnMobile(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Computed values
  const playerCount = players.length;
  const maxPlayersText = gameSettings.maxPlayers?.toString() || "∞";
  const maskedRoomCode = showRoomCode ? roomCode : "••••••";

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

  const handleKickPlayer = useCallback((playerId: number) => {
    setPlayers((prev) => prev.filter((player) => player.id !== playerId));
  }, []);

  const handleStartGame = useCallback(() => {
    const gameConfig: GameConfig = {
      gameSettings,
      selectedGameMode,
      players,
      roomCode,
    };

    // Save configuration using the game config module
    saveGameConfig(roomCode, gameConfig);

    // Navigate to play page
    router.push(`/play/${roomCode}`);
  }, [gameSettings, selectedGameMode, players, roomCode, router]);

  const handleToggleRoomCodeVisibility = useCallback(() => {
    setShowRoomCode((prev) => !prev);
  }, []);

  const handleMaxPlayersChange = useCallback((increment: boolean) => {
    setGameSettings((prev) => {
      const current = prev.maxPlayers || 8;
      const newValue = increment
        ? Math.min(20, current + 1)
        : Math.max(2, current - 1);

      return {
        ...prev,
        maxPlayers: newValue,
      };
    });
  }, []);

  const handleToggleMaxPlayersLimit = useCallback(() => {
    handleSettingChange(
      "maxPlayers",
      gameSettings.maxPlayers === null ? 8 : null
    );
  }, [gameSettings.maxPlayers, handleSettingChange]);

  // Handle tab change with proper state management
  const handleTabChange = useCallback(
    (newTab: TabType) => {
      if (newTab === activeTab) return;

      setIsTabChanging(true);

      // Use a small delay to ensure proper state transition
      setTimeout(() => {
        setActiveTab(newTab);
        setIsTabChanging(false);
      }, 50);
    },
    [activeTab]
  );

  // Toggle players list on mobile
  const togglePlayersOnMobile = useCallback(() => {
    setShowPlayersOnMobile((prev) => !prev);
  }, []);

  // Render helpers
  const renderMaxPlayersControls = () => (
    <motion.div
      {...animationVariants.maxPlayersSection}
      className="mb-6 p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl flex-shrink-0 border border-white/10"
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold flex items-center space-x-2">
          <FaUsers className="text-cyan-400" />
          <span>{t.maxPlayers}</span>
        </label>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleMaxPlayersLimit}
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
                  onClick={() => handleMaxPlayersChange(false)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-bold transition-all border border-red-400/30"
                  aria-label="Decrease max players"
                >
                  -
                </motion.button>
                <span className="w-8 text-center text-lg font-bold">
                  {gameSettings.maxPlayers}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleMaxPlayersChange(true)}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg text-sm font-bold transition-all border border-green-400/30"
                  aria-label="Increase max players"
                >
                  +
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  const renderTabs = () => (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="flex flex-col-reverse gap-5 md:flex-row space-y-4 md:space-y-0 md:space-x-3 mb-6 flex-shrink-0 justify-between flex-wrap"
    >
      {/* Mobile Dropdown */}
      <div className="block md:hidden relative w-full">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
          className="flex items-center justify-between w-full p-4 bg-white/15 rounded-xl border border-white/20"
        >
          <div className="flex items-center space-x-3">
            {(() => {
              const IconComponent =
                TABS.find((tab) => tab.key === activeTab)?.icon || FaCog;
              return <IconComponent />;
            })()}
            <span className="font-medium">
              {
                t[
                  TABS.find((tab) => tab.key === activeTab)?.labelKey ||
                    "settings"
                ]
              }
            </span>
          </div>
          <motion.div
            animate={{ rotate: isMobileDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FaChevronDown />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isMobileDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-lg rounded-xl border border-white/20 z-50 overflow-hidden"
            >
              {TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <motion.button
                    key={tab.key}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleTabChange(tab.key);
                      setIsMobileDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-3 w-full p-4 text-left ${
                      isActive ? "bg-blue-500/20" : ""
                    }`}
                  >
                    <IconComponent />
                    <span className="text-sm font-medium">
                      {t[tab.labelKey]}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden ps-1 md:flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 overflow-x-auto pr-2">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <motion.button
              key={tab.key}
              variants={fadeUp}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center space-x-3 px-4 py-3 md:px-6 m-2 md:py-3 rounded-xl font-bold transition-all border ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400/50 shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/20 border-white/20"
              }`}
              aria-pressed={isActive}
            >
              <motion.div
                animate={isActive ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <IconComponent />
              </motion.div>
              <span className="text-sm md:text-base">{t[tab.labelKey]}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Start Game Button */}
      <motion.div
        {...animationVariants.startButton}
        className="flex items-center justify-center flex-shrink-0 mt-4 md:mt-0 w-full md:w-auto"
      >
        <motion.button
          whileHover={{
            scale: 1.02,
            y: -3,
            boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartGame}
          className="relative flex items-center space-x-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 px-8 py-4 md:px-16 md:py-5 rounded-2xl font-bold text-lg md:text-xl shadow-2xl transition-all overflow-hidden border border-green-400/50 w-full md:w-auto"
          aria-label="Start game"
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

          <div className="relative z-10 flex items-center space-x-2 md:space-x-4 justify-center">
            <motion.div
              animate={{ x: [0, 5, -5, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <FaPlay className="text-xl md:text-2xl" />
            </motion.div>
            <span>{t.startGame}</span>
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );

  // Render tab content with proper key management
  const renderTabContent = () => {
    // Don't render content during tab transition
    if (isTabChanging) {
      return (
        <div className="flex-1 overflow-hidden min-h-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FaCog className="text-2xl text-white/50" />
          </motion.div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`tab-${activeTab}`} // Unique key for each tab
            {...animationVariants.tabContent}
            className="h-full overflow-y-auto space-y-6 p-3"
          >
            {activeTab === "mode" && (
              <>
                <motion.h3
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center space-x-3"
                >
                  <FaGamepad className="text-orange-400" />
                  <span>{t.chooseGameMode}</span>
                </motion.h3>

                <GameModeSelector
                  selectedMode={selectedGameMode}
                  onModeSelect={setSelectedGameMode}
                />
              </>
            )}

            {activeTab === "packs" && (
              <>
                <motion.h3
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center space-x-3"
                >
                  <FaBook className="text-purple-400" />
                  <span>{t.quizPacks}</span>
                </motion.h3>

                <QuizPackSelector
                  selectedPack={gameSettings.selectedQuizPack}
                  onPackSelect={(pack: QuizPack | null) =>
                    handleSettingChange("selectedQuizPack", pack)
                  }
                />
              </>
            )}

            {activeTab === "settings" && (
              <>
                <motion.h3
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center space-x-3"
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
                  <span>{t.settings}</span>
                </motion.h3>

                {/* Settings content would go here */}
                <GameSettingSelector
                  settings={gameSettings}
                  onSettingChange={handleSettingChange}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white flex flex-col md:max-h-screen md:overflow-hidden">
      {/* Header */}
      <motion.header
        {...animationVariants.header}
        className="flex items-center justify-between p-4 md:p-6 h-24 flex-shrink-0 relative z-10"
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-3 bg-white/10 backdrop-blur-lg px-4 py-3 md:px-6 md:py-3 rounded-xl hover:bg-white/20 transition-all border border-white/20 shadow-lg"
          aria-label="Go home"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <FaHome className="text-xl text-blue-400" />
          </motion.div>
          <span className="font-medium text-sm md:text-base">{t.home}</span>
        </motion.button>

        <motion.div
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <motion.h1
            className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 200%" }}
          >
            Quiz Attack
          </motion.h1>
          <div className="flex items-center justify-center space-x-2 md:space-x-3 mt-2">
            <span className="text-xs md:text-sm text-white/70 font-medium">
              {t.room}:
            </span>
            <div className="flex items-center space-x-2 bg-white/10 px-2 py-1 md:px-3 md:py-1 rounded-lg">
              <span className="text-xs md:text-sm font-mono font-bold">
                {maskedRoomCode}
              </span>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={handleToggleRoomCodeVisibility}
                className="text-white/70 hover:text-white transition-colors"
                aria-label={showRoomCode ? "Hide room code" : "Show room code"}
              >
                {showRoomCode ? <FaEyeSlash /> : <FaEye />}
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="w-8 md:w-10" role="presentation" />
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-6 pb-6 overflow-y-auto md:overflow-hidden flex flex-col">
        {/* Mobile Toggle Players Button */}
        <div className="block md:hidden mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={togglePlayersOnMobile}
            className={`flex items-center justify-center w-full p-3 bg-white/15 rounded-xl border border-white/20 ${
              showPlayersOnMobile ? "hidden" : "flex"
            }`}
          >
            <div className="flex items-center space-x-3">
              <FaUsers className="text-blue-400" />
              <span className="font-medium">
                {playerCount}/{maxPlayersText}
              </span>
            </div>
            <motion.div
              animate={{ rotate: showPlayersOnMobile ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="ml-2"
            >
              <FaChevronUp />
            </motion.div>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-full max-w-8xl mx-auto w-full flex-1 min-h-0 md:overflow-hidden">
          {/* Players List - Left */}
          <motion.section
            variants={slideInLeft}
            initial="hidden"
            animate="visible"
            className={`bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 flex flex-col h-full overflow-hidden border border-white/20 shadow-xl ${
              showPlayersOnMobile ? "block" : "hidden md:block"
            }`}
            aria-label="Players list"
          >
            <motion.div
              className="flex items-center justify-between mb-4 md:mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center space-x-2 md:space-x-3">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaUsers className="text-xl md:text-2xl text-blue-400" />
                </motion.div>
                <h2 className="text-lg md:text-xl font-bold">
                  {t.players} ({playerCount}/{maxPlayersText})
                </h2>
              </div>
              <button
                className="md:hidden text-white/70 hover:text-white"
                onClick={togglePlayersOnMobile}
                aria-label={t.players}
              >
                <FaChevronLeft />
              </button>
            </motion.div>

            {renderMaxPlayersControls()}

            {/* Players List with Scroll */}
            <motion.div
              variants={staggerChildren}
              initial="hidden"
              animate="visible"
              className="flex-1 flex flex-col overflow-y-auto space-y-4 min-h-0 pr-2"
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
                    onKick={handleKickPlayer}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.section>

          {/* Game Mode & Settings - Right */}
          <motion.section
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            className={`lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 flex flex-col h-full overflow-hidden border border-white/20 shadow-xl ${
              showPlayersOnMobile ? "hidden md:flex" : "flex"
            }`}
            aria-label="Game configuration"
          >
            <ShareSection
              shareLink={shareLink}
              roomCode={roomCode}
              onShowQRCode={() => setShowQRCode(true)}
              translations={{
                copy: t.copyLink,
                share: t.shareRoom,
                qrCode: t.showQrCode,
              }}
            />
            {renderTabs()}
            {renderTabContent()}
          </motion.section>
        </div>
      </main>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        shareLink={shareLink}
      />
    </div>
  );
};

export default QuizAttackLobbyEnhanced;