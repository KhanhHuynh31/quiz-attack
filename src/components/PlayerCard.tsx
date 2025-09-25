"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCrown, FaUserTimes } from "react-icons/fa";
import { useI18n } from "@/hooks/useI18n";
import { lobbyTranslations } from "@/i18n/translations";
import { Player } from "@/types/type";
import Avatar, { genConfig, AvatarFullConfig } from "react-nice-avatar";

interface PlayerCardProps {
  player: Player;
  onKick?: (id: number) => void;
  index: number;
  showKickButton: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onKick,
  index,
  showKickButton,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { language } = useI18n();
  const t =
    lobbyTranslations[language as keyof typeof lobbyTranslations] ||
    lobbyTranslations.en;

  const getAvatarContent = () => {
    try {
      if (player.avatar?.startsWith("http")) {
        return (
          <img
            src={player.avatar}
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        );
      }

      if (player.avatar?.startsWith("{")) {
        const config = JSON.parse(player.avatar) as AvatarFullConfig;
        return <Avatar className="w-full h-full" {...config} />;
      }

      if (player.avatar) {
        const config = genConfig(player.avatar);
        return <Avatar className="w-full h-full" {...config} />;
      }

      const config = genConfig();
      return <Avatar className="w-full h-full" {...config} />;
    } catch (error) {
      console.error("Error parsing avatar:", error);

      const config = genConfig();
      return <Avatar className="w-full h-full" {...config} />;
    }
  };

  return (
    <motion.div
      initial={{ x: -50, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: -50, opacity: 0, scale: 0.9 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 },
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`flex m-1 items-center justify-between p-4 rounded-xl cursor-pointer overflow-hidden transition-all duration-300 bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/40 border shadow-lg hover:shadow-xl`}
    >
      {/* Animated background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* Glowing border effect on hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: `linear-gradient(45deg, ${
              player.isReady
                ? "rgba(34, 197, 94, 0.3)"
                : "rgba(239, 68, 68, 0.3)"
            }, transparent, ${
              player.isReady
                ? "rgba(34, 197, 94, 0.3)"
                : "rgba(239, 68, 68, 0.3)"
            })`,
            backgroundSize: "300% 300%",
          }}
        />
      )}

      <div className="relative z-10 flex items-center space-x-3">
        <motion.div
          animate={
            isHovered
              ? {
                  scale: 1.2,
                  rotate: [0, -5, 5, 0],
                }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.3 }}
          className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-700"
        >
          {getAvatarContent()}
        </motion.div>

        <div>
          <motion.p
            animate={isHovered ? { x: 5 } : { x: 0 }}
            className="font-bold text-lg"
          >
            {player.nickname}
          </motion.p>
          <motion.div
            className="flex items-center space-x-1"
            animate={isHovered ? { x: 5 } : { x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {player.isHost && (
              <>
                <FaCrown className="text-yellow-400 text-xs z-2000" />
                <span className="text-xs text-yellow-400 font-medium">
                  {t.host}
                </span>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 flex items-center space-x-3">
        {/* Status indicator with pulse animation */}
        <motion.div
          className={`w-4 h-4 rounded-full relative ${
            player.isReady ? "bg-green-500" : "bg-red-500"
          }`}
          animate={
            player.isReady
              ? {
                  boxShadow: [
                    "0 0 0 0 rgba(34, 197, 94, 0.7)",
                    "0 0 0 10px rgba(34, 197, 94, 0)",
                  ],
                }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Kick button with enhanced animation */}
        {showKickButton && !player.isHost && (
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, rotate: 180 }}
                whileHover={{ scale: 1.2, rotate: 15 }}
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onKick?.(player.id);
                }}
                className="text-orange-400 hover:text-orange-300 bg-orange-400/20 p-2 rounded-lg border border-orange-400/30 transition-colors"
                title={t.kickPlayer}
              >
                <FaUserTimes className="text-sm" />
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerCard;
