import { ExtendedGameConfig } from "@/types/type";
import { motion } from "framer-motion";
import { FaHome, FaPause, FaPlay, FaClock } from "react-icons/fa";

interface TimerProps {
  timeLeft: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  isPaused: boolean;
  togglePause: () => void;
  goHome: () => void;
  toggleConfigView: () => void;
  config: ExtendedGameConfig | null;
}

const Timer: React.FC<TimerProps> = ({
  timeLeft,
  currentQuestionIndex,
  totalQuestions,
  isPaused,
  togglePause,
  goHome,
  config
}) => {
  if (!config) return null;
  
  const timePerQuestion = config.gameSettings.timePerQuestion;
  const progress = (timeLeft / timePerQuestion) * 100;

  return (
    <motion.div 
      className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 mb-4 shadow-xl shadow-black/30 backdrop-blur-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-2">
            <button
              onClick={goHome}
              className="flex items-center p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              title="Về trang chủ"
            >
              <FaHome className="text-xl" />
            </button>

          </div>
          
          <div className="flex items-center">
            <FaClock className="text-[#FF6B35] mr-2" />
            <span className="text-lg font-bold text-white">{timeLeft}s</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-lg font-bold mr-2 text-white">Câu {currentQuestionIndex + 1}/{totalQuestions}</span>
            <button
              onClick={togglePause}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              title={isPaused ? "Tiếp tục" : "Tạm dừng"}
            >
              {isPaused ? (
                <FaPlay className="text-xl" />
              ) : (
                <FaPause className="text-xl" />
              )}
            </button>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            key={`timer-${currentQuestionIndex}-${timeLeft}`}
            className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
            initial={{ width: `${progress}%` }}
            animate={{ width: `${progress - (100/timePerQuestion)}%` }}
            transition={{ 
              duration: 1, 
              ease: "linear",
              repeat: 0
            }}
            style={{ 
              width: `${progress}%`,
              minWidth: timeLeft <= 0 ? '0%' : undefined
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Timer;