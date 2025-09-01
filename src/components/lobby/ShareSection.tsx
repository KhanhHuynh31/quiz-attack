// components/lobby/ShareSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaCheck, FaShare, FaQrcode } from 'react-icons/fa';
import { useClipboard } from '@/hooks/useClipboard';

interface ShareSectionProps {
  shareLink: string;
  roomCode: string;
  onShowQRCode: () => void;
  translations: {
    copy: string;
    share: string;
    qrCode: string;
  };
}

export const ShareSection: React.FC<ShareSectionProps> = ({
  shareLink,
  roomCode,
  onShowQRCode,
  translations
}) => {
  const { copied, copyToClipboard } = useClipboard();

  const handleCopyLink = () => copyToClipboard(shareLink);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my Quiz Attack room",
          text: `Join my Quiz Attack room with this code: ${roomCode}`,
          url: shareLink,
        });
      } catch (error) {
        console.error("Share failed:", error);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <motion.div
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
      className="mb-6 flex flex-col md:flex-row items-center gap-4 rounded-2xl border border-white/20 bg-gradient-to-r from-white/5 to-white/10 p-4 text-[#EAEAEA] flex-shrink-0 shadow-lg"
    >
      <div className="flex-1 truncate text-sm font-mono bg-black/20 p-2 rounded-lg w-full text-center md:text-left">
        {shareLink}
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleCopyLink}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all transform border ${
            copied
              ? "bg-green-500/20 border-green-400/50 text-green-300"
              : "bg-white/10 border-white/20 hover:bg-white/20"
          }`}
          title={translations.copy}
          aria-label="Copy room link"
        >
          <motion.div
            animate={
              copied ? { rotate: 360, scale: 1.2 } : { rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.3 }}
          >
            {copied ? <FaCheck /> : <FaCopy />}
          </motion.div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500/20 border-blue-400/50 px-4 py-3 text-sm font-medium hover:bg-blue-500/30 transition-all transform"
          title={translations.share}
          aria-label="Share room"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <FaShare className="text-blue-400" />
          </motion.div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onShowQRCode}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-500/20 border-purple-400/50 px-4 py-3 text-sm font-medium hover:bg-purple-500/30 transition-all transform"
          title={translations.qrCode}
          aria-label="Show QR code"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FaQrcode className="text-purple-400" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
};