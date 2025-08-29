"use client";
import React, { useState, useCallback, JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaQuestionCircle, FaGamepad, FaCheck } from "react-icons/fa";
import { GiCardPlay, GiDiceTwentyFacesTwenty } from "react-icons/gi";
import { useI18n } from "@/hooks/useI18n";

// Types
interface GameMode {
  key: string;
  icon: JSX.Element;
  gradient: string;
}

interface GameModeItemProps {
  mode: GameMode;
  isSelected: boolean;
  onSelect: (modeKey: string) => void;
  t: any;
  index: number;
}

// Enhanced Game Mode Item Component
const GameModeItem: React.FC<GameModeItemProps> = ({
  mode,
  isSelected,
  onSelect,
  t,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Lấy thông tin mode từ translations
  const modeInfo = t.modes?.[mode.key as keyof typeof t.modes];

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
      className={`relative flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all border overflow-hidden ${
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
            {modeInfo?.title || mode.key}
          </motion.h4>
          <motion.p
            animate={isHovered ? { x: 5 } : { x: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm text-white/70 leading-relaxed"
          >
            {modeInfo?.desc || ""}
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

// Main Game Mode Selector Component
interface GameModeSelectorProps {
  selectedMode: string;
  onModeSelect: (mode: string) => void;
  title?: string;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  selectedMode,
  onModeSelect,
  title,
}) => {
  const { t } = useI18n();

  // Game modes configuration with react-icons
  const MODES: GameMode[] = [
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
  ];

  return (
      <div className="space-y-4 p-3">
        {MODES.map((mode, index) => (
          <GameModeItem
            key={mode.key}
            mode={mode}
            isSelected={selectedMode === mode.key}
            onSelect={onModeSelect}
            t={t}
            index={index}
          />
        ))}
      </div>
  );
};

export default GameModeSelector;