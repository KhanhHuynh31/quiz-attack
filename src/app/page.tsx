"use client";
import React, { useState, useCallback, useEffect } from "react";
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
import { useI18n } from "@/hooks/useI18n";
import { Header } from "@/components/home/Header";
import GameModeSelector from "@/components/home/GameModeSelector";
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";
import QuizPackSelector, { QuizPack } from "@/components/home/QuizPackSelector";
import AvatarCustomModal from "@/components/AvatarCustomModal";

const QuizAttackStart = () => {
  const { t } = useI18n();
  const [nickname, setNickname] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [isPasswordProtected, setIsPasswordProtected] =
    useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { containerVariants, slideInLeft, slideInRight, scaleIn, fadeUp } =
    useEnhancedAnimations();

  // State for tab management
  const [activeTab, setActiveTab] = useState<string>("gameMode");

  // Avatar states
  const [avatarConfig, setAvatarConfig] = useState<AvatarFullConfig>(
    genConfig()
  );
  const [customAvatarImage, setCustomAvatarImage] = useState<string | null>(
    null
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showAvatarHint, setShowAvatarHint] = useState(true);

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

  // Initialize and prevent initial render issues
  useEffect(() => {
    setRoomCode(generateRoomCode());
    setMounted(true);
  }, [generateRoomCode]);

  // Ngăn scroll chỉ trên desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "unset";
    };
  }, []);

  // Auto-close mobile menu when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-hide avatar hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAvatarHint(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [roomCode]);

  const [selectedGameMode, setSelectedGameMode] = useState("classic");
  const [selectedPack, setSelectedPack] = useState<QuizPack | null>(null);

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
    );
  }

  return (
    <div className="relative min-h-screen w-full font-sans flex flex-col">
      <Header />

      {/* Avatar Selection Modal */}
      <AvatarCustomModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
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
        <motion.div variants={fadeUp} className="lg:hidden ">
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-white/20 text-white shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:hidden space-y-4"
            >
              <motion.div
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-xl"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Tab Navigation for Mobile */}
                <div className="flex mb-4 rounded-xl bg-white/5 p-1">
                  <button
                    onClick={() => setActiveTab("gameMode")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "gameMode"
                        ? "bg-[#FF6B35] text-white shadow"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Game Mode
                  </button>
                  <button
                    onClick={() => setActiveTab("quizPack")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "quizPack"
                        ? "bg-[#FF6B35] text-white shadow"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Quiz Packs
                  </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                  {activeTab === "gameMode" ? (
                    <GameModeSelector
                      selectedMode={selectedGameMode}
                      onModeSelect={setSelectedGameMode}
                    />
                  ) : (
                    <QuizPackSelector
                      selectedPack={selectedPack}
                      onPackSelect={setSelectedPack}
                    />
                  )}
                </div>
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
              {/* Tab Navigation for Desktop */}
              <div className="flex mb-4 rounded-xl bg-white/5 p-1">
                <button
                  onClick={() => setActiveTab("gameMode")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "gameMode"
                      ? "bg-[#FF6B35] text-white shadow"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Game Mode
                </button>
                <button
                  onClick={() => setActiveTab("quizPack")}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "quizPack"
                      ? "bg-[#FF6B35] text-white shadow"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Quiz Packs
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {activeTab === "gameMode" ? (
                  <GameModeSelector
                    selectedMode={selectedGameMode}
                    onModeSelect={setSelectedGameMode}
                  />
                ) : (
                  <QuizPackSelector
                    selectedPack={selectedPack}
                    onPackSelect={setSelectedPack}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Main Content Panel */}
        <motion.section variants={slideInRight} className="lg:col-span-8">
          <motion.div
            className="rounded-2xl lg:rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 lg:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden"
            whileHover={{ borderColor: "rgba(255, 255, 255, 0.2)" }}
          >
            {/* User Profile */}
            <div className="flex justify-center items-center gap-4 mb-4">
              <motion.div
                variants={fadeUp}
                className="flex items-center gap-3 lg:gap-4 relative"
              >
                <motion.div
                  className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 cursor-pointer overflow-hidden relative"
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setIsAvatarModalOpen(true)}
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(255, 107, 53, 0.7)",
                      "0 0 0 10px rgba(255, 107, 53, 0)",
                      "0 0 0 0 rgba(255, 107, 53, 0)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: showAvatarHint ? Infinity : 0,
                    repeatDelay: 1,
                  }}
                >
                  {customAvatarImage ? (
                    <img
                      src={customAvatarImage}
                      alt="Avatar"
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
                      className="absolute bottom-3 -left-24  text-white text-sx py-1 px-2 rounded-lg whitespace-nowrap"
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
              <motion.div variants={fadeUp} className="space-y-2" layout>
                <motion.input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t.yourName}
                  className="w-full rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>
            </div>

            {/* Create Room */}
            <motion.div variants={fadeUp} className="mb-4 lg:mb-6 space-y-2">
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
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder={t.roomCodePlaceholder}
                    className="w-full rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
                    whileFocus={{ borderColor: "rgba(255, 107, 53, 0.5)" }}
                  />
                  <motion.button
                    onClick={handleCopyCode}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#EAEAEA] hover:text-white p-1 lg:p-2"
                    whileHover={{ scale: 1.2, color: "#FF6B35" }}
                    whileTap={{ scale: 0.9 }}
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
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
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
                  onChange={() => setIsPasswordProtected(!isPasswordProtected)}
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
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
            </motion.div>

            {/* Join Room */}
            <motion.div variants={fadeUp} className="space-y-2">
              <label className="block text-sm font-medium text-[#EAEAEA]">
                {t.joinRoom}
              </label>
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <motion.input
                  placeholder={t.enterRoomCode}
                  className="flex-1 rounded-xl lg:rounded-2xl border border-white/10 bg-white/10 px-3 py-2 lg:px-4 lg:py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all text-sm lg:text-base"
                  whileFocus={{ scale: 1.02 }}
                  whileHover={{ scale: 1.01 }}
                />
                <motion.button
                  className="inline-flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl bg-[#FF6B35] px-4 py-2 lg:px-6 lg:py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20 text-sm lg:text-base"
                  whileHover={{ scale: 1.05, backgroundColor: "#FF7A47" }}
                  whileTap={{ scale: 0.95 }}
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
            </motion.div>
          </motion.div>
        </motion.section>
      </motion.main>
    </div>
  );
};
export default QuizAttackStart;
