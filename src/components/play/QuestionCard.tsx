import { motion, AnimatePresence } from "framer-motion";
import {
  Question,
  Player,
  ScoreUpdate,
  GameConfig,
  ActiveEffect,
  GameModifiers,
} from "@/types/type";

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
  const renderPlayers = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">
          Cập nhật điểm số
        </h2>
        {sortedPlayers.map((player, index) => {
          const scoreUpdate = scoreUpdates.find(
            (su) => su.playerId === player.id
          );

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg backdrop-blur-md ${
                index === 0
                  ? "bg-yellow-500/20 border-2 border-yellow-400/30"
                  : "bg-white/5 border border-white/10"
              } shadow-xl shadow-black/30 relative overflow-hidden`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white mr-3">
                  {index === 0 ? "👑" : "👤"}
                </div>
                <span className="font-medium text-white">{player.nickname}</span>
              </div>
              <div className="flex items-center">
                <span className="text-white/70 mr-3">{player.cards} cards</span>
                <span className="font-bold text-white">{player.score}</span>
                {scoreUpdate && (
                  <span className="text-green-400 font-bold ml-2">
                    +{scoreUpdate.points}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <p className="text-center mt-6 text-white/60">
          Tiếp tục sau {Math.ceil(timeLeft / 6)} giây...
        </p>
      </div>
    );
  };

  return (
    <motion.div
      className="w-full lg:w-2/4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-md overflow-auto"
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
