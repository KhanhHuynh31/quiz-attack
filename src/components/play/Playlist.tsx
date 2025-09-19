import { motion } from "framer-motion";
import { FaCrown, FaUser, FaCheck } from "react-icons/fa";
import { Player, ScoreUpdate } from "@/types/type";

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
  showLeaderboard
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 }
      }}
      className={`w-full lg:w-1/4 ${showLeaderboard ? "block" : "hidden"} md:block overflow-auto`}
    >
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center mb-4 text-white">Bảng xếp hạng</h2>
        {sortedPlayers.map((player, index) => {
          const scoreUpdate = scoreUpdates.find(su => su.playerId === player.id);
          
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg backdrop-blur-md ${
                index === 0
                  ? "bg-yellow-500/20 border-2 border-yellow-400/30"
                  : "bg-white/5 border border-white/10"
              } shadow-xl shadow-black/30 relative overflow-hidden`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white mr-3 relative">
                  {index === 0 ? (
                    <FaCrown className="text-yellow-300" />
                  ) : (
                    <FaUser />
                  )}
                  {player.hasAnswered && (
                    <FaCheck className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full p-0.5" />
                  )}
                </div>
                <span className="font-medium text-white">{player.nickname}</span>
              </div>
              <div className="flex items-center">
                <span className="text-white/70 mr-3">{player.cards} cards</span>
                {showLeaderboardAfterAnswer && roundScore > 0 && player.id === 1 ? (
                  <div className="flex items-center">
                    <span className="font-bold text-white">{player.score - roundScore}</span>
                    <span className="text-green-400 font-bold mx-2">+{roundScore}</span>
                    <motion.span 
                      className="font-bold text-white"
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ delay: 1, duration: 0.5 }}
                    >
                      = {player.score}
                    </motion.span>
                  </div>
                ) : (
                  <span className="font-bold text-white">{player.score}</span>
                )}
                {scoreUpdate && (
                  <motion.span 
                    className="text-green-400 font-bold absolute right-3 -top-2"
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -20, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                  >
                    +{scoreUpdate.points}
                  </motion.span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PlayerList;