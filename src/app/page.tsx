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
  FaSignInAlt,
  FaSignOutAlt,
  FaUser,
  FaInfoCircle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Avatar, { genConfig, AvatarFullConfig } from "react-nice-avatar";
import { useRouter } from "next/navigation";

import { Header } from "@/components/home/Header";
import GameModeSelector from "@/components/Selector/GameModeSelector";
import QuizPackSelector from "@/components/Selector/QuizPackSelector";
import AvatarCustomModal from "@/components/home/AvatarCustomModal";

import { useI18n } from "@/hooks/useI18n";
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";
import { GameMode, QuizPack } from "@/types/type";
import {
  loadFromLocalStorage,
  LOCAL_STORAGE_KEYS,
  saveToLocalStorage,
} from "@/hooks/useLocalStorage";
import { supabase } from "@/lib/supabaseClient";
import AuthModal from "@/components/users/AuthModal";

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
  isAuthenticated?: boolean;
  email?: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  avatarConfig?: AvatarFullConfig;
}

interface PlayerData {
  player: Player;
  avatarConfig: AvatarFullConfig;
  roomSettings?: RoomSettings;
  authUser?: AuthUser;
  currentRoomCode?: string;
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

const ROOM_CODE_LENGTH = 6;
const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const AVATAR_HINT_DURATION = 5000;
const COPY_SUCCESS_DURATION = 1500;
const DESKTOP_BREAKPOINT = 1024;
const ROOM_SETTINGS_EXPIRY = 24 * 60 * 60 * 1000;

const DEFAULT_AVATAR_CONFIG = genConfig();

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
  authButton: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },
} as const;

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
  isHost: boolean,
  roomCode?: string,
  authUser?: AuthUser
): Player => {
  if (authUser) {
    return {
      id: authUser.id,
      nickname: authUser.name || nickname,
      avatar: authUser.avatar,
      isHost,
      isAuthenticated: true,
      email: authUser.email,
    };
  }

  const avatar = JSON.stringify(avatarConfig);

  return {
    id: generateUniqueId(),
    nickname,
    avatar,
    isHost,
    isAuthenticated: false,
  };
};

const savePlayerData = (
  player: Player,
  avatarConfig: AvatarFullConfig,
  roomCode?: string,
  roomSettings?: RoomSettings,
  authUser?: AuthUser
): void => {
  try {
    const playerData: PlayerData = {
      player,
      avatarConfig,
      roomSettings,
      authUser,
      currentRoomCode: roomCode,
    };

    saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, playerData);
  } catch (error) {
    console.error("Failed to save player data:", error);
  }
};

const parseAvatarData = (avatar: string): { config: AvatarFullConfig } => {
  try {
    if (!avatar) {
      return {
        config: DEFAULT_AVATAR_CONFIG,
      };
    }

    const config = JSON.parse(avatar);
    return {
      config,
    };
  } catch {
    return {
      config: DEFAULT_AVATAR_CONFIG,
    };
  }
};

const loadAuthUser = (): AuthUser | null => {
  try {
    const authData = loadFromLocalStorage<AuthUser | null>("auth_user", null);

    if (authData) {
      const { config } = parseAvatarData(authData.avatar);

      return {
        ...authData,
        avatarConfig: config,
      };
    }

    const playerData = loadFromLocalStorage<PlayerData | null>(
      LOCAL_STORAGE_KEYS.PLAYER_DATA,
      null
    );

    if (playerData?.authUser) {
      const { config } = parseAvatarData(playerData.authUser.avatar);

      return {
        ...playerData.authUser,
        avatarConfig: config,
      };
    }

    return null;
  } catch (error) {
    console.error("Failed to load auth user:", error);
    return null;
  }
};

const saveAuthUser = (authUser: AuthUser, roomCode?: string): void => {
  try {
    saveToLocalStorage("auth_user", authUser);

    const existingPlayerData = loadFromLocalStorage<PlayerData | null>(
      LOCAL_STORAGE_KEYS.PLAYER_DATA,
      null
    );

    const playerData: PlayerData = {
      player: {
        id: authUser.id,
        nickname: authUser.name,
        avatar: authUser.avatar,
        isHost: existingPlayerData?.player.isHost || false,
        isAuthenticated: true,
        email: authUser.email,
      },
      avatarConfig: authUser.avatarConfig || DEFAULT_AVATAR_CONFIG,
      roomSettings: existingPlayerData?.roomSettings,
      authUser,
      currentRoomCode: roomCode || existingPlayerData?.currentRoomCode,
    };

    saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, playerData);
  } catch (error) {
    console.error("Failed to save auth user:", error);
  }
};

const clearAuthUser = (): void => {
  try {
    localStorage.removeItem("auth_user");

    const playerData = loadFromLocalStorage<PlayerData | null>(
      LOCAL_STORAGE_KEYS.PLAYER_DATA,
      null
    );

    if (playerData) {
      const { config } = parseAvatarData(playerData.player.avatar);

      const updatedPlayerData: PlayerData = {
        player: {
          id: generateUniqueId(),
          nickname: playerData.player.nickname || "",
          avatar: playerData.player.avatar || "",
          isHost: false,
          isAuthenticated: false,
        },
        avatarConfig: config,
        roomSettings: playerData.roomSettings,
        currentRoomCode: playerData.currentRoomCode,
        authUser: undefined,
      };

      saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, updatedPlayerData);
    }
  } catch (error) {
    console.error("Failed to clear auth user:", error);
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
    const now = Date.now();
    if (roomSettings.createdAt + ROOM_SETTINGS_EXPIRY < now) {
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
        return false;
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
      const roomExists = await this.checkRoomExists(roomCode);
      if (roomExists) {
        throw new Error("Room with this code already exists");
      }

      const roomData: RoomData = {
        room_code: roomCode,
        player_list: [JSON.stringify(player)],
        setting_list: [],
        game_mode: selectedGameMode?.id || 1,
        quiz_pack: selectedPack?.id || 1,
        room_password: password,
      };

      const { error } = await supabase.from("room").insert([roomData]);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  }

  static async joinRoom(roomCode: string, player: Player): Promise<void> {
    try {
      const { data: roomData, error: fetchError } = await supabase
        .from("room")
        .select("player_list")
        .eq("room_code", roomCode)
        .single();

      if (fetchError || !roomData) {
        throw new Error("Room not found");
      }

      const currentPlayers = roomData.player_list || [];
      const updatedPlayers = [...currentPlayers, JSON.stringify(player)];

      const { error: updateError } = await supabase
        .from("room")
        .update({ player_list: updatedPlayers })
        .eq("room_code", roomCode);

      if (updateError) throw updateError;
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

      if (error) return false;
      return data.room_password === password;
    } catch (error) {
      console.error("Failed to verify password:", error);
      return false;
    }
  }

  static async getRoomPassword(roomCode: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("room")
        .select("room_password")
        .eq("room_code", roomCode)
        .single();

      if (error) return null;
      return data.room_password;
    } catch (error) {
      console.error("Failed to get room password:", error);
      return null;
    }
  }

  static async updateUserProfile(
    userId: string,
    updates: {
      name?: string;
      avatar_config?: AvatarFullConfig;
    }
  ): Promise<void> {
    try {
      const updateData: any = { updated_at: new Date().toISOString() };

      if (updates.name) updateData.name = updates.name;
      if (updates.avatar_config) {
        updateData.avatar_config = JSON.stringify(updates.avatar_config);
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to update user profile:", error);
      throw error;
    }
  }

  static async fetchUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) return null;

      let avatarData = data.avatar_config;

      if (data.avatar_config) {
        try {
          const config = JSON.parse(data.avatar_config);
          return {
            id: data.id,
            email: data.email ?? "",
            name: data.name ?? "",
            avatar: data.avatar_config,
            avatarConfig: config,
          };
        } catch (parseError) {
          console.warn("Failed to parse avatar_config", parseError);
        }
      }

      const { config } = parseAvatarData(avatarData);

      return {
        id: data.id,
        email: data.email ?? "",
        name: data.name ?? "",
        avatar: avatarData,
        avatarConfig: config,
      };
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  }
}

const useAuthentication = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let subscriptionCleanup: (() => void) | null = null;

    const checkAuthStatus = async () => {
      setIsCheckingAuth(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await DatabaseService.fetchUserProfile(
            session.user.id
          );
          if (profile) {
            setAuthUser(profile);
            saveAuthUser(profile);
          } else {
            await supabase.auth.signOut();
            setAuthUser(null);
            clearAuthUser();
          }
        } else {
          const savedAuthUser = loadAuthUser();
          setAuthUser(savedAuthUser);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        const savedAuthUser = loadAuthUser();
        setAuthUser(savedAuthUser);
      } finally {
        setIsCheckingAuth(false);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setAuthUser(null);
          clearAuthUser();
        } else if (event === "SIGNED_IN" && session?.user) {
          const profile = await DatabaseService.fetchUserProfile(
            session.user.id
          );
          if (profile) {
            setAuthUser(profile);
            saveAuthUser(profile);
          } else {
            await supabase.auth.signOut();
            setAuthUser(null);
            clearAuthUser();
          }
        }
      });

      subscriptionCleanup = () => subscription.unsubscribe();
    };

    checkAuthStatus();

    return () => subscriptionCleanup?.();
  }, []);

  const handleAuthSuccess = useCallback((user: AuthUser) => {
    setAuthUser(user);

    const existingPlayerData = loadFromLocalStorage<PlayerData | null>(
      LOCAL_STORAGE_KEYS.PLAYER_DATA,
      null
    );

    saveAuthUser(user, existingPlayerData?.currentRoomCode);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setAuthUser(null);
      clearAuthUser();
    } catch (error) {
      console.error("Error signing out:", error);
      setAuthUser(null);
      clearAuthUser();
    }
  }, []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const refreshUserData = useCallback(async () => {
    if (!authUser) return;

    try {
      const updatedUser = await DatabaseService.fetchUserProfile(authUser.id);
      if (updatedUser) {
        setAuthUser(updatedUser);
        saveAuthUser(updatedUser);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  }, [authUser]);

  return {
    authUser,
    isAuthModalOpen,
    isCheckingAuth,
    openAuthModal,
    closeAuthModal,
    handleAuthSuccess,
    handleSignOut,
    refreshUserData,
  };
};

const useRoomCode = (initialCode?: string) => {
  const [roomCode, setRoomCode] = useState<string>("");

  const generateRoomCode = useCallback(async (): Promise<string> => {
    let newCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      newCode = generateRandomRoomCode();
      attempts++;
      if (attempts >= maxAttempts) break;
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

  return { roomCode, updateRoomCode, generateRoomCode };
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
      if (isDesktop()) {
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

  return { isMobileMenuOpen, toggleMobileMenu };
};

const useAvatar = (
  authUser: AuthUser | null,
  refreshUserData?: () => Promise<void>
) => {
  const savedPlayerData = useMemo(() => {
    return loadFromLocalStorage<PlayerData | null>(
      LOCAL_STORAGE_KEYS.PLAYER_DATA,
      null
    );
  }, []);

  const getInitialAvatarData = () => {
    if (authUser) {
      return {
        config: authUser.avatarConfig || DEFAULT_AVATAR_CONFIG,
      };
    }

    if (savedPlayerData) {
      return {
        config: savedPlayerData.avatarConfig || DEFAULT_AVATAR_CONFIG,
      };
    }

    return {
      config: DEFAULT_AVATAR_CONFIG,
    };
  };

  const initialData = getInitialAvatarData();
  const [avatarConfig, setAvatarConfig] = useState<AvatarFullConfig>(
    initialData.config
  );
  const [avatarKey, setAvatarKey] = useState(0);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [showAvatarHint, setShowAvatarHint] = useState<boolean>(!authUser);

  useEffect(() => {
    if (authUser) {
      setAvatarConfig(authUser.avatarConfig || DEFAULT_AVATAR_CONFIG);
      setAvatarKey((prev) => prev + 1);
      setShowAvatarHint(false);

      console.log("Auth user avatar data:", {
        avatarConfig: authUser.avatarConfig,
        rawAvatar: authUser.avatar,
      });
    }
  }, [authUser]);

  useEffect(() => {
    if (showAvatarHint) {
      const timer = setTimeout(
        () => setShowAvatarHint(false),
        AVATAR_HINT_DURATION
      );
      return () => clearTimeout(timer);
    }
  }, [showAvatarHint]);

  useEffect(() => {
    if (!authUser) {
      const playerData: PlayerData = {
        player: savedPlayerData?.player ?? {
          id: "",
          nickname: "",
          avatar: JSON.stringify(avatarConfig),
          isHost: false,
          isAuthenticated: false,
        },
        avatarConfig,
        roomSettings: savedPlayerData?.roomSettings,
        currentRoomCode: savedPlayerData?.currentRoomCode,
      };
      saveToLocalStorage(LOCAL_STORAGE_KEYS.PLAYER_DATA, playerData);
    }
  }, [avatarConfig, authUser, savedPlayerData]);

  const openAvatarModal = useCallback(() => setIsAvatarModalOpen(true), []);
  const closeAvatarModal = useCallback(() => setIsAvatarModalOpen(false), []);

  const updateAvatarInDatabase = useCallback(
    async (newAvatarConfig: AvatarFullConfig) => {
      if (!authUser) return;

      try {
        await DatabaseService.updateUserProfile(authUser.id, {
          avatar_config: newAvatarConfig,
        });

        if (refreshUserData) {
          await refreshUserData();
        }
      } catch (error) {
        console.error("Failed to update avatar in database:", error);
        throw error;
      }
    },
    [authUser, refreshUserData]
  );

  const handleAvatarSave = useCallback(
    async (newAvatarConfig: AvatarFullConfig) => {
      setAvatarConfig(newAvatarConfig);
      setAvatarKey((prev) => prev + 1);

      if (authUser) {
        try {
          await updateAvatarInDatabase(newAvatarConfig);
        } catch (error) {
          console.error("Failed to update avatar in database:", error);
        }
      }
    },
    [authUser, updateAvatarInDatabase]
  );

  return {
    avatarConfig,
    avatarKey,
    isAvatarModalOpen,
    showAvatarHint,
    openAvatarModal,
    closeAvatarModal,
    handleAvatarSave,
  };
};

const AuthSection: React.FC<{
  authUser: AuthUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}> = ({ authUser, onSignIn, onSignOut }) => (
  <div className="flex flex-col gap-3 mb-4 lg:mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-white/70">
        <FaInfoCircle className="text-sm" />
        <span className="text-xs lg:text-sm">
          {authUser
            ? "Logged in with database"
            : "Quick play as guest or sign in"}
        </span>
      </div>

      <motion.button
        onClick={authUser ? onSignOut : onSignIn}
        className={`flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 rounded-xl font-medium transition-colors text-sm lg:text-base ${
          authUser
            ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
            : "bg-[#FF6B35] text-white hover:bg-[#FF7A47] shadow-lg"
        }`}
        {...animationVariants.authButton}
      >
        {authUser ? (
          <>
            <FaSignOutAlt className="text-xs lg:text-sm" />
            <span>Sign Out</span>
          </>
        ) : (
          <>
            <FaSignInAlt className="text-xs lg:text-sm" />
            <span>Sign In</span>
          </>
        )}
      </motion.button>
    </div>
  </div>
);

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
  onNicknameUpdate?: (newNickname: string) => void;
  avatarConfig: AvatarFullConfig;
  avatarKey?: number;
  showAvatarHint: boolean;
  onAvatarClick: () => void;
  authUser: AuthUser | null;
  t: any;
}> = ({
  nickname,
  onNicknameChange,
  onNicknameUpdate,
  avatarConfig,
  avatarKey,
  showAvatarHint,
  onAvatarClick,
  authUser,
  t,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempNickname, setTempNickname] = useState(nickname);

  const handleNicknameSubmit = () => {
    if (tempNickname.trim() && tempNickname !== nickname) {
      onNicknameChange(tempNickname);
      if (onNicknameUpdate && authUser) {
        onNicknameUpdate(tempNickname);
      }
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleNicknameSubmit();
    else if (e.key === "Escape") {
      setTempNickname(nickname);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex justify-center items-center gap-4 mb-4">
      <motion.div className="flex items-center gap-3 lg:gap-4 relative">
        <motion.div
          className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 cursor-pointer relative"
          onClick={onAvatarClick}
          whileHover={animationVariants.avatarContainer.whileHover}
          animate={
            showAvatarHint && !authUser
              ? {
                  boxShadow: [
                    "0 0 0 0 #FF6B35B3",
                    "0 0 0 10px transparent",
                    "0 0 0 0 transparent",
                  ],
                }
              : undefined
          }
          transition={
            showAvatarHint && !authUser
              ? {
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }
              : undefined
          }
        >
          <Avatar
            key={avatarKey}
            className="w-full h-full"
            {...avatarConfig}
            style={{ width: "100%", height: "100%" }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full">
            <FaEye className="text-white text-lg lg:text-xl" />
          </div>
          {authUser && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <FaUser className="text-white text-xs" />
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {showAvatarHint && !authUser && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.5 }}
              className={`absolute bottom-3 ${
                isDesktop() ? "-left-18" : "-left-6"
              } text-white text-xs py-1 px-2 rounded-lg whitespace-nowrap`}
            >
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <div className="flex items-center gap-1">
                  {isDesktop() && <span>Change</span>}
                  <FaChevronRight className="text-xs" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="space-y-2 flex-1">
        <div className="relative">
          {isEditing ? (
            <motion.input
              value={tempNickname}
              onChange={(e) => setTempNickname(e.target.value)}
              onBlur={handleNicknameSubmit}
              onKeyPress={handleKeyPress}
              placeholder={t.yourName ?? "Your Name"}
              className="w-full rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
              autoFocus
              {...animationVariants.inputField}
            />
          ) : (
            <motion.div
              className="w-full rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white cursor-pointer hover:bg-white/15 transition-colors"
              onClick={() => setIsEditing(true)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex justify-between items-center">
                <span className="truncate">
                  {nickname || t.yourName || "Your Name"}
                </span>
                {authUser && (
                  <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded-lg">
                    Click to edit
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>
        {authUser && (
          <p className="text-white/60 text-xs">Logged in as {authUser.email}</p>
        )}
      </div>
    </div>
  );
};

const PasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  roomCode: string;
  error?: string;
}> = ({ isOpen, onClose, onSubmit, roomCode, error }) => {
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    onSubmit(password);
    setPassword("");
  };

  if (!isOpen) return null;

  return (
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
          This room is password protected. Please enter the password to join.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter room password"
          className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all mb-4"
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              setPassword("");
            }}
            className="flex-1 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#FF7A47] transition-colors"
          >
            Join Room
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const QuizAttackStart: React.FC<QuizAttackStartProps> = ({
  initialNickname = "",
  initialRoomCode,
}) => {
  const { t } = useI18n();
  const { containerVariants, slideInLeft, slideInRight, scaleIn, fadeUp } =
    useEnhancedAnimations();
  const { roomCode, updateRoomCode, generateRoomCode } =
    useRoomCode(initialRoomCode);
  const { copied, copyToClipboard } = useClipboard();
  const { isMobileMenuOpen, toggleMobileMenu } = useResponsiveLayout();
  const {
    authUser,
    isAuthModalOpen,
    isCheckingAuth,
    openAuthModal,
    closeAuthModal,
    handleAuthSuccess,
    handleSignOut,
    refreshUserData,
  } = useAuthentication();
  const {
    avatarConfig,
    avatarKey,
    isAvatarModalOpen,
    showAvatarHint,
    openAvatarModal,
    closeAvatarModal,
    handleAvatarSave,
  } = useAvatar(authUser, refreshUserData);
  const router = useRouter();

  const [mounted, setMounted] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>(
    initialNickname || authUser?.name || ""
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
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    roomCode: string;
    error: string;
  }>({ isOpen: false, roomCode: "", error: "" });

  useEffect(() => {
    if (authUser) {
      setNickname(authUser.name);
    } else if (!initialNickname) {
      const playerData = loadFromLocalStorage<PlayerData | null>(
        LOCAL_STORAGE_KEYS.PLAYER_DATA,
        null
      );
      const savedNickname = playerData?.player?.nickname;
      if (savedNickname) {
        setNickname(savedNickname);
      }
    }
  }, [authUser, initialNickname]);

  useEffect(() => {
    const savedSettings = loadRoomSettings();
    if (savedSettings) {
      if (!initialRoomCode || savedSettings.roomCode === initialRoomCode) {
        if (savedSettings.password) {
          setRoomPassword(savedSettings.password);
          setIsPasswordProtected(true);
        }
      }
    }
  }, [initialRoomCode]);

  useEffect(() => {
    const playerData = loadFromLocalStorage<PlayerData | null>(
      LOCAL_STORAGE_KEYS.PLAYER_DATA,
      null
    );

    if (playerData?.currentRoomCode) {
      console.log("Last room code:", playerData.currentRoomCode);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateNickname = useCallback((nickname: string): boolean => {
    return nickname.trim().length > 0;
  }, []);

  const validateRoomCode = useCallback((code: string): boolean => {
    return code.trim().length === ROOM_CODE_LENGTH;
  }, []);

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

  const handleNicknameUpdate = useCallback(
    async (newNickname: string) => {
      if (!authUser) return;

      try {
        await DatabaseService.updateUserProfile(authUser.id, {
          name: newNickname,
        });
        await refreshUserData();
      } catch (error) {
        console.error("Failed to update nickname in database:", error);
      }
    },
    [authUser, refreshUserData]
  );

  const proceedWithJoin = async (roomCodeToJoin: string, password?: string) => {
    setIsJoining(true);
    const currentNickname = authUser ? authUser.name : nickname;

    try {
      const player = createPlayerData(
        currentNickname,
        avatarConfig,
        false,
        roomCodeToJoin,
        authUser ?? undefined
      );

      savePlayerData(
        player,
        avatarConfig,
        roomCodeToJoin,
        loadFromLocalStorage<PlayerData | null>(
          LOCAL_STORAGE_KEYS.PLAYER_DATA,
          null
        )?.roomSettings,
        authUser ?? undefined
      );

      await DatabaseService.joinRoom(roomCodeToJoin, player);

      if (password) {
        saveRoomSettings({
          roomCode: roomCodeToJoin,
          password,
          gameModeId: null,
          quizPackId: null,
          createdAt: Date.now(),
        });
      }

      router.push(`/lobby/${roomCodeToJoin}`);
    } catch (error) {
      console.error("Failed to join room:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to join room. Please check the room code and try again."
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = useCallback(async () => {
    const currentNickname = authUser ? authUser.name : nickname;

    if (!validateNickname(currentNickname)) {
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
        currentNickname,
        avatarConfig,
        true,
        roomCode,
        authUser ?? undefined
      );

      savePlayerData(
        player,
        avatarConfig,
        roomCode,
        loadFromLocalStorage<PlayerData | null>(
          LOCAL_STORAGE_KEYS.PLAYER_DATA,
          null
        )?.roomSettings,
        authUser ?? undefined
      );

      await DatabaseService.createRoom(
        roomCode,
        player,
        selectedGameMode,
        selectedPack,
        isPasswordProtected && roomPassword ? roomPassword : null
      );

      if (isPasswordProtected && roomPassword) {
        saveRoomSettings({
          roomCode,
          password: roomPassword,
          gameModeId: selectedGameMode?.id ?? null,
          quizPackId: selectedPack?.id ?? null,
          createdAt: Date.now(),
        });
      }

      router.push(`/lobby/${roomCode}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create room. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  }, [
    authUser,
    nickname,
    roomCode,
    avatarConfig,
    selectedGameMode,
    selectedPack,
    isPasswordProtected,
    roomPassword,
    router,
    validateNickname,
    validateRoomCode,
  ]);

  const handleJoinRoom = useCallback(async () => {
    const currentNickname = authUser ? authUser.name : nickname;

    if (!validateNickname(currentNickname)) {
      alert("Please enter your nickname");
      return;
    }

    if (!validateRoomCode(joinCode)) {
      alert("Please enter a valid room code");
      return;
    }

    const savedSettings = loadRoomSettings();
    if (savedSettings?.roomCode === joinCode && savedSettings.password) {
      const isValid = await DatabaseService.verifyRoomPassword(
        joinCode,
        savedSettings.password
      );
      if (isValid) {
        await proceedWithJoin(joinCode, savedSettings.password);
        return;
      }
    }

    const roomPassword = await DatabaseService.getRoomPassword(joinCode);
    if (roomPassword) {
      setPasswordModal({ isOpen: true, roomCode: joinCode, error: "" });
      return;
    }

    await proceedWithJoin(joinCode);
  }, [authUser, nickname, joinCode, validateNickname, validateRoomCode]);

  const handlePasswordSubmit = async (password: string) => {
    try {
      const isValid = await DatabaseService.verifyRoomPassword(
        passwordModal.roomCode,
        password
      );
      if (isValid) {
        setPasswordModal({ isOpen: false, roomCode: "", error: "" });
        await proceedWithJoin(passwordModal.roomCode, password);
      } else {
        setPasswordModal((prev) => ({ ...prev, error: "Incorrect password" }));
      }
    } catch (error) {
      setPasswordModal((prev) => ({
        ...prev,
        error: "Failed to verify password",
      }));
    }
  };

  if (!mounted || isCheckingAuth) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full font-sans flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Header />
      </div>
      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onAuthSuccess={handleAuthSuccess}
      />
      <AvatarCustomModal
        isOpen={isAvatarModalOpen}
        onClose={closeAvatarModal}
        avatarConfig={avatarConfig}
        setAvatarConfig={(value: React.SetStateAction<AvatarFullConfig>) => {
          const newConfig =
            typeof value === "function" ? value(avatarConfig) : value;
          handleAvatarSave(newConfig);
        }}
      />
      <PasswordModal
        isOpen={passwordModal.isOpen}
        onClose={() =>
          setPasswordModal({ isOpen: false, roomCode: "", error: "" })
        }
        onSubmit={handlePasswordSubmit}
        roomCode={passwordModal.roomCode}
        error={passwordModal.error}
      />
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full max-w-7xl grid grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-12 lg:mt-0"
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
            {/* Auth Section */}
            <AuthSection
              authUser={authUser}
              onSignIn={openAuthModal}
              onSignOut={handleSignOut}
            />

            {/* User Profile */}
            <motion.div variants={fadeUp}>
              <UserProfile
                nickname={nickname}
                onNicknameChange={handleNicknameChange}
                onNicknameUpdate={handleNicknameUpdate}
                avatarConfig={avatarConfig}
                avatarKey={avatarKey}
                showAvatarHint={showAvatarHint}
                onAvatarClick={openAvatarModal}
                authUser={authUser}
                t={t}
              />
            </motion.div>

            {/* Create Room */}
            <div className="mb-4 lg:mb-6 space-y-2">
              <label className="block text-sm font-medium text-[#EAEAEA]">
                {t.createRoom ?? "Create Room"}
              </label>
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-2">
                <motion.div
                  className="flex-1 relative"
                  whileHover={{ scale: 1.01 }}
                >
                  <motion.input
                    value={roomCode}
                    onChange={(e) => updateRoomCode(e.target.value)}
                    placeholder={t.roomCodePlaceholder ?? "Enter room code"}
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
                  {isCreating ? "Creating..." : t.create ?? "Create"}
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
                  {t.setPassword ?? "Set Password"}
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
                      placeholder={t.roomPassword ?? "Room Password"}
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
                {t.joinRoom ?? "Join Room"}
              </label>
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <motion.input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={t.enterRoomCode ?? "Enter room code"}
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
                  {isJoining ? "Joining..." : t.join ?? "Join"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.section>
      </motion.main>
      f
    </div>
  );
};

export default QuizAttackStart;
