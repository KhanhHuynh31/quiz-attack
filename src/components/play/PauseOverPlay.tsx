import { AnimatePresence, motion } from "framer-motion";
import { FaPlay } from "react-icons/fa";

interface PauseOverlayProps {
  isPaused: boolean;
  pausedBy: string;
  togglePause: () => void;
}

const PauseOverlay: React.FC<PauseOverlayProps> = ({ isPaused, pausedBy, togglePause }) => {
  return (
    <AnimatePresence>
      {isPaused && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur-md"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Trò chơi tạm ngưng</h2>
            <p className="mb-2 text-white/70">Được tạm ngưng bởi: <span className="font-semibold text-white">{pausedBy}</span></p>
            <p className="mb-6 text-white/70">Nhấn nút tiếp tục để tiếp tục chơi</p>
            <button
              onClick={togglePause}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20"
            >
              <FaPlay className="mr-2" /> Tiếp tục
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PauseOverlay;