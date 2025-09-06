import { Player } from "@/types/type";

interface GameOverProps {
  players: Player[];
  onGoHome: () => void;
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ players, onGoHome, onRestart }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
      <div className="text-center p-8 bg-white/10 rounded-2xl backdrop-blur-md max-w-2xl w-full">
        <h2 className="text-3xl font-bold mb-6">Trò chơi kết thúc!</h2>
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Bảng xếp hạng cuối cùng</h3>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <div key={player.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div className="flex items-center">
                  <span className="font-bold mr-3">{index + 1}.</span>
                  <span>{player.name}</span>
                </div>
                <span className="font-bold">{player.score} điểm</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={onGoHome}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Về lobby
          </button>
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#E55A2B] transition-colors"
          >
            Chơi lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;