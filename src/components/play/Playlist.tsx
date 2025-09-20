"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCrown, FaCheck } from "react-icons/fa";
import { Player, ScoreUpdate } from "@/types/type";
import Avatar, { genConfig, AvatarFullConfig } from "react-nice-avatar";

interface PlayerListProps {
  players: Player[];
  scoreUpdates: ScoreUpdate[];
  showLeaderboardAfterAnswer: boolean;
  roundScore: number;
  showLeaderboard: boolean;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  scoreUpdates,
  showLeaderboardAfterAnswer,
  roundScore,
  showLeaderboard,
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Helper function to get avatar content
  const getAvatarContent = (player: Player) => {
    try {
      if (player.avatar?.startsWith("http")) {
        return (
          <img
            src={player.avatar}
            alt="User avatar"
            className="w-full h-full object-cover rounded-full"
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`w-full lg:w-1/4 ${
        showLeaderboard ? "block" : "hidden"
      } md:block overflow-auto p-2`}
    >
      <h2 className="text-xl font-bold text-center mb-3 text-white">
        Bảng xếp hạng
      </h2>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const scoreUpdate = scoreUpdates.find(
            (su) => su.playerId === player.id
          );

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="group flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 shadow-md hover:shadow-lg relative overflow-hidden"
            >
              {/* Player info */}
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                    {getAvatarContent(player)}
                  </div>
                  {player.isHost && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                      <FaCrown className="text-xs text-yellow-800" />
                    </div>
                  )}
                  {player.hasAnswered && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                      <FaCheck className="text-xs text-white" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-sm truncate">
                    {player.nickname}
                  </p>
                </div>
              </div>

              {/* Score and cards */}
              <div className="flex items-center space-x-3 ml-2">
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-1">
                    <span className="text-white text-xs">Điểm:</span>
                    <span className="text-yellow-400 font-bold text-sm">
                      {player.score}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-white text-xs">Thẻ:</span>
                    <span className="text-blue-300 font-bold text-sm">
                      {player.cards}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score update animation */}
              {scoreUpdate && (
                <motion.span
                  className="text-green-400 font-bold absolute right-3 -top-2 text-xs"
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -15, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  +{scoreUpdate.points}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PlayerList;
