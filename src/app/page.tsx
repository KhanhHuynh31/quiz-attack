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
import Link from "next/link";

// Import components
import { Header } from "@/components/home/Header";
import GameModeSelector from "@/components/Selector/GameModeSelector";
import QuizPackSelector from "@/components/Selector/QuizPackSelector";
import AvatarCustomModal from "@/components/home/AvatarCustomModal";

// Import hooks and types
import { useI18n } from "@/hooks/useI18n";
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";
import { QuizPack } from "@/types/type";
import { loadFromLocalStorage, LOCAL_STORAGE_KEYS, saveToLocalStorage } from "@/hooks/useLocalStorage";

// Types
type TabType = "gameMode" | "quizPack";

interface QuizAttackStartProps {
  initialNickname?: string;
  initialRoomCode?: string;
}

// Constants
const ROOM_CODE_LENGTH = 6;
const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const AVATAR_HINT_DURATION = 5000;
const COPY_SUCCESS_DURATION = 1500;
const DESKTOP_BREAKPOINT = 1024;

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

const isDesktop = (): boolean => {
  return typeof window !== "undefined" && window.innerWidth >= DESKTOP_BREAKPOINT;
};


// Custom hooks
const useRoomCode = (initialCode?: string) => {
  const [roomCode, setRoomCode] = useState<string>("");

  const generateRoomCode = useCallback(() => {
    const newCode = generateRandomRoomCode();
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

  // Handle overflow and responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isDesktopView = isDesktop();
            // Control body overflow
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
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  return {
    isMobileMenuOpen,
    toggleMobileMenu,
  };
};

const useAvatar = () => {
  const [avatarConfig, setAvatarConfig] = useState<AvatarFullConfig>(
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.AVATAR_CONFIG, DEFAULT_AVATAR_CONFIG)
  );
  const [customAvatarImage, setCustomAvatarImage] = useState<string | null>(
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.CUSTOM_AVATAR_IMAGE, null)
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [showAvatarHint, setShowAvatarHint] = useState<boolean>(true);

  // Auto-hide avatar hint
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAvatarHint(false);
    }, AVATAR_HINT_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Save avatar config to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.AVATAR_CONFIG, avatarConfig);
  }, [avatarConfig]);

  // Save custom avatar image to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.CUSTOM_AVATAR_IMAGE, customAvatarImage);
  }, [customAvatarImage]);

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
  selectedGameMode: string;
  onGameModeSelect: (mode: string) => void;
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
            className="w-full h-full object-cover"
          />
        ) : (
          <Avatar className="w-full h-full" {...avatarConfig} />
        )}

        {/* Camera icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full">
          <FaEye className="text-white text-lg lg:text-xl" />
        </div>
      </motion.div>

      {/* Avatar Hint */}
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

    {/* Nickname Input */}
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

const CreateRoomSection: React.FC<{
  roomCode: string;
  onRoomCodeChange: (code: string) => void;
  copied: boolean;
  onCopyCode: () => void;
  isPasswordProtected: boolean;
  onPasswordToggle: () => void;
  roomPassword: string;
  onPasswordChange: (password: string) => void;
  t: any;
}> = ({
  roomCode,
  onRoomCodeChange,
  copied,
  onCopyCode,
  isPasswordProtected,
  onPasswordToggle,
  roomPassword,
  onPasswordChange,
  t,
}) => (
  <div className="mb-4 lg:mb-6 space-y-2">
    <label className="block text-sm font-medium text-[#EAEAEA]">
      {t.createRoom}
    </label>
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-2">
      <motion.div className="flex-1 relative" whileHover={{ scale: 1.01 }}>
        <motion.input
          value={roomCode}
          onChange={(e) => onRoomCodeChange(e.target.value)}
          placeholder={t.roomCodePlaceholder}
          className="w-full rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
          whileFocus={{ borderColor: "rgba(255, 107, 53, 0.5)" }}
        />
        <motion.button
          onClick={onCopyCode}
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
      <motion.div {...animationVariants.createButton}>
        <Link
          href={`/lobby/${roomCode}`}
          className="flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl bg-[#FF6B35] px-4 py-2 lg:px-6 lg:py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20 text-sm lg:text-base"
        >
          <motion.div whileHover={{ rotate: 90 }}>
            <FaPlus className="text-xs lg:text-sm" />
          </motion.div>
          {t.create}
        </Link>
      </motion.div>
    </div>

    <motion.div className="flex items-center gap-3">
      <motion.input
        type="checkbox"
        id="password-protection"
        checked={isPasswordProtected}
        onChange={onPasswordToggle}
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
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={t.roomPassword}
            className="w-full rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
            whileFocus={{ scale: 1.02 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const JoinRoomSection: React.FC<{
  joinCode: string;
  onJoinCodeChange: (code: string) => void;
  t: any;
}> = ({ joinCode, onJoinCodeChange, t }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-[#EAEAEA]">
      {t.joinRoom}
    </label>
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
      <motion.input
        value={joinCode}
        onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
        placeholder={t.enterRoomCode}
        className="flex-1 rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
        {...animationVariants.inputField}
      />
      <motion.button
        className="inline-flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl bg-[#FF6B35] px-4 py-2 lg:px-6 lg:py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20 text-sm lg:text-base"
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
        {t.join}
      </motion.button>
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
  const { containerVariants, slideInLeft, slideInRight, scaleIn, fadeUp } = useEnhancedAnimations();
  const { roomCode, updateRoomCode, generateRoomCode } = useRoomCode(initialRoomCode);
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

  // Local state
  const [mounted, setMounted] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>(
    initialNickname || loadFromLocalStorage(LOCAL_STORAGE_KEYS.NICKNAME, "")
  );
  const [joinCode, setJoinCode] = useState<string>("");
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("gameMode");
  const [selectedGameMode, setSelectedGameMode] = useState<string>("classic");
  const [selectedPack, setSelectedPack] = useState<QuizPack | null>(null);

  // Save nickname to localStorage whenever it changes
  useEffect(() => {
    if (nickname.trim()) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.NICKNAME, nickname);
    }
  }, [nickname]);

  // Memoized values
  const translations = useMemo(() => t, [t]);

  // Initialize component
  useEffect(() => {
    setMounted(true);
  }, []);

  // Event handlers
  const handleCopyCode = useCallback(() => {
    copyToClipboard(roomCode);
  }, [copyToClipboard, roomCode]);

  const handlePasswordToggle = useCallback(() => {
    setIsPasswordProtected(prev => !prev);
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleNicknameChange = useCallback((newNickname: string) => {
    setNickname(newNickname);
  }, []);

  // Loading state
  if (!mounted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
    );
  }

  return (
    <div className="relative min-h-screen w-full font-sans flex flex-col overflow-x-hidden">
      <Header />

      {/* Avatar Selection Modal */}
      <AvatarCustomModal
        isOpen={isAvatarModalOpen}
        onClose={closeAvatarModal}
        avatarConfig={avatarConfig}
        setAvatarConfig={setAvatarConfig}
        customAvatarImage={customAvatarImage}
        setCustomAvatarImage={setCustomAvatarImage}
      />

      {/* Main Content */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 mx-auto w-full max-w-7xl grid grid-cols-1 gap-4 px-4 pb-4 lg:grid-cols-12 lg:mt-0"
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
                <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
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
              <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
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
          <motion.div
            className="rounded-2xl lg:rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 lg:p-6 shadow-2xl backdrop-blur-md relative"
            whileHover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
          >
            {/* User Profile */}
            <motion.div variants={fadeUp}>
              <UserProfile
                nickname={nickname}
                onNicknameChange={handleNicknameChange}
                avatarConfig={avatarConfig}
                customAvatarImage={customAvatarImage}
                showAvatarHint={showAvatarHint}
                onAvatarClick={openAvatarModal}
                t={translations}
              />
            </motion.div>

            {/* Create Room */}
            <motion.div variants={fadeUp}>
              <CreateRoomSection
                roomCode={roomCode}
                onRoomCodeChange={updateRoomCode}
                copied={copied}
                onCopyCode={handleCopyCode}
                isPasswordProtected={isPasswordProtected}
                onPasswordToggle={handlePasswordToggle}
                roomPassword={roomPassword}
                onPasswordChange={setRoomPassword}
                t={translations}
              />
            </motion.div>

            {/* Join Room */}
            <motion.div variants={fadeUp}>
              <JoinRoomSection
                joinCode={joinCode}
                onJoinCodeChange={setJoinCode}
                t={translations}
              />
            </motion.div>
          </motion.div>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default QuizAttackStart;