"use client";

import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  GameMode,
  GameSettings,
  Player,
  PlayerData,
  QuizAttackLobbyProps,
  QuizPack,
  TabType,
} from "@/types/type";
import { lobbyTranslations } from "@/i18n/translations";
import { DEFAULT_GAME_SETTINGS } from "@/data/gameConfig";
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
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      duration: 0.2,
    },
  },
  playersExpand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.3, ease: "easeInOut" },
  },
} as const;

// Utility Functions
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

// Custom Hooks
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

type PlayerPresence = Player & { presence_ref: string };

const useSupabaseRoom = (
  roomCode: string,
  playerData: PlayerData | null,
  isVerified: boolean
) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    ...DEFAULT_GAME_SETTINGS,
    selectedQuizPack: DEFAULT_QUIZ_PACKS[0],
  });
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(
    GAME_MODES[0] || null
  );
  const [roomClosed, setRoomClosed] = useState(false);
  const [roomPassword, setRoomPassword] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        if (!playerData?.player.isHost) {
          setRoomClosed(true);
          setIsLoading(false);
          return;
        }
        // Create new room
        const defaultSettingList = [JSON.stringify(DEFAULT_GAME_SETTINGS)];
        const defaultGameMode = GAME_MODES[0]?.id || 1;
        const defaultQuizPack = DEFAULT_QUIZ_PACKS[0].id;

        const { data: newRoom, error: insertError } = await supabase
          .from("room")
          .insert({
            room_code: roomCode,
            setting_list: defaultSettingList,
            game_mode: defaultGameMode,
            quiz_pack: defaultQuizPack,
            room_password: null,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Failed to create room:", insertError);
          return;
        }
        room = newRoom;
      }

      // Load data from room
      const parsedSettings = room.setting_list?.[0]
        ? JSON.parse(room.setting_list[0])
        : DEFAULT_GAME_SETTINGS;

      const quizPackId = room.quiz_pack || DEFAULT_QUIZ_PACKS[0].id;
      const selectedQuizPack =
        DEFAULT_QUIZ_PACKS.find((pack: QuizPack) => pack.id === quizPackId) ||
        DEFAULT_QUIZ_PACKS[0];

      setGameSettings({ ...parsedSettings, selectedQuizPack });

      const selectedMode = GAME_MODES.find(
        (mode: GameMode) => mode.id === room.game_mode
      );
      setSelectedGameMode(selectedMode || GAME_MODES[0] || null);

      setRoomPassword(room.room_password || null);
    } catch (error) {
      console.error("Error loading room data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, playerData]);

  const saveRoomData = useCallback(
    async (settings: GameSettings, gameMode: GameMode | null) => {
      try {
        const settingsToStore = { ...settings };
        settingsToStore.selectedQuizPack = null;

        const settingList = [JSON.stringify(settingsToStore)];
        const gameModeId = gameMode?.id || 0;
        const quizPackId = settings.selectedQuizPack?.id || 0;

        const { error } = await supabase
          .from("room")
          .update({
            setting_list: settingList,
            game_mode: gameModeId,
            quiz_pack: quizPackId,
            room_password: roomPassword,
          })
          .eq("room_code", roomCode);

        if (error) {
          console.error("Error saving room data:", error);
        }
      } catch (error) {
        console.error("Error saving to Supabase:", error);
      }
    },
    [roomCode, roomPassword]
  );

  // Debounced save function for real-time updates
  const debouncedSaveRoomData = useCallback(
    (settings: GameSettings, gameMode: GameMode | null) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveRoomData(settings, gameMode);
      }, 500);
    },
    [saveRoomData]
  );

  useEffect(() => {
    loadRoomData();
  }, [loadRoomData]);

  // Handle realtime presence for players - only if verified
  useEffect(() => {
    if (!roomCode || !playerData?.player?.id || !isVerified) return;

    const channel = supabase.channel(`room:${roomCode}`);

    const updatePlayers = () => {
      const state = channel.presenceState();
      const playerMap = new Map<number, Player>();
      for (const key in state) {
        const presences = state[key] as PlayerPresence[];
        if (presences[0]) {
          const { presence_ref, ...player } = presences[0];
          playerMap.set(player.id, player);
        }
      }
      setPlayers(Array.from(playerMap.values()));
    };

    channel
      .on("presence", { event: "sync" }, updatePlayers)
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const { presence_ref, ...newPlayer } =
          newPresences[0] as PlayerPresence;
        setPlayers((prev) => {
          if (prev.some((p) => p.id === newPlayer.id)) return prev;
          return [...prev, newPlayer];
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const { presence_ref, ...leftPlayer } =
          leftPresences[0] as PlayerPresence;
        setPlayers((prev) => prev.filter((p) => p.id !== leftPlayer.id));
        if (leftPlayer.isHost) {
          supabase.from("room").delete().eq("room_code", roomCode);
          setRoomClosed(true);
        }
      })
      // Listen for settings updates
      .on("broadcast", { event: "settings_update" }, ({ payload }) => {
        if (payload.roomCode === roomCode && !playerData.player.isHost) {
          setGameSettings(payload.settings);
          setSelectedGameMode(payload.gameMode);
        }
      })
      // Add listener for game start event
      .on("broadcast", { event: "game_start" }, async ({ payload }) => {
        if (payload.roomCode === roomCode && !playerData.player.isHost) {
          // Navigate to game page
          window.location.href = `/play/${roomCode}`;
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(playerData.player);
        }
      });

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      channel.unsubscribe();
    };
  }, [roomCode, playerData, setPlayers, isVerified]);

  return {
    players,
    setPlayers,
    isLoading,
    gameSettings,
    setGameSettings,
    selectedGameMode,
    setSelectedGameMode,
    saveRoomData,
    debouncedSaveRoomData,
    roomClosed,
    roomPassword,
    setRoomPassword,
  };
};

// Main Component
const QuizAttackLobbyEnhanced: React.FC<QuizAttackLobbyProps> = ({
  initialRoomCode,
}) => {
  // Hooks
  const { language } = useI18n();
  const { staggerChildren, slideInLeft, slideInRight, fadeUp } =
    useEnhancedAnimations();
  const { roomCode, shareLink } = useRoomData(initialRoomCode);
  const router = useRouter();

  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [shouldRedirectToJoin, setShouldRedirectToJoin] = useState(false);
  const [passwordValidated, setPasswordValidated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Determine if player is verified (has valid data and password if required)
  const isPlayerVerified = useMemo(() => {
    return (
      dataLoaded &&
      playerData &&
      playerData.player.nickname &&
      playerData.player.avatar &&
      passwordValidated
    );
  }, [dataLoaded, playerData, passwordValidated]);

  const {
    players,
    setPlayers,
    isLoading,
    gameSettings,
    setGameSettings,
    selectedGameMode,
    setSelectedGameMode,
    saveRoomData,
    debouncedSaveRoomData,
    roomClosed,
    roomPassword,
  } = useSupabaseRoom(roomCode, playerData, Boolean(isPlayerVerified));

  // Check if stored password matches room password
  const checkPasswordValidity = useCallback(
    (currentRoomPassword: string | null): boolean => {
      if (!currentRoomPassword) return true; // No password required

      const storedRoomSettings = playerData?.roomSettings;
      return !!(
        storedRoomSettings &&
        storedRoomSettings.roomCode === roomCode &&
        storedRoomSettings.password === currentRoomPassword
      );
    },
    [playerData, roomCode]
  );

  // Player data and permissions
  const isHost = useMemo(
    () => playerData?.player.isHost ?? false,
    [playerData]
  );

  // UI State
  const [showQRCode, setShowQRCode] = useState(false);
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [showRoomPass, setShowRoomPass] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>("mode");
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isTabChanging, setIsTabChanging] = useState(false);
  const [showPlayersOnMobile, setShowPlayersOnMobile] = useState(false);

  // Translations
  const t = useMemo(
    () =>
      lobbyTranslations[language as keyof typeof lobbyTranslations] ||
      lobbyTranslations.en,
    [language]
  );

  // Computed values
  const playerCount = players.length;
  const maskedRoomCode = showRoomCode ? roomCode : "••••••";
  const maskedRoomPass = showRoomPass ? roomPassword : "••••••";

  const canStartGame = isHost && !isLoading && isPlayerVerified;

  // Kiểm tra xem có phải là Quiz Mode (mode 2) không
  const isQuizMode = useMemo(() => {
    return selectedGameMode?.id === 2;
  }, [selectedGameMode]);

  // Load player data and check if redirect is needed
  useEffect(() => {
    const data = loadPlayerData();
    setPlayerData(data);

    if (!data || !data.player.nickname || !data.player.avatar) {
      setShouldRedirectToJoin(true);
    }

    setDataLoaded(true);
  }, []);

  // Check if player needs to be redirected to join page
  useEffect(() => {
    if (!dataLoaded || isLoading) return;

    if (shouldRedirectToJoin) {
      router.push(`/join/${roomCode}`);
      return;
    }

    // Check password if room has one and player data is loaded
    if (roomPassword) {
      const isValid = checkPasswordValidity(roomPassword);
      setPasswordValidated(isValid);

      if (!isValid) {
        router.push(`/join/${roomCode}`);
      }
    } else {
      setPasswordValidated(true);
    }
  }, [
    dataLoaded,
    isLoading,
    shouldRedirectToJoin,
    roomPassword,
    roomPassword,
    router,
  ]);

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

  // Update settings in database when changed by host
  useEffect(() => {
    if (isHost && dataLoaded && isPlayerVerified) {
      debouncedSaveRoomData(gameSettings, selectedGameMode);

      // Broadcast settings to other players
      const channel = supabase.channel(`room:${roomCode}`);
      channel.send({
        type: "broadcast",
        event: "settings_update",
        payload: {
          roomCode,
          settings: gameSettings,
          gameMode: selectedGameMode,
        },
      });
    }
  }, [
    gameSettings,
    selectedGameMode,
    isHost,
    roomCode,
    debouncedSaveRoomData,
    dataLoaded,
    isPlayerVerified,
  ]);

  // Event Handlers
  const handleSettingChange = useCallback(
    <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
      if (!isHost) return;
      setGameSettings((prev) => ({ ...prev, [key]: value }));
    },
    [isHost, setGameSettings]
  );

  const handleGameModeChange = useCallback(
    (mode: GameMode | null) => {
      if (!isHost) return;
      setSelectedGameMode(mode);
    },
    [isHost]
  );

  const handleQuizPackChange = useCallback(
    (pack: QuizPack | null) => {
      if (!isHost) return;
      setGameSettings((prev) => ({ ...prev, selectedQuizPack: pack }));
    },
    [isHost]
  );

  const handleKickPlayer = useCallback(
    async (playerId: number) => {
      if (!isHost) return;

      try {
        // Send a kick notification to the player's personal channel
        const channel = supabase.channel(`player:${playerId}`);
        await channel.send({
          type: "broadcast",
          event: "kicked",
          payload: { roomCode },
        });

        // Remove player from local state
        setPlayers((prev) => prev.filter((player) => player.id !== playerId));
      } catch (error) {
        console.error("Error kicking player:", error);
      }
    },
    [isHost, roomCode, setPlayers]
  );

  // Add useEffect to handle kick notifications for the current player
  useEffect(() => {
    if (!playerData?.player?.id || !isPlayerVerified) return;

    // Subscribe to personal channel for kick notifications
    const personalChannel = supabase.channel(`player:${playerData.player.id}`);

    personalChannel
      .on("broadcast", { event: "kicked" }, (payload) => {
        if (payload.payload.roomCode === roomCode) {
          // Show notification and redirect to home
          alert("You have been kicked from the room by the host.");
          router.push("/?message=kicked");
        }
      })
      .subscribe();

    return () => {
      personalChannel.unsubscribe();
    };
  }, [playerData, roomCode, router, isPlayerVerified]);

  const handleStartGame = useCallback(async () => {
    if (!canStartGame) return;

    try {
      // 1. Save room data to database first
      await saveRoomData(gameSettings, selectedGameMode);

      // 2. Update room status to "playing" in database
      await supabase
        .from("room")
        .update({
          status: "playing",
          game_started_at: new Date().toISOString(),
        })
        .eq("room_code", roomCode);

      // 3. Wait a bit to ensure database is updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. Broadcast game start event to all players
      const channel = supabase.channel(`room:${roomCode}`);
      await channel.send({
        type: "broadcast",
        event: "game_start",
        payload: {
          roomCode,
          gameConfig: {
            gameSettings,
            selectedGameMode,
            players,
          },
        },
      });

      // 5. Wait a bit more to ensure broadcast is sent
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 6. Navigate host to game page
      window.location.href = `/play/${roomCode}`;
    } catch (error) {
      console.error("Error starting game:", error);
      // Show error message to user
      alert("Failed to start game. Please try again.");
    }
  }, [
    canStartGame,
    players,
    gameSettings,
    selectedGameMode,
    roomCode,
    saveRoomData,
  ]);

  const handleTabChange = useCallback(
    (newTab: TabType) => {
      if (newTab === activeTab) return;
      setIsTabChanging(true);
      setTimeout(() => {
        setActiveTab(newTab);
        setIsTabChanging(false);
      }, 50);
    },
    [activeTab]
  );

  const handleLeaveRoom = useCallback(async () => {
    if (isHost) {
      await supabase.from("room").delete().eq("room_code", roomCode);
    }
    router.push("/");
  }, [isHost, roomCode, router]);

  // Don't render the lobby until data is loaded and verified
  if (!dataLoaded || isLoading || !isPlayerVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="flex items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-2xl mr-3"
          >
            <FaSync />
          </motion.div>
          <span>
            {!dataLoaded
              ? "Loading..."
              : !isPlayerVerified
              ? "Verifying access..."
              : "Loading room..."}
          </span>
        </div>
      </div>
    );
  }

  const renderTabs = () => (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="flex flex-col-reverse gap-4 lg:flex-row mb-2 justify-between"
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
      <motion.div
        {...animations.startButton}
        className="flex-shrink-0 w-full lg:w-auto"
      >
        <motion.button
          whileHover={
            canStartGame
              ? {
                  scale: 1.02,
                  y: -3,
                }
              : {}
          }
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
            ) : isLoading || !isPlayerVerified ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FaSync className="text-2xl" />
              </motion.div>
            ) : (
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
            )}
            <span>
              {!isHost
                ? "Wait Host"
                : !isPlayerVerified
                ? "Verifying..."
                : isLoading
                ? t.loading
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
            onModeSelect={isHost ? handleGameModeChange : () => {}}
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
            onPackSelect={isHost ? handleQuizPackChange : () => {}}
          />
        ),
      },
      settings: {
        title: t.settings,
        icon: FaCog,
        iconColor: "text-gray-400",
        component: (
          // Thêm prop isQuizMode để ẩn các setting về thẻ sức mạnh
          <GameSettingSelector
            settings={gameSettings}
            onSettingChange={isHost ? handleSettingChange : () => {}}
            isQuizMode={isQuizMode}
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
            className="h-full overflow-y-auto overflow-x-hidden space-y-0 sm:space-y-6 p-0 sm:p-3"
          >
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
            {t.players} ({playerCount})
          </h2>
        </div>
        <button
          className="lg:hidden text-white/70 hover:text-white"
          onClick={() => setShowPlayersOnMobile(false)}
        >
          <FaChevronLeft />
        </button>
      </motion.div>

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

  if (roomClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white ">
        <div className="bg-gray-800 p-8 rounded-xl text-center border border-white/20 shadow-xl">
          <p className="text-xl mb-4">The host has left the room.</p>
          <p className="mb-6">The room no longer exists.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="bg-blue-500 px-6 py-3 rounded-lg font-medium"
          >
            Go Home
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col lg:max-h-screen lg:overflow-hidden">
      {/* Header */}
      <motion.header
        {...animations.header}
        className="flex flex-col md:flex-row md:items-center md:justify-between 
             p-4 md:p-6 h-auto md:h-24 flex-shrink-0 relative z-10 "
      >
        {/* Top row: Home + Language (mobile) */}
        <div className="flex w-full items-center justify-between md:w-auto">
          {/* Home button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLeaveRoom}
            className="flex items-center space-x-2 md:space-x-3 
                 bg-white/10 backdrop-blur-lg px-4 md:px-6 py-2 md:py-3 
                 rounded-xl hover:bg-white/20 transition-all 
                 border border-white/20 shadow-lg"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <FaHome className="text-lg md:text-xl text-blue-400" />
            </motion.div>
            <span className="font-medium text-sm md:text-base">{t.home}</span>
          </motion.button>

          {/* Language selector */}
          <div className="block md:hidden">
            <LanguageSelector />
          </div>
        </div>

        {/* Title & room info */}
        <motion.div
          initial={{ scale: 0, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="text-center flex-1 min-w-0"
        >
          <motion.h1
            className="text-2xl md:text-4xl font-bold bg-gradient-to-r 
                 from-yellow-400 via-orange-500 to-red-500 
                 bg-clip-text text-transparent truncate"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 200%" }}
          >
            Quiz Attack
          </motion.h1>

          {/* room code & pass */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 justify-center mt-2">
            {/* Room code */}
            <div className="flex items-center justify-center space-x-2 md:space-x-3">
              <span className="text-xs md:text-sm text-white/70 font-medium">
                {t.room}:
              </span>
              <div
                className="flex items-center space-x-1 md:space-x-2 
                        bg-white/10 px-2 md:px-3 py-1 rounded-lg"
              >
                <span className="text-xs md:text-sm font-mono font-bold truncate max-w-[100px] md:max-w-none">
                  {maskedRoomCode}
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

            {/* Room password */}
            {roomPassword && (
              <div className="flex items-center justify-center space-x-2 md:space-x-3">
                <span className="text-xs md:text-sm text-white/70 font-medium">
                  Pass:
                </span>
                <div
                  className="flex items-center space-x-1 md:space-x-2 
                          bg-white/10 px-2 md:px-3 py-1 rounded-lg"
                >
                  <span className="text-xs md:text-sm font-mono font-bold truncate max-w-[100px] md:max-w-none">
                    {maskedRoomPass}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setShowRoomPass(!showRoomPass)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {showRoomPass ? <FaEyeSlash /> : <FaEye />}
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Language selector (desktop) */}
        <div className="hidden md:block">
          <LanguageSelector />
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 px-2 pb-2 sm:px-4 sm:pb-4 md:px-6 md:pb-6 overflow-y-auto lg:overflow-hidden flex flex-col">
        {/* Mobile Toggle Players Button */}
        <AnimatePresence>
          {!showPlayersOnMobile && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
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
                    {t.players} ({playerCount})
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
          <div className="hidden lg:block">{renderPlayersList()}</div>

          {/* Game Configuration - Right Panel */}
          <motion.section
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-4 flex flex-col h-full overflow-hidden border border-white/20 shadow-xl"
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
