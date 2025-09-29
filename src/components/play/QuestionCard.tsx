"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCrown, FaCheck } from "react-icons/fa";
import { GameConfig, GameModifiers, Player, Question, ScoreUpdate } from "@/types/type";
import Avatar, { genConfig, AvatarFullConfig } from "react-nice-avatar";

interface QuestionCardProps {
  showLeaderboardAfterAnswer: boolean;
  timeLeft: number;
  currentQuestion: Question;
  isAnswered: boolean;
  showCorrectAnswer: boolean;
  selectedAnswer: number | null;
  config: GameConfig | null;
  handleAnswerSelect: (index: number) => void;
  players: Player[];
  scoreUpdates: ScoreUpdate[];
  gameModifiers: GameModifiers;
  allPlayersAnswered: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  showLeaderboardAfterAnswer,
  timeLeft,
  currentQuestion,
  isAnswered,
  showCorrectAnswer,
  selectedAnswer,
  config,
  handleAnswerSelect,
  players,
  scoreUpdates,
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getAvatarContent = (player: Player) => {
    try {
      if (player.avatar?.startsWith("{")) {
        const config = JSON.parse(player.avatar) as AvatarFullConfig;
        return <Avatar className="w-full h-full" {...config} />;
      }
    } catch (error) {
      console.error("Error parsing avatar:", error);
      const config = genConfig();
      return <Avatar className="w-full h-full" {...config} />;
    }
  };

  const renderPlayers = () => {
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-center mb-3 text-white">
          Cập nhật điểm số
        </h2>
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

              <div className="flex items-center space-x-3 ml-2">
                <div
                  className={`flex flex-col ${
                    player.cards > 0 ? "items-end" : "items-center"
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span className="text-white text-xs">Điểm:</span>
                    <span className="text-yellow-400 font-bold text-sm">
                      {player.score}
                    </span>
                  </div>

                  <AnimatePresence>
                    {player.cards > 0 && (
                      <motion.div
                        className="flex items-center space-x-1"
                        key="cards"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span className="text-white text-xs">Thẻ:</span>
                        <span className="text-blue-300 font-bold text-sm">
                          {player.cards}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

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
        <p className="text-center mt-4 text-white/60">
          Tiếp tục sau {Math.ceil(timeLeft / 6)} giây...
        </p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        {showLeaderboardAfterAnswer ? (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderPlayers()}
          </motion.div>
        ) : (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-white">
              {currentQuestion.text}
            </h1>

            {currentQuestion.imageUrl && (
              <div className="flex justify-center mb-4 md:mb-6">
                <motion.img
                  src={currentQuestion.imageUrl}
                  alt="Question illustration"
                  className="w-full h-48 object-cover rounded-xl shadow-md border border-white/10"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
            {showCorrectAnswer && config?.gameSettings.showCorrectAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="my-4 p-3 bg-white/10 rounded-xl text-center border border-white/10"
              >
                {selectedAnswer === currentQuestion.correctAnswer ? (
                  <div>
                    <p className="text-green-400 font-bold mb-2">
                      Chính xác! +100 điểm
                    </p>
                    {currentQuestion.explanation && (
                      <p className="text-white/80 text-sm">
                        {currentQuestion.explanation}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-red-400 font-bold mb-2">
                      Sai rồi! Đáp án đúng là:{" "}
                      {currentQuestion.options[currentQuestion.correctAnswer]}
                    </p>
                    {currentQuestion.explanation && (
                      <p className="text-white/80 text-sm">
                        {currentQuestion.explanation}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {currentQuestion.options.map((option, index) => {
                let buttonClass =
                  "bg-white/10 text-white border-2 border-white/10 hover:bg-white/20";

                if (isAnswered || showCorrectAnswer) {
                  if (index === currentQuestion.correctAnswer) {
                    buttonClass =
                      "bg-green-500/20 text-white border-2 border-green-500/30";
                  } else if (
                    index === selectedAnswer &&
                    index !== currentQuestion.correctAnswer
                  ) {
                    buttonClass =
                      "bg-red-500/20 text-white border-2 border-red-500/30";
                  } else if (index === selectedAnswer) {
                    buttonClass =
                      "bg-blue-500/20 text-white border-2 border-blue-500/30";
                  } else {
                    buttonClass =
                      "bg-white/5 text-white/70 border-2 border-white/5";
                  }
                }

                return (
                  <motion.button
                    key={index}
                    className={`p-3 md:p-4 rounded-2xl text-left font-medium transition-all duration-300 ${buttonClass}`}
                    whileHover={
                      !isAnswered && !showCorrectAnswer ? { scale: 1.02 } : {}
                    }
                    whileTap={
                      !isAnswered && !showCorrectAnswer ? { scale: 0.98 } : {}
                    }
                    onClick={() => handleAnswerSelect(index)}
                    disabled={isAnswered || showCorrectAnswer}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestionCard;