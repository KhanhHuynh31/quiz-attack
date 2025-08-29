import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { FaTimes } from "react-icons/fa";

// QR Code Modal Component with enhanced animations
export const QRCodeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  shareLink: string;
}> = ({ isOpen, onClose, shareLink }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotateX: -15 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotateX: 15 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative max-w-md w-full bg-gradient-to-br from-[#2B2D42] to-[#1a1b3a] rounded-3xl border border-white/20 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 text-[#EAEAEA] hover:text-white transition-colors"
          >
            <FaTimes />
          </motion.button>
          <motion.h3
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-bold text-white mb-4 text-center"
          >
            QR Code
          </motion.h3>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-4"
          >
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <QRCodeSVG value={shareLink} size={200} />
            </div>
          </motion.div>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[#EAEAEA] text-sm text-center"
          >
            Scan this QR code to join the room
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};