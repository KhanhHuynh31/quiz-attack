"use client";
import React, { useState, JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBook, FaPlus, FaCheck } from "react-icons/fa";

// Types
export interface QuizPack {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  category: string;
}

interface QuizPackItemProps {
  pack: QuizPack;
  isSelected: boolean;
  onSelect: (pack: QuizPack) => void;
  index: number;
}

// Default quiz packs data
const DEFAULT_QUIZ_PACKS: QuizPack[] = [
  {
    id: "general",
    name: "General Knowledge",
    description: "Mixed topics for everyone",
    questionCount: 500,
    category: "General",
  },
  {
    id: "science",
    name: "Science & Technology",
    description: "Physics, chemistry, biology, IT",
    questionCount: 300,
    category: "Science",
  },
  {
    id: "history",
    name: "World History",
    description: "Historical events and figures",
    questionCount: 250,
    category: "History",
  },
  {
    id: "sports",
    name: "Sports & Games",
    description: "Sports trivia and gaming",
    questionCount: 200,
    category: "Sports",
  },
  {
    id: "entertainment",
    name: "Movies & Music",
    description: "Pop culture entertainment",
    questionCount: 350,
    category: "Entertainment",
  },
  {
    id: "geography",
    name: "World Geography",
    description: "Countries, capitals, landmarks",
    questionCount: 180,
    category: "Geography",
  },
];

// QuizPackItem Component với animation tương tự GameModeItem
const QuizPackItem: React.FC<QuizPackItemProps> = ({
  pack,
  isSelected,
  onSelect,
  index,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 150 }}
      whileHover={{
        scale: 1.03,
        y: -5,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(pack)}
      className={`relative p-4 rounded-xl cursor-pointer transition-all border overflow-hidden ${
        isSelected
          ? "bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/50 shadow-lg"
          : "bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-white/30"
      }`}
    >
      {/* Animated background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: isHovered ? "100%" : "-100%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <motion.h4
            animate={isHovered ? { x: 3 } : { x: 0 }}
            className="font-bold text-sm"
          >
            {pack.name}
          </motion.h4>
          <motion.div
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            className="flex items-center space-x-1"
          >
            <FaBook className="text-xs text-blue-400" />
            <span className="text-xs font-mono text-white/80">
              {pack.questionCount}
            </span>
          </motion.div>
        </div>

        <motion.p
          animate={isHovered ? { x: 3 } : { x: 0 }}
          transition={{ delay: 0.05 }}
          className="text-xs text-white/70 mb-3 leading-relaxed"
        >
          {pack.description}
        </motion.p>

        <div className="flex items-center justify-between">
          <motion.span
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            className="text-xs px-3 py-1 rounded-full font-medium bg-gradient-to-r from-white/10 to-white/5 text-white/80"
          >
            {pack.category}
          </motion.span>

          <AnimatePresence>
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaCheck className="text-purple-400 text-lg drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// SelectedPackDisplay Component
const SelectedPackDisplay: React.FC<{
  selectedPack: QuizPack | null;
}> = ({ selectedPack }) => {
  if (!selectedPack) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/40 flex-shrink-0 shadow-lg"
    >
      <div className="flex items-center space-x-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <FaBook className="text-purple-400 text-lg" />
        </motion.div>
        <div>
          <span className="text-sm font-bold">Selected Pack:</span>
          <p className="text-sm font-medium">{selectedPack.name}</p>
          <p className="text-xs text-purple-300">{selectedPack.questionCount} questions</p>
        </div>
      </div>
    </motion.div>
  );
};

// Main QuizPackSelector Component
interface QuizPackSelectorProps {
  selectedPack: QuizPack | null;
  onPackSelect: (pack: QuizPack | null) => void;
}

export const QuizPackSelector: React.FC<QuizPackSelectorProps> = ({
  selectedPack,
  onPackSelect,
}) => {
  const handleSelectPack = (pack: QuizPack) => {
    const newSelection = selectedPack?.id === pack.id ? null : pack;
    onPackSelect(newSelection);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Quiz Packs List */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-3 pr-2 mb-6"
      >
        {DEFAULT_QUIZ_PACKS.map((pack, index) => (
          <QuizPackItem
            key={pack.id}
            pack={pack}
            isSelected={selectedPack?.id === pack.id}
            onSelect={handleSelectPack}
            index={index}
          />
        ))}
      </motion.div>

      {/* Add Pack Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="w-full bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 px-4 py-3 rounded-xl border border-green-500/50 transition-all font-medium shadow-lg flex items-center justify-center space-x-2 text-white"
      >
        <FaPlus className="text-green-400" />
        <span>Add Custom Pack</span>
      </motion.button>

    </motion.div>
  );
};

export default QuizPackSelector;