import { AnimatePresence, motion } from "framer-motion";
import { ExtendedGameConfig } from "@/types/type";

interface ConfigViewerProps {
  showConfig: boolean;
  config: ExtendedGameConfig | null;
  toggleConfigView: () => void;
}

const ConfigViewer: React.FC<ConfigViewerProps> = ({ showConfig, config, toggleConfigView }) => {
  return (
    <AnimatePresence>
      {showConfig && config && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur-md max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Cấu hình trò chơi</h2>
            <div className="text-left text-sm text-white/80 bg-black/30 p-4 rounded-xl overflow-auto">
              <pre>{JSON.stringify(config, null, 2)}</pre>
            </div>
            <button
              onClick={toggleConfigView}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20"
            >
              Đóng
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfigViewer;