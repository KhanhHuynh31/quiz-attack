"use client";

import React, { useCallback, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  FaSync,
  FaLock,
} from "react-icons/fa";

// Components
import { QRCodeModal } from "@/components/QrCodeModal";
import { ShareSection } from "@/components/lobby/ShareSection";
import GameSettingSelector from "@/components/Selector/GameSetingSelector";
import GameModeSelector from "@/components/Selector/GameModeSelector";
import QuizPackSelector from "@/components/Selector/QuizPackSelector";
import PlayerCard from "@/components/PlayerCard";
import { LanguageSelector } from "@/components/Selector/LanguageSelector";

// Hooks
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";
import { useI18n } from "@/hooks/useI18n";
import { loadPlayerData } from "@/hooks/useLocalStorage";

// Types and Data
import {
  GameConfig,
  GameMode,
  GameSettings,
  Player,
  PlayerData,
  QuizAttackLobbyProps,
  QuizPack,
  TabType,
} from "@/types/type";
import { lobbyTranslations } from "@/i18n/translations";
import { DEFAULT_GAME_SETTINGS, saveGameConfig } from "@/data/gameConfig";
import { DEFAULT_QUIZ_PACKS } from "@/data/quizData";
import { GAME_MODES } from "@/data/modeData";
import { supabase } from "@/lib/supabaseClient";

// Constants
const TABS = [
  { key: "mode" as const, icon: FaGamepad, labelKey: "gameMode" as const },
  { key: "packs" as const, icon: FaBook, labelKey: "quizPacks" as const },
  { key: "settings" as const, icon: FaCog, labelKey: "settings" as const },
] as const;

// Animation Variants
const animations = {
  header: {
    initial: { y: -80, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
  startButton: {
    initial: { y: 80, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.8, type: "spring" as const, stiffness: 100 },
  },
  tabContent: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { type: "spring" as const, stiffness: 300, damping: 30, duration: 0.2 },
  },
  playersExpand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.3, ease: "easeInOut" },
  },
} as const;

// Custom Hooks
const useRoomData = (initialRoomCode?: string) => {
  const [roomCode, setRoomCode] = useState<string>("");
  const [shareLink, setShareLink] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Get room code from router path
    const pathParts = window.location.pathname.split("/");
    const codeFromPath = pathParts[pathParts.length - 1];
    const code = initialRoomCode || codeFromPath || "QUIZ123";
    const link = `${window.location.origin}/join/${code}`;
    setRoomCode(code);
    setShareLink(link);
  }, [initialRoomCode, router]);

  return { roomCode, shareLink };
};

const useSupabaseRoom = (roomCode: string) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    ...DEFAULT_GAME_SETTINGS,
    selectedQuizPack: DEFAULT_QUIZ_PACKS[0],
  });
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(GAME_MODES[0] || null);

  const loadRoomData = useCallback(async () => {
    if (!roomCode) return;
    
    setIsLoading(true);
    try {
      let { data: room, error } = await supabase
        .from("room")
        .select("*")
        .eq("room_code", roomCode)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Failed to load room data:", error);
        return;
      }

      if (!room) {
        // Try to create new room, but handle potential race conditions
        try {
          const defaultSettingList = [JSON.stringify(DEFAULT_GAME_SETTINGS)];
          const defaultGameMode = GAME_MODES[0]?.id || 1;
          const defaultQuizPack = DEFAULT_QUIZ_PACKS[0].id;

          const { data: newRoom, error: insertError } = await supabase
            .from("room")
            .insert({
              room_code: roomCode,
              player_list: [],
              setting_list: defaultSettingList,
              game_mode: defaultGameMode,
              quiz_pack: defaultQuizPack,
            })
            .select()
            .single();

          if (insertError) {
            // If room was created by another instance, try to fetch it again
            if (insertError.code === "23505") { // Unique violation
              const { data: existingRoom } = await supabase
                .from("room")
                .select("*")
                .eq("room_code", roomCode)
                .single();
              room = existingRoom;
            } else {
              console.error("Failed to create room:", insertError);
              return;
            }
          } else {
            room = newRoom;
          }
        } catch (createError) {
          console.error("Error creating room:", createError);
          return;
        }
      }

      // Load data from room
      const loadedPlayers = room.player_list?.map((p: string) => JSON.parse(p)) || [];
      setPlayers(loadedPlayers);

      const parsedSettings = room.setting_list?.[0] 
        ? JSON.parse(room.setting_list[0]) 
        : DEFAULT_GAME_SETTINGS;
      
      const quizPackId = room.quiz_pack || DEFAULT_QUIZ_PACKS[0].id;
      const selectedQuizPack = DEFAULT_QUIZ_PACKS.find((pack: QuizPack) => pack.id === quizPackId) || DEFAULT_QUIZ_PACKS[0];
      
      setGameSettings({ ...parsedSettings, selectedQuizPack });

      const selectedMode = GAME_MODES.find((mode: GameMode) => mode.id === room.game_mode);
      setSelectedGameMode(selectedMode || GAME_MODES[0] || null);

    } catch (error) {
      console.error("Error loading room data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode]);

  const saveRoomData = useCallback(async (players: Player[], settings: GameSettings, gameMode: GameMode | null) => {
    try {
      const playerList = players.map((p) => JSON.stringify(p));
      const settingsToStore = { ...settings, selectedQuizPack: undefined };
      const settingList = [JSON.stringify(settingsToStore)];
      const gameModeId = gameMode?.id || 0;
      const quizPackId = settings.selectedQuizPack?.id || 0;

      // First check if room exists
      const { data: existingRoom } = await supabase
        .from("room")
        .select("room_code")
        .eq("room_code", roomCode)
        .single();

      if (existingRoom) {
        // Update existing room
        const { error } = await supabase
          .from("room")
          .update({
            player_list: playerList,
            setting_list: settingList,
            game_mode: gameModeId,
            quiz_pack: quizPackId,
          })
          .eq("room_code", roomCode);

        if (error) console.error("Failed to update room data:", error);
      } else {
        // Insert new room
        const { error } = await supabase.from("room").insert({
          room_code: roomCode,
          player_list: playerList,
          setting_list: settingList,
          game_mode: gameModeId,
          quiz_pack: quizPackId,
        });

        if (error) console.error("Failed to create room:", error);
      }
    } catch (error) {
      console.error("Error saving to Supabase:", error);
    }
  }, [roomCode]);

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  return {
    players,
    setPlayers,
    isLoading,
    gameSettings,
    setGameSettings,
    selectedGameMode,
    setSelectedGameMode,
    saveRoomData,
  };
};

// Main Component
const QuizAttackLobbyEnhanced: React.FC<QuizAttackLobbyProps> = ({ initialRoomCode }) => {
  // Hooks
  const { language } = useI18n();
  const { staggerChildren, slideInLeft, slideInRight, fadeUp } = useEnhancedAnimations();
  const { roomCode, shareLink } = useRoomData(initialRoomCode);
  const router = useRouter();

  const {
    players,
    setPlayers,
    isLoading,
    gameSettings,
    setGameSettings,
    selectedGameMode,
    setSelectedGameMode,
    saveRoomData,
  } = useSupabaseRoom(roomCode);

  // Player data and permissions
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const isHost = useMemo(() => playerData?.player.isHost ?? false, [playerData]);

  // UI State
  const [showQRCode, setShowQRCode] = useState(false);
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("mode");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [showPlayersOnMobile, setShowPlayersOnMobile] = useState(false);

  // Translations
  const t = useMemo(
    () => lobbyTranslations[language as keyof typeof lobbyTranslations] || lobbyTranslations.en,
    [language]
  );

  // Computed values
  const playerCount = players.length;
  const maxPlayersText = gameSettings.maxPlayers?.toString() || "∞";
  const maskedRoomCode = showRoomCode ? roomCode : "••••••";
  const canStartGame = isHost && !isLoading && playerCount >= 1;

  // Load player data
  useEffect(() => {
    setPlayerData(loadPlayerData());
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileDropdownOpen(false);
        setShowPlayersOnMobile(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Event Handlers
  const handleSettingChange = useCallback(
    <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
      if (!isHost) return;
      setGameSettings((prev) => ({ ...prev, [key]: value }));
    },
    [isHost, setGameSettings]
  );

  const handleKickPlayer = useCallback(
    (playerId: number) => {
      if (!isHost) return;
      setPlayers((prev) => prev.filter((player) => player.id !== playerId));
    },
    [isHost, setPlayers]
  );

  const handleStartGame = useCallback(async () => {
    if (!canStartGame) return;

    await saveRoomData(players, gameSettings, selectedGameMode);
    
    const gameConfig: GameConfig = {
      gameSettings,
      selectedGameMode,
      players,
      roomCode,
    };

    saveGameConfig(roomCode, gameConfig);
    router.push(`/play/${roomCode}`);
  }, [canStartGame, players, gameSettings, selectedGameMode, roomCode, router, saveRoomData]);

  const handleMaxPlayersChange = useCallback(
    (increment: boolean) => {
      if (!isHost) return;
      setGameSettings((prev) => {
        const current = prev.maxPlayers || 8;
        const newValue = increment ? Math.min(20, current + 1) : Math.max(2, current - 1);
        return { ...prev, maxPlayers: newValue };
      });
    },
    [isHost, setGameSettings]
  );

  const handleToggleMaxPlayersLimit = useCallback(() => {
    if (!isHost) return;
    handleSettingChange("maxPlayers", gameSettings.maxPlayers === null ? 8 : null);
  }, [gameSettings.maxPlayers, handleSettingChange, isHost]);

  const handleTabChange = useCallback((newTab: TabType) => {
    if (newTab === activeTab) return;
    setIsTabChanging(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTabChanging(false);
    }, 50);
  }, [activeTab]);

  // Render Functions
  const renderMaxPlayersControls = () => {
    if (!isHost) return null;

    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-6 p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/10"
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
  };

  const renderTabs = () => (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="flex flex-col-reverse gap-5 lg:flex-row mb-6 justify-between"
    >
      {/* Mobile Dropdown */}
      <div className="block lg:hidden relative w-full">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
          className="flex items-center justify-between w-full p-4 bg-white/15 rounded-xl border border-white/20"
        >
          <div className="flex items-center space-x-3">
            {(() => {
              const IconComponent = TABS.find((tab) => tab.key === activeTab)?.icon || FaCog;
              return <IconComponent />;
            })()}
            <span className="font-medium">
              {t[TABS.find((tab) => tab.key === activeTab)?.labelKey || "settings"]}
            </span>
            {!isHost && <FaLock className="text-red-400 text-sm ml-2" />}
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
                    <span className="text-sm font-medium">{t[tab.labelKey]}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden lg:flex space-x-3">
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
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-bold transition-all border relative ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400/50 shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/20 border-white/20"
              }`}
            >
              <motion.div
                animate={isActive ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                <IconComponent />
              </motion.div>
              <span>{t[tab.labelKey]}</span>
              {!isHost && (
                <FaLock className="text-red-400 text-sm absolute -top-1 -right-1 bg-gray-800 rounded-full p-1 w-4 h-4" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Start Game Button */}
      <motion.div {...animations.startButton} className="flex-shrink-0 w-full lg:w-auto">
        <motion.button
          whileHover={canStartGame ? { scale: 1.02, y: -3, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.3)" } : {}}
          whileTap={canStartGame ? { scale: 0.95 } : {}}
          onClick={handleStartGame}
          disabled={!canStartGame}
          className={`relative flex items-center justify-center space-x-4 px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl transition-all overflow-hidden border w-full lg:w-auto ${
            !canStartGame
              ? "bg-gray-500/50 text-gray-300 border-gray-400/30 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 border-green-400/50"
          }`}
        >
          {/* Animated background effect */}
          {canStartGame && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}

          <div className="relative z-10 flex items-center space-x-4">
            {!isHost ? (
              <FaLock className="text-2xl" />
            ) : isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FaSync className="text-2xl" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ x: [0, 5, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <FaPlay className="text-2xl" />
              </motion.div>
            )}
            <span>
              {!isHost
                ? "Only Host Can Start"
                : isLoading
                ? t.loading
                : playerCount < 1
                ? t.needPlayers
                : t.startGame}
            </span>
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );

  const renderTabContent = () => {
    if (isTabChanging) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FaCog className="text-2xl text-white/50" />
          </motion.div>
        </div>
      );
    }

    const tabConfigs = {
      mode: {
        title: t.chooseGameMode,
        icon: FaGamepad,
        iconColor: "text-orange-400",
        component: (
          <GameModeSelector
            selectedMode={selectedGameMode}
            onModeSelect={isHost ? setSelectedGameMode : () => {}}
          />
        ),
      },
      packs: {
        title: t.quizPacks,
        icon: FaBook,
        iconColor: "text-purple-400",
        component: (
          <QuizPackSelector
            selectedPack={gameSettings.selectedQuizPack}
            onPackSelect={
              isHost
                ? (pack: QuizPack | null) => handleSettingChange("selectedQuizPack", pack)
                : () => {}
            }
          />
        ),
      },
      settings: {
        title: t.settings,
        icon: FaCog,
        iconColor: "text-gray-400",
        component: (
          <GameSettingSelector
            settings={gameSettings}
            onSettingChange={isHost ? handleSettingChange : () => {}}
          />
        ),
      },
    };

    const config = tabConfigs[activeTab];
    const IconComponent = config.icon;

    return (
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`tab-${activeTab}`}
            {...animations.tabContent}
            className="h-full overflow-y-auto space-y-6 p-3"
          >
            <motion.h3
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-bold mb-6 flex items-center space-x-3"
            >
              {activeTab === "settings" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <IconComponent className={config.iconColor} />
                </motion.div>
              ) : (
                <IconComponent className={config.iconColor} />
              )}
              <span>{config.title}</span>
              {!isHost && <FaLock className="text-red-400 text-lg" />}
            </motion.h3>

            <div className={!isHost ? "pointer-events-none opacity-60" : ""}>
              {config.component}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const renderPlayersList = () => (
    <motion.section
      variants={slideInLeft}
      initial="hidden"
      animate="visible"
      className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col h-full border border-white/20 shadow-xl ${
        showPlayersOnMobile ? "block" : "hidden lg:block"
      }`}
    >
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FaUsers className="text-2xl text-blue-400" />
          </motion.div>
          <h2 className="text-xl font-bold">
            {t.players} ({playerCount}/{maxPlayersText})
          </h2>
        </div>
        <button
          className="lg:hidden text-white/70 hover:text-white"
          onClick={() => setShowPlayersOnMobile(false)}
        >
          <FaChevronLeft />
        </button>
      </motion.div>

      {renderMaxPlayersControls()}

      <motion.div
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col overflow-y-auto space-y-4 min-h-0 pr-2"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="text-2xl text-white/50"
            >
              <FaSync />
            </motion.div>
          </div>
        ) : players.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/50">
            <div className="text-center">
              <FaUsers className="text-4xl mb-4 mx-auto" />
              <p>No players yet</p>
              <p className="text-sm">Share the room code to invite players</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {players.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                onKick={isHost ? handleKickPlayer : undefined}
                index={index}
                showKickButton={isHost}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.section>
  );

  return (
    <div className="min-h-screen text-white flex flex-col lg:max-h-screen lg:overflow-hidden">
      {/* Header */}
      <motion.header
        {...animations.header}
        className="flex items-center justify-between p-6 h-24 flex-shrink-0 relative z-10"
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-3 bg-white/10 backdrop-blur-lg px-6 py-3 rounded-xl hover:bg-white/20 transition-all border border-white/20 shadow-lg"
        >
          <Link href="/" className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <FaHome className="text-xl text-blue-400" />
            </motion.div>
            <span className="font-medium">{t.home}</span>
          </Link>
        </motion.button>

        <motion.div
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <motion.h1
            className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 200%" }}
          >
            Quiz Attack
          </motion.h1>
          <div className="flex items-center justify-center space-x-3 mt-2">
            <span className="text-sm text-white/70 font-medium">{t.room}:</span>
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-lg">
              <span className="text-sm font-mono font-bold">{maskedRoomCode}</span>
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
        <LanguageSelector />
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-6 overflow-y-auto lg:overflow-hidden flex flex-col">
        {/* Mobile Toggle Players Button */}
        <AnimatePresence>
          {!showPlayersOnMobile && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="block lg:hidden mb-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPlayersOnMobile(true)}
                className="flex items-center justify-between w-full p-4 bg-white/15 rounded-xl border border-white/20"
              >
                <div className="flex items-center space-x-3">
                  <FaUsers className="text-blue-400" />
                  <span className="font-medium">
                    {t.players} ({playerCount}/{maxPlayersText})
                  </span>
                </div>
                <FaChevronUp />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full max-w-8xl mx-auto w-full flex-1 min-h-0 lg:overflow-hidden">
          {/* Players List - Mobile Expandable / Desktop Left Panel */}
          <AnimatePresence>
            {showPlayersOnMobile && (
              <motion.div
                {...animations.playersExpand}
                className="block lg:hidden order-first"
              >
                {renderPlayersList()}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Desktop Players List */}
          <div className="hidden lg:block">
            {renderPlayersList()}
          </div>

          {/* Game Configuration - Right Panel */}
          <motion.section
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex flex-col h-full overflow-hidden border border-white/20 shadow-xl"
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