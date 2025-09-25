"use client";
import React, { useState, useEffect, JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaQuestionCircle, FaCheck } from "react-icons/fa";
import { GiCardPlay, GiDiceTwentyFacesTwenty } from "react-icons/gi";
import { useI18n } from "@/hooks/useI18n";
import { GameMode } from "@/types/type";
import { GAME_MODES } from "@/data/modeData";

interface GameModeStyle {
  gradient: string;
  icon: JSX.Element;
}

interface GameModeItemProps {
  mode: GameMode;
  style: GameModeStyle;
  isSelected: boolean;
  onSelect: (mode: GameMode) => void;
  t: any;
  index: number;
}

const GameModeItem: React.FC<GameModeItemProps> = ({
  mode,
  style,
  isSelected,
  onSelect,
  t,
  index,
}) => {
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
      onClick={() => onSelect(mode)}
      className={`relative flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all border overflow-hidden ${
        isSelected
          ? `bg-gradient-to-r ${style.gradient} border-orange-500/50 shadow-xl`
          : "bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-white/40"
      }`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3 w-full">
        <motion.div
          animate={
            isHovered
              ? {
                  scale: 1.2,
                  rotate: [0, -10, 10, 0],
                }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.4 }}
          className="flex-shrink-0 p-2 sm:p-3 rounded-lg bg-white/10"
        >
          {style.icon}
        </motion.div>

        <div className="flex-1 min-w-0">
          <motion.h4
            animate={isHovered ? { x: 3 } : { x: 0 }}
            className="font-bold text-base sm:text-lg truncate"
          >
            {mode.name}
          </motion.h4>
          <motion.p
            animate={isHovered ? { x: 3 } : { x: 0 }}
            transition={{ delay: 0.05 }}
            className="text-xs sm:text-sm text-white/70 leading-snug sm:leading-relaxed"
          >
            {mode.description}
          </motion.p>
        </div>

        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex-shrink-0 self-start sm:self-center"
            >
              <FaCheck className="text-white text-lg sm:text-xl drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

interface GameModeSelectorProps {
  selectedMode: GameMode | null;
  onModeSelect: (mode: GameMode) => void;
  title?: string;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  selectedMode,
  onModeSelect,
  title,
}) => {
  const { t } = useI18n();

  const MODE_STYLES: Record<string, GameModeStyle> = {
    classic: {
      icon: <FaQuestionCircle className="text-2xl text-blue-400" />,
      gradient: "from-blue-500/30 to-blue-600/30",
    },
    battle: {
      icon: <GiCardPlay className="text-2xl text-red-400" />,
      gradient: "from-red-500/30 to-red-600/30",
    },
    pve: {
      icon: <GiDiceTwentyFacesTwenty className="text-2xl text-purple-400" />,
      gradient: "from-purple-500/30 to-purple-600/30",
    },
  };

  useEffect(() => {
    if (!selectedMode && GAME_MODES.length > 0) {
      onModeSelect(GAME_MODES[0]);
    }
  }, [selectedMode, onModeSelect]);

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 p-2 sm:p-3 md:p-4">
      {GAME_MODES.map((mode, index) => (
        <GameModeItem
          key={mode.id}
          mode={mode}
          style={MODE_STYLES[mode.mode]}
          isSelected={selectedMode?.mode === mode.mode}
          onSelect={onModeSelect}
          t={t}
          index={index}
        />
      ))}
    </div>
  );
};

export default GameModeSelector;
