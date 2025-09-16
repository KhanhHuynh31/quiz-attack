"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  FaDoorOpen,
  FaChevronRight,
  FaEye,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Avatar, { genConfig, AvatarFullConfig } from "react-nice-avatar";
import { useRouter, useParams } from "next/navigation";

// Import components
import { Header } from "@/components/home/Header";
import AvatarCustomModal from "@/components/home/AvatarCustomModal";

// Import hooks and types
import { useI18n } from "@/hooks/useI18n";
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";
import {
  loadFromLocalStorage,
  LOCAL_STORAGE_KEYS,
  saveToLocalStorage,
} from "@/hooks/useLocalStorage";
import { supabase } from "@/lib/supabaseClient";

// Types
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
  roomSettings?: RoomSettings;
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
const AVATAR_HINT_DURATION = 5000;
const DEFAULT_AVATAR_CONFIG = genConfig();
const ROOM_CHECK_INTERVAL = 30000; // Check room status every 30 seconds
const ROOM_SETTINGS_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Animation variants
const animationVariants = {
  avatarContainer: {
    whileHover: { scale: 1.1 },
  },
  inputField: {
    whileFocus: { scale: 1.02 },
    whileHover: { scale: 1.01 },
  },
  joinButton: {
    whileHover: { scale: 1.05, backgroundColor: "#FF7A47" },
    whileTap: { scale: 0.95 },
  },
} as const;

// Utility functions
const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

// Database operations
class DatabaseService {
  static async getRoomData(roomCode: string): Promise<RoomData | null> {
    try {
      const { data, error } = await supabase
        .from("room")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - room doesn't exist
          console.log('Room does not exist:', roomCode);
          return null;
        }
        console.error("Error fetching room data:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to fetch room data:", error);
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
        .eq("room_code", roomCode.toUpperCase())
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

  static async joinRoom(roomCode: string, player: Player): Promise<void> {
    try {
      // First check if room exists
      const { data: roomData, error: fetchError } = await supabase
        .from("room")
        .select("player_list")
        .eq("room_code", roomCode.toUpperCase())
        .single();

      if (fetchError || !roomData) {
        throw new Error("Room not found");
      }

      // Parse existing players
      let currentPlayers: Player[] = [];
      try {
        currentPlayers = roomData.player_list 
          ? roomData.player_list.map((p: string) => JSON.parse(p) as Player)
          : [];
      } catch (parseError) {
        console.error("Error parsing player list:", parseError);
        currentPlayers = [];
      }

      // Check if player already exists in the room
      const playerExists = currentPlayers.some(p => p.id === player.id);
      if (playerExists) {
        console.log("Player already in room, proceeding...");
        return;
      }

      // Add player to the existing player list
      const updatedPlayers = [...currentPlayers, player];

      const { error: updateError } = await supabase
        .from("room")
        .update({ 
          player_list: updatedPlayers.map(p => JSON.stringify(p))
        })
        .eq("room_code", roomCode.toUpperCase());

      if (updateError) {
        console.error("Error joining room:", updateError);
        throw updateError;
      }

      console.log("Successfully joined room:", roomCode);
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  }
}

// Room settings utilities
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

// Custom hooks
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
  <div className="flex justify-center items-center gap-4 mb-6">
    <motion.div className="flex items-center gap-3 lg:gap-4 relative">
      <motion.div
        className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 cursor-pointer relative"
        onClick={onAvatarClick}
        whileHover={animationVariants.avatarContainer.whileHover}
        animate={
          showAvatarHint
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(255, 107, 53, 0.7)",
                  "0 0 0 10px rgba(255, 107, 53, 0)",
                  "0 0 0 0 rgba(255, 107, 53, 0)",
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
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <Avatar className="w-full h-full" {...avatarConfig} />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full">
          <FaEye className="text-white text-xl lg:text-2xl" />
        </div>
      </motion.div>

      <AnimatePresence>
        {showAvatarHint && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-3 -left-24 text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap"
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

    <div className="space-y-2 flex-1">
      <motion.input
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value)}
        placeholder={t.yourName}
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-base"
        {...animationVariants.inputField}
      />
    </div>
  </div>
);

// Main Component
const JoinRoomPage: React.FC = () => {
  // Hooks
  const { t } = useI18n();
  const { containerVariants, slideInLeft, fadeUp } = useEnhancedAnimations();
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
  const params = useParams();
  const roomCode = params.code as string;

  // Load player data from localStorage
  const savedPlayerData = loadFromLocalStorage<PlayerData | null>(
    LOCAL_STORAGE_KEYS.PLAYER_DATA,
    null
  );

  // Local state
  const [mounted, setMounted] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>(
    savedPlayerData?.player.nickname || ""
  );
  const [roomPassword, setRoomPassword] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [lastRoomCheck, setLastRoomCheck] = useState<number>(0);
  const [hasSavedPassword, setHasSavedPassword] = useState<boolean>(false);

  // Load room data when component mounts
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!roomCode) {
        setError("Invalid room code");
        setIsLoading(false);
        return;
      }

      try {
        const data = await DatabaseService.getRoomData(roomCode);
        if (!data) {
          setError("Room not found");
          setIsLoading(false);
          return;
        }

        setRoomData(data);
        
        // Check if we have saved room settings for this room
        const savedSettings = loadRoomSettings();
        if (savedSettings && savedSettings.roomCode === roomCode && savedSettings.password) {
          setRoomPassword(savedSettings.password);
          setHasSavedPassword(true);
        }
        
        setIsLoading(false);
        setLastRoomCheck(Date.now());
      } catch (error) {
        console.error("Failed to fetch room data:", error);
        setError("Failed to load room data. Please try again.");
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [roomCode]);

  // Periodically check if room still exists
  useEffect(() => {
    if (!roomData) return;

    const interval = setInterval(async () => {
      try {
        const data = await DatabaseService.getRoomData(roomCode);
        if (!data) {
          setError("This room has been closed");
          setRoomData(null);
        } else {
          setLastRoomCheck(Date.now());
        }
      } catch (error) {
        console.error("Error checking room status:", error);
      }
    }, ROOM_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [roomData, roomCode]);

  // Save player data to localStorage whenever it changes
  useEffect(() => {
    const playerData: PlayerData = {
      player: {
        id: savedPlayerData?.player.id || generateUniqueId(),
        nickname,
        avatar: customAvatarImage || JSON.stringify(avatarConfig),
        isHost: false, // Always false when joining a room
      },
      avatarConfig,
      customAvatarImage,
      roomSettings: savedPlayerData?.roomSettings, // Preserve existing room settings
    };
    saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, playerData);
  }, [nickname, avatarConfig, customAvatarImage, savedPlayerData]);

  // Initialize component
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validation functions
  const validateNickname = useCallback((nickname: string): boolean => {
    return nickname.trim().length > 0;
  }, []);

  // Event handlers
  const handleNicknameChange = useCallback((newNickname: string) => {
    setNickname(newNickname);
  }, []);

  const handleJoinRoom = useCallback(async () => {
    if (!validateNickname(nickname)) {
      setError("Please enter your nickname");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      // Revalidate room existence before joining
      const data = await DatabaseService.getRoomData(roomCode);
      if (!data) {
        setError("Room no longer exists");
        setIsJoining(false);
        return;
      }

      // Check if room requires password
      if (data.room_password) {
        const isValid = await DatabaseService.verifyRoomPassword(
          roomCode,
          roomPassword
        );
        if (!isValid) {
          setError("Incorrect password");
          setIsJoining(false);
          return;
        }
      }

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
      
      // Save room settings if password was provided and not empty
      if (roomPassword && roomPassword.trim() !== "") {
        const roomSettings: RoomSettings = {
          roomCode,
          password: roomPassword,
          gameModeId: data.game_mode || null,
          quizPackId: data.quiz_pack || null,
          createdAt: Date.now(),
        };
        saveRoomSettings(roomSettings);
      }
      
      await DatabaseService.joinRoom(roomCode, player);
      router.push(`/lobby/${roomCode}`);
    } catch (error) {
      console.error("Failed to join room:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to join room. Please try again.";
      setError(errorMessage);
    } finally {
      setIsJoining(false);
    }
  }, [nickname, avatarConfig, customAvatarImage, roomCode, roomPassword, router, validateNickname, savedPlayerData]);

  // Loading state
  if (!mounted || isLoading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-white text-4xl mb-4"
          >
            <FaSpinner />
          </motion.div>
          <p className="text-white/80">Loading room information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !roomData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-white text-6xl mb-6"
          >
            <FaExclamationTriangle />
          </motion.div>
          <h1 className="text-white text-2xl font-bold mb-4">Room Not Available</h1>
          <p className="text-white/80 mb-6">{error}</p>
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#FF6B35] text-white px-6 py-3 rounded-2xl font-semibold"
          >
            Return to Home
          </motion.button>
        </div>
      </div>
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

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 mx-auto w-full max-w-md px-4 py-8 flex items-center justify-center"
      >
        <motion.div
          variants={slideInLeft}
          className="w-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur-md relative"
        >
          <div className="text-center mb-6">
            <motion.h1 
              variants={fadeUp}
              className="text-2xl font-bold text-white mb-2"
            >
              Join Room
            </motion.h1>
            <motion.p 
              variants={fadeUp}
              className="text-white/70 text-lg font-mono"
            >
              {roomCode}
            </motion.p>
            <motion.p 
              variants={fadeUp}
              className="text-white/50 text-sm mt-2"
            >
              Last checked: {new Date(lastRoomCheck).toLocaleTimeString()}
            </motion.p>
            {hasSavedPassword && (
              <motion.p 
                variants={fadeUp}
                className="text-green-400 text-sm mt-1"
              >
                Using saved password
              </motion.p>
            )}
          </div>

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

          {/* Password Input (if room is password protected) */}
          {roomData?.room_password && (
            <motion.div 
              variants={fadeUp}
              className="mb-6"
            >
              <label className="block text-sm font-medium text-[#EAEAEA] mb-2">
                Room Password
              </label>
              <motion.input
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Enter room password"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                {...animationVariants.inputField}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinRoom();
                  }
                }}
              />
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Join Button */}
          <motion.button
            onClick={handleJoinRoom}
            disabled={isJoining}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#FF6B35] px-6 py-4 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            {...animationVariants.joinButton}
          >
            {isJoining ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FaSpinner />
              </motion.div>
            ) : (
              <FaDoorOpen />
            )}
            {isJoining ? "Joining..." : "Join Room"}
          </motion.button>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default JoinRoomPage;