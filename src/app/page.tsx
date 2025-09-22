"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  FaCopy,
  FaCheck,
  FaDoorOpen,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaCog,
  FaEye,
  FaChevronRight,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Avatar, { genConfig, AvatarFullConfig } from "react-nice-avatar";
import { useRouter } from "next/navigation";

// Import components
import { Header } from "@/components/home/Header";
import GameModeSelector from "@/components/Selector/GameModeSelector";
import QuizPackSelector from "@/components/Selector/QuizPackSelector";
import AvatarCustomModal from "@/components/home/AvatarCustomModal";

// Import hooks and types
import { useI18n } from "@/hooks/useI18n";
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";
import { GameMode, QuizPack } from "@/types/type";
import {
  loadFromLocalStorage,
  LOCAL_STORAGE_KEYS,
  saveToLocalStorage,
} from "@/hooks/useLocalStorage";
import { supabase } from "@/lib/supabaseClient";

// Types
type TabType = "gameMode" | "quizPack";

interface QuizAttackStartProps {
  initialNickname?: string;
  initialRoomCode?: string;
}

interface Player {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
}

interface PlayerData {
  player: Player;
  avatarConfig: AvatarFullConfig;
  customAvatarImage: string | null;
  roomSettings?: RoomSettings; // Added roomSettings to PlayerData
}

interface RoomSettings {
  roomCode: string;
  password: string | null;
  gameModeId: number | null;
  quizPackId: number | null;
  createdAt: number;
}

interface RoomData {
  room_code: string;
  player_list: string[];
  setting_list: string[];
  game_mode: number | null;
  quiz_pack: number | null;
  room_password: string | null;
}

// Constants
const ROOM_CODE_LENGTH = 6;
const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const AVATAR_HINT_DURATION = 5000;
const COPY_SUCCESS_DURATION = 1500;
const DESKTOP_BREAKPOINT = 1024;
const ROOM_SETTINGS_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const DEFAULT_AVATAR_CONFIG = genConfig();

// Animation variants
const animationVariants = {
  mobileToggle: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  },
  mobileMenu: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.4 },
  },
  mobileMenuContent: {
    initial: { scale: 0.9 },
    animate: { scale: 1 },
    transition: { delay: 0.1 },
  },
  avatarContainer: {
    whileHover: { scale: 1.1 },
  },
  inputField: {
    whileFocus: { scale: 1.02 },
    whileHover: { scale: 1.01 },
  },
  copyButton: {
    whileHover: { scale: 1.2, color: "#FF6B35" },
    whileTap: { scale: 0.9 },
  },
  createButton: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },
  joinButton: {
    whileHover: { scale: 1.05, backgroundColor: "#FF7A47" },
    whileTap: { scale: 0.95 },
  },
  passwordToggle: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.3 },
  },
} as const;

// Utility functions
const generateRandomRoomCode = (): string => {
  let result = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return result;
};

const generateUniqueId = (): string => {
  let sessionId = sessionStorage.getItem("sessionId");

  if (!sessionId) {
    // nếu chưa có thì tạo mới
    sessionId =
      Date.now().toString(36) + Math.random().toString(36).substring(2);
    sessionStorage.setItem("sessionId", sessionId);
  }

  return sessionId;
};

const isDesktop = (): boolean => {
  return (
    typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT
  );
};

const createPlayerData = (
  nickname: string,
  avatarConfig: AvatarFullConfig,
  customAvatarImage: string | null,
  isHost: boolean
): Player => {
  return {
    id: generateUniqueId(),
    nickname,
    avatar: customAvatarImage || JSON.stringify(avatarConfig),
    isHost,
  };
};

// Room settings storage utilities - now stored in PLAYER_DATA
const saveRoomSettings = (settings: RoomSettings): void => {
  try {
    const playerData = loadFromLocalStorage<PlayerData>(
      LOCAL_STORAGE_KEYS.PLAYER_DATA,
      {
        player: {
          id: "",
          nickname: "",
          avatar: "",
          isHost: false,
        },
        avatarConfig: DEFAULT_AVATAR_CONFIG,
        customAvatarImage: null,
      }
    );

    playerData.roomSettings = settings;
    saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, playerData);
  } catch (error) {
    console.error("Failed to save room settings:", error);
  }
};

const loadRoomSettings = (): RoomSettings | null => {
  try {
    const playerData = loadFromLocalStorage<PlayerData | null>(
      LOCAL_STORAGE_KEYS.PLAYER_DATA,
      null
    );

    if (!playerData || !playerData.roomSettings) {
      return null;
    }

    const roomSettings = playerData.roomSettings;

    // Check if settings are expired (24 hours)
    const now = Date.now();
    if (roomSettings.createdAt + ROOM_SETTINGS_EXPIRY < now) {
      // Remove expired settings
      const updatedPlayerData = { ...playerData, roomSettings: undefined };
      saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, updatedPlayerData);
      return null;
    }

    return roomSettings;
  } catch (error) {
    console.error("Failed to load room settings:", error);
    return null;
  }
};

// Database operations
class DatabaseService {
  static async checkRoomExists(roomCode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("room")
        .select("room_code")
        .eq("room_code", roomCode)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking room:", error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error("Database error checking room:", error);
      return false;
    }
  }

  static async createRoom(
    roomCode: string,
    player: Player,
    selectedGameMode: GameMode | null,
    selectedPack: QuizPack | null,
    password: string | null
  ): Promise<void> {
    try {
      // Check if room already exists
      const roomExists = await this.checkRoomExists(roomCode);
      if (roomExists) {
        throw new Error("Room with this code already exists");
      }

      const roomData: RoomData = {
        room_code: roomCode,
        player_list: [JSON.stringify(player)],
        setting_list: [], // Can be extended later for room settings
        game_mode: selectedGameMode?.id || 1,
        quiz_pack: selectedPack?.id || 1,
        room_password: password,
      };

      const { error } = await supabase.from("room").insert([roomData]);

      if (error) {
        console.error("Error creating room:", error);
        throw error;
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  }

  static async joinRoom(roomCode: string, player: Player): Promise<void> {
    try {
      // First check if room exists
      const { data: roomData, error: fetchError } = await supabase
        .from("room")
        .select("player_list")
        .eq("room_code", roomCode)
        .single();

      if (fetchError || !roomData) {
        throw new Error("Room not found");
      }

      // Add player to the existing player list
      const currentPlayers = roomData.player_list || [];
      const updatedPlayers = [...currentPlayers, JSON.stringify(player)];

      const { error: updateError } = await supabase
        .from("room")
        .update({ player_list: updatedPlayers })
        .eq("room_code", roomCode);

      if (updateError) {
        console.error("Error joining room:", updateError);
        throw updateError;
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  }

  static async verifyRoomPassword(
    roomCode: string,
    password: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("room")
        .select("room_password")
        .eq("room_code", roomCode)
        .single();

      if (error) {
        console.error("Error verifying password:", error);
        return false;
      }

      return data.room_password === password;
    } catch (error) {
      console.error("Failed to verify password:", error);
      return false;
    }
  }
}

// Custom hooks
const useRoomCode = (initialCode?: string) => {
  const [roomCode, setRoomCode] = useState<string>("");

  const generateRoomCode = useCallback(async (): Promise<string> => {
    let newCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      newCode = generateRandomRoomCode();
      attempts++;

      if (attempts >= maxAttempts) {
        break; // Fallback to prevent infinite loop
      }
    } while (await DatabaseService.checkRoomExists(newCode));

    setRoomCode(newCode);
    return newCode;
  }, []);

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode);
    } else {
      generateRoomCode();
    }
  }, [initialCode, generateRoomCode]);

  const updateRoomCode = useCallback((code: string) => {
    setRoomCode(code.toUpperCase());
  }, []);

  return {
    roomCode,
    updateRoomCode,
    generateRoomCode,
  };
};

const useClipboard = () => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = useCallback(async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_SUCCESS_DURATION);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, []);

  return { copied, copyToClipboard };
};

const useResponsiveLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const isDesktopView = isDesktop();
      if (isDesktopView) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "unset";
    };
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return {
    isMobileMenuOpen,
    toggleMobileMenu,
  };
};

const useAvatar = () => {
  // Load player data from localStorage
  const savedPlayerData = loadFromLocalStorage<PlayerData | null>(
    LOCAL_STORAGE_KEYS.PLAYER_DATA,
    null
  );

  const [avatarConfig, setAvatarConfig] = useState<AvatarFullConfig>(
    savedPlayerData?.avatarConfig || DEFAULT_AVATAR_CONFIG
  );
  const [customAvatarImage, setCustomAvatarImage] = useState<string | null>(
    savedPlayerData?.customAvatarImage || null
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [showAvatarHint, setShowAvatarHint] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAvatarHint(false);
    }, AVATAR_HINT_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Save avatar config and custom image to player data
  useEffect(() => {
    const playerData: PlayerData = {
      player: savedPlayerData?.player || {
        id: "",
        nickname: "",
        avatar: "",
        isHost: false,
      },
      avatarConfig,
      customAvatarImage,
      roomSettings: savedPlayerData?.roomSettings, // Preserve existing room settings
    };
    saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, playerData);
  }, [avatarConfig, customAvatarImage, savedPlayerData]);

  const openAvatarModal = useCallback(() => {
    setIsAvatarModalOpen(true);
  }, []);

  const closeAvatarModal = useCallback(() => {
    setIsAvatarModalOpen(false);
  }, []);

  return {
    avatarConfig,
    setAvatarConfig,
    customAvatarImage,
    setCustomAvatarImage,
    isAvatarModalOpen,
    showAvatarHint,
    openAvatarModal,
    closeAvatarModal,
  };
};

// Component parts
const TabNavigation: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}> = ({ activeTab, onTabChange }) => (
  <div className="flex mb-4 rounded-xl bg-white/5 p-1">
    <button
      onClick={() => onTabChange("gameMode")}
      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
        activeTab === "gameMode"
          ? "bg-[#FF6B35] text-white shadow"
          : "text-white/70 hover:text-white"
      }`}
    >
      Game Mode
    </button>
    <button
      onClick={() => onTabChange("quizPack")}
      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
        activeTab === "quizPack"
          ? "bg-[#FF6B35] text-white shadow"
          : "text-white/70 hover:text-white"
      }`}
    >
      Quiz Packs
    </button>
  </div>
);

const TabContent: React.FC<{
  activeTab: TabType;
  selectedGameMode: GameMode | null;
  onGameModeSelect: (mode: GameMode | null) => void;
  selectedPack: QuizPack | null;
  onPackSelect: (pack: QuizPack | null) => void;
}> = ({
  activeTab,
  selectedGameMode,
  onGameModeSelect,
  selectedPack,
  onPackSelect,
}) => (
  <div className="min-h-[200px] lg:min-h-[300px]">
    {activeTab === "gameMode" ? (
      <GameModeSelector
        selectedMode={selectedGameMode}
        onModeSelect={onGameModeSelect}
      />
    ) : (
      <QuizPackSelector
        selectedPack={selectedPack}
        onPackSelect={onPackSelect}
      />
    )}
  </div>
);

const UserProfile: React.FC<{
  nickname: string;
  onNicknameChange: (nickname: string) => void;
  avatarConfig: AvatarFullConfig;
  customAvatarImage: string | null;
  showAvatarHint: boolean;
  onAvatarClick: () => void;
  t: any;
}> = ({
  nickname,
  onNicknameChange,
  avatarConfig,
  customAvatarImage,
  showAvatarHint,
  onAvatarClick,
  t,
}) => (
  <div className="flex justify-center items-center gap-4 mb-4">
    <motion.div className="flex items-center gap-3 lg:gap-4 relative">
      <motion.div
        className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 cursor-pointer relative"
        onClick={onAvatarClick}
        whileHover={animationVariants.avatarContainer.whileHover}
        animate={
          showAvatarHint
            ? {
                boxShadow: [
                  "0 0 0 0 #FF6B35B3", // #FF6B35 with 70% opacity (B3 = 70% in hex)
                  "0 0 0 10px transparent",
                  "0 0 0 0 transparent",
                ],
              }
            : undefined
        }
        transition={
          showAvatarHint
            ? {
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }
            : undefined
        }
      >
        {customAvatarImage ? (
          <img
            src={customAvatarImage}
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <Avatar className="w-full h-full" {...avatarConfig} />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full">
          <FaEye className="text-white text-lg lg:text-xl" />
        </div>
      </motion.div>

      <AnimatePresence>
        {showAvatarHint && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-3 -left-24 text-white text-sx py-1 px-2 rounded-lg whitespace-nowrap"
          >
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="flex items-center gap-1">
                <span>Customize</span>
                <FaChevronRight className="text-xs" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    <div className="space-y-2">
      <motion.input
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        placeholder={t.yourName}
        className="w-full rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
        {...animationVariants.inputField}
      />
    </div>
  </div>
);

// Main Component
const QuizAttackStart: React.FC<QuizAttackStartProps> = ({
  initialNickname = "",
  initialRoomCode,
}) => {
  // Hooks
  const { t } = useI18n();
  const { containerVariants, slideInLeft, slideInRight, scaleIn, fadeUp } =
    useEnhancedAnimations();
  const { roomCode, updateRoomCode, generateRoomCode } =
    useRoomCode(initialRoomCode);
  const { copied, copyToClipboard } = useClipboard();
  const { isMobileMenuOpen, toggleMobileMenu } = useResponsiveLayout();
  const {
    avatarConfig,
    setAvatarConfig,
    customAvatarImage,
    setCustomAvatarImage,
    isAvatarModalOpen,
    showAvatarHint,
    openAvatarModal,
    closeAvatarModal,
  } = useAvatar();
  const router = useRouter();

  // Load player data from localStorage
  const savedPlayerData = loadFromLocalStorage<PlayerData | null>(
    LOCAL_STORAGE_KEYS.PLAYER_DATA,
    null
  );

  // Local state
  const [mounted, setMounted] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>(
    initialNickname || savedPlayerData?.player.nickname || ""
  );
  const [joinCode, setJoinCode] = useState<string>("");
  const [isPasswordProtected, setIsPasswordProtected] =
    useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("gameMode");
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(
    null
  );
  const [selectedPack, setSelectedPack] = useState<QuizPack | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [roomToJoin, setRoomToJoin] = useState<string>("");
  const [joinPassword, setJoinPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  // Load room settings when component mounts
  useEffect(() => {
    const savedSettings = loadRoomSettings();
    if (savedSettings) {
      // Only apply settings if they match the current room code (if we have one)
      if (!initialRoomCode || savedSettings.roomCode === initialRoomCode) {
        if (savedSettings.gameModeId) {
          // You'll need to implement a way to get GameMode by ID
          // For now, we'll just set the ID and let the selectors handle it
          // setSelectedGameMode(findGameModeById(savedSettings.gameModeId));
        }
        if (savedSettings.quizPackId) {
          // You'll need to implement a way to get QuizPack by ID
          // setSelectedPack(findQuizPackById(savedSettings.quizPackId));
        }
        if (savedSettings.password) {
          setRoomPassword(savedSettings.password);
          setIsPasswordProtected(true);
        }
      }
    }
  }, [initialRoomCode]);

  // Save player data to localStorage whenever it changes
  useEffect(() => {
    const playerData: PlayerData = {
      player: {
        id: savedPlayerData?.player.id || "",
        nickname,
        avatar: customAvatarImage || JSON.stringify(avatarConfig),
        isHost: savedPlayerData?.player.isHost || false,
      },
      avatarConfig,
      customAvatarImage,
      roomSettings: savedPlayerData?.roomSettings, // Preserve existing room settings
    };
    saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, playerData);
  }, [nickname, avatarConfig, customAvatarImage, savedPlayerData]);

  // Save room settings when password changes (only if not empty)
  useEffect(() => {
    if (roomCode && roomPassword && roomPassword.trim() !== "") {
      const roomSettings: RoomSettings = {
        roomCode,
        password: roomPassword,
        gameModeId: selectedGameMode?.id || null,
        quizPackId: selectedPack?.id || null,
        createdAt: Date.now(),
      };
      saveRoomSettings(roomSettings);
    }
  }, [roomCode, roomPassword, selectedGameMode, selectedPack]);

  // Initialize component
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validation functions
  const validateNickname = useCallback((nickname: string): boolean => {
    return nickname.trim().length > 0;
  }, []);

  const validateRoomCode = useCallback((code: string): boolean => {
    return code.trim().length === ROOM_CODE_LENGTH;
  }, []);

  // Event handlers
  const handleCopyCode = useCallback(() => {
    copyToClipboard(roomCode);
  }, [copyToClipboard, roomCode]);

  const handlePasswordToggle = useCallback(() => {
    setIsPasswordProtected((prev) => !prev);
    if (!isPasswordProtected) {
      setRoomPassword("");
    }
  }, [isPasswordProtected]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleNicknameChange = useCallback((newNickname: string) => {
    setNickname(newNickname);
  }, []);

  const handleCreateRoom = useCallback(async () => {
    if (!validateNickname(nickname)) {
      alert("Please enter your nickname");
      return;
    }

    if (!validateRoomCode(roomCode)) {
      alert("Please enter a valid room code");
      return;
    }

    setIsCreating(true);
    try {
      const player = createPlayerData(
        nickname,
        avatarConfig,
        customAvatarImage,
        true // isHost = true when creating room
      );

      // Update player data with host status
      const playerData: PlayerData = {
        player,
        avatarConfig,
        customAvatarImage,
        roomSettings: savedPlayerData?.roomSettings, // Preserve existing room settings
      };
      saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, playerData);

      await DatabaseService.createRoom(
        roomCode,
        player,
        selectedGameMode,
        selectedPack,
        isPasswordProtected && roomPassword ? roomPassword : null
      );

      // Save room settings before navigating (only if password is not empty)
      if (isPasswordProtected && roomPassword && roomPassword.trim() !== "") {
        const roomSettings: RoomSettings = {
          roomCode,
          password: roomPassword,
          gameModeId: selectedGameMode?.id || null,
          quizPackId: selectedPack?.id || null,
          createdAt: Date.now(),
        };
        saveRoomSettings(roomSettings);
      }

      router.push(`/lobby/${roomCode}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create room. Please try again.";
      alert(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, [
    nickname,
    roomCode,
    avatarConfig,
    customAvatarImage,
    selectedGameMode,
    selectedPack,
    isPasswordProtected,
    roomPassword,
    router,
    validateNickname,
    validateRoomCode,
    savedPlayerData,
  ]);

  const proceedWithJoin = async (roomCode: string, password?: string) => {
    setIsJoining(true);
    try {
      const player = createPlayerData(
        nickname,
        avatarConfig,
        customAvatarImage,
        false // isHost = false when joining room
      );

      // Update player data with guest status
      const playerData: PlayerData = {
        player,
        avatarConfig,
        customAvatarImage,
        roomSettings: savedPlayerData?.roomSettings, // Preserve existing room settings
      };
      saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, playerData);

      await DatabaseService.joinRoom(roomCode, player);

      // Save room settings if password was provided and not empty
      if (password && password.trim() !== "") {
        const roomSettings: RoomSettings = {
          roomCode,
          password,
          gameModeId: null, // Will be loaded from room data later
          quizPackId: null, // Will be loaded from room data later
          createdAt: Date.now(),
        };
        saveRoomSettings(roomSettings);
      }

      router.push(`/lobby/${roomCode}`);
    } catch (error) {
      console.error("Failed to join room:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to join room. Please check the room code and try again.";
      alert(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = useCallback(async () => {
    if (!validateNickname(nickname)) {
      alert("Please enter your nickname");
      return;
    }

    if (!validateRoomCode(joinCode)) {
      alert("Please enter a valid room code");
      return;
    }

    // Check for saved room settings first
    const savedSettings = loadRoomSettings();
    if (
      savedSettings &&
      savedSettings.roomCode === joinCode &&
      savedSettings.password
    ) {
      // Use saved password
      const isValid = await DatabaseService.verifyRoomPassword(
        joinCode,
        savedSettings.password
      );
      if (isValid) {
        await proceedWithJoin(joinCode, savedSettings.password);
        return;
      }
    }

    // Check if room requires password
    try {
      const { data: roomData } = await supabase
        .from("room")
        .select("room_password")
        .eq("room_code", joinCode)
        .single();

      if (roomData?.room_password) {
        // Room has password, show password modal
        setRoomToJoin(joinCode);
        setShowPasswordModal(true);
        return;
      }

      // No password required, proceed to join
      await proceedWithJoin(joinCode);
    } catch (error) {
      console.error("Error checking room password:", error);
      alert("Failed to check room. Please try again.");
    }
  }, [nickname, joinCode, validateNickname, validateRoomCode]);

  const handlePasswordSubmit = async () => {
    try {
      const isValid = await DatabaseService.verifyRoomPassword(
        roomToJoin,
        joinPassword
      );
      if (isValid) {
        setShowPasswordModal(false);
        setPasswordError("");
        await proceedWithJoin(roomToJoin, joinPassword);
      } else {
        setPasswordError("Incorrect password");
      }
    } catch (error) {
      setPasswordError("Failed to verify password");
    }
  };

  // Loading state
  if (!mounted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
    );
  }

  return (
    <div className="relative min-h-screen w-full font-sans flex flex-col overflow-x-hidden">
      <Header />

      <AvatarCustomModal
        isOpen={isAvatarModalOpen}
        onClose={closeAvatarModal}
        avatarConfig={avatarConfig}
        setAvatarConfig={setAvatarConfig}
        customAvatarImage={customAvatarImage}
        setCustomAvatarImage={setCustomAvatarImage}
      />

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl max-w-md w-full"
          >
            <h3 className="text-white text-lg font-semibold mb-4">
              Room Password Required
            </h3>
            <p className="text-white/80 mb-4">
              This room is password protected. Please enter the password to
              join.
            </p>

            <input
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all mb-4"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handlePasswordSubmit();
                }
              }}
            />

            {passwordError && (
              <p className="text-red-400 mb-4">{passwordError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setJoinPassword("");
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#FF7A47] transition-colors"
              >
                Join Room
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className=" mx-auto w-full max-w-7xl grid grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-12 lg:mt-0"
      >
        {/* Mobile Toggle */}
        <motion.div variants={fadeUp} className="lg:hidden">
          <motion.button
            onClick={toggleMobileMenu}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-white/20 text-white shadow-lg"
            {...animationVariants.mobileToggle}
          >
            <span className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <FaCog className="text-orange-400" />
              </motion.div>
              Show Settings
            </span>
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isMobileMenuOpen ? <FaChevronUp /> : <FaChevronDown />}
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Mobile Settings */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.section
              {...animationVariants.mobileMenu}
              className="lg:hidden space-y-4"
            >
              <motion.div
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-xl"
                {...animationVariants.mobileMenuContent}
              >
                <TabNavigation
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
                <TabContent
                  activeTab={activeTab}
                  selectedGameMode={selectedGameMode}
                  onGameModeSelect={setSelectedGameMode}
                  selectedPack={selectedPack}
                  onPackSelect={setSelectedPack}
                />
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Desktop Left Panel */}
        <motion.section
          variants={slideInLeft}
          className="hidden lg:flex lg:col-span-4 space-y-4 flex-col"
        >
          <motion.div variants={scaleIn} className="flex-shrink-0">
            <motion.div
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-xl"
              whileHover={{ borderColor: "rgba(255, 255, 255, 0.3)" }}
            >
              <TabNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
              <TabContent
                activeTab={activeTab}
                selectedGameMode={selectedGameMode}
                onGameModeSelect={setSelectedGameMode}
                selectedPack={selectedPack}
                onPackSelect={setSelectedPack}
              />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Main Content Panel */}
        <motion.section variants={slideInRight} className="lg:col-span-8">
          <motion.div className="rounded-2xl lg:rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 lg:p-6 shadow-2xl backdrop-blur-md relative">
            {/* User Profile */}
            <motion.div variants={fadeUp}>
              <UserProfile
                nickname={nickname}
                onNicknameChange={handleNicknameChange}
                avatarConfig={avatarConfig}
                customAvatarImage={customAvatarImage}
                showAvatarHint={showAvatarHint}
                onAvatarClick={openAvatarModal}
                t={t}
              />
            </motion.div>

            {/* Create Room */}
            <div className="mb-4 lg:mb-6 space-y-2">
              <label className="block text-sm font-medium text-[#EAEAEA]">
                {t.createRoom}
              </label>
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-2">
                <motion.div
                  className="flex-1 relative"
                  whileHover={{ scale: 1.01 }}
                >
                  <motion.input
                    value={roomCode}
                    onChange={(e) => updateRoomCode(e.target.value)}
                    placeholder={t.roomCodePlaceholder}
                    className="w-full rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
                    whileFocus={{ borderColor: "rgba(255, 107, 53, 0.5)" }}
                  />
                  <motion.button
                    onClick={handleCopyCode}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#EAEAEA] hover:text-white p-1 lg:p-2"
                    {...animationVariants.copyButton}
                    aria-label="Copy room code"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                        >
                          <FaCheck className="text-xs lg:text-sm text-green-400" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <FaCopy className="text-xs lg:text-sm" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
                <motion.button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl bg-[#FF6B35] px-4 py-2 lg:px-6 lg:py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20 text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  {...animationVariants.createButton}
                >
                  <motion.div whileHover={{ rotate: 90 }}>
                    <FaPlus className="text-xs lg:text-sm" />
                  </motion.div>
                  {isCreating ? "Creating..." : t.create}
                </motion.button>
              </div>

              <motion.div className="flex items-center gap-3">
                <motion.input
                  type="checkbox"
                  id="password-protection"
                  checked={isPasswordProtected}
                  onChange={handlePasswordToggle}
                  className="w-4 h-4 rounded border-white/10 bg-white/10 text-[#FF6B35] focus:ring-[#FF6B35]"
                  whileHover={{ scale: 1.1 }}
                />
                <motion.label
                  htmlFor="password-protection"
                  className="text-sm text-[#EAEAEA] cursor-pointer"
                  whileHover={{ color: "#FFFFFF" }}
                >
                  {t.setPassword}
                </motion.label>
              </motion.div>

              <AnimatePresence>
                {isPasswordProtected && (
                  <motion.div
                    className="mt-2"
                    {...animationVariants.passwordToggle}
                  >
                    <motion.input
                      type="password"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      placeholder={t.roomPassword}
                      className="w-full rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
                      whileFocus={{ scale: 1.02 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Join Room */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#EAEAEA]">
                {t.joinRoom}
              </label>
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <motion.input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={t.enterRoomCode}
                  className="flex-1 rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
                  {...animationVariants.inputField}
                />
                <motion.button
                  onClick={handleJoinRoom}
                  disabled={isJoining}
                  className="inline-flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl bg-[#FF6B35] px-4 py-2 lg:px-6 lg:py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20 text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  {...animationVariants.joinButton}
                >
                  <motion.div
                    animate={{ x: [0, 2, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <FaDoorOpen className="text-xs lg:text-sm" />
                  </motion.div>
                  {isJoining ? "Joining..." : t.join}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default QuizAttackStart;
