// File: QuizPackSelector.tsx
"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBook, FaPlus, FaCheck } from "react-icons/fa";
import Link from "next/link";
import { QuizPack } from "@/types/type";
import { supabase } from "@/lib/supabaseClient";

interface QuizPackItemProps {
  pack: QuizPack;
  isSelected: boolean;
  onSelect: (pack: QuizPack) => void;
  index: number;
}

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
      className={`relative p-3 rounded-xl cursor-pointer transition-all border overflow-hidden ${
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

          <div className="flex items-center gap-2">
            <span className={`text-xs ${
              pack.author === "official" ? "text-yellow-400" : "text-blue-400"
            }`}>
              {pack.author === "official" ? "Chính thức" : pack.author || "Cộng đồng"}
            </span>
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
      </div>
    </motion.div>
  );
};

// Main QuizPackSelector Component
interface QuizPackSelectorProps {
  selectedPack: QuizPack | null;
  onPackSelect: (pack: QuizPack) => void;
  customPacks?: QuizPack[];
}

export const QuizPackSelector: React.FC<QuizPackSelectorProps> = ({
  selectedPack,
  onPackSelect,
  customPacks = [],
}) => {
  const [dbPacks, setDbPacks] = useState<QuizPack[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch quiz packs từ database
  const fetchQuizPacks = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Lấy danh sách quiz packs từ database
      const { data: packsData, error: packsError } = await supabase
        .from("quiz_packs")
        .select("*")
        .order("id", { ascending: false });

      if (packsError) throw packsError;

      if (!packsData) {
        setDbPacks([]);
        return;
      }

      // Chuyển đổi dữ liệu từ database sang QuizPack type
      const convertedPacks: QuizPack[] = await Promise.all(
        packsData.map(async (pack) => {
          // Đếm số câu hỏi thực tế cho mỗi pack
          const { count: questionCount, error: countError } = await supabase
            .from("quiz_questions")
            .select("id", { count: "exact" })
            .eq("quiz_pack_id", pack.id);

          if (countError) {
            console.error("Error counting questions:", countError);
          }

          return {
            id: pack.id,
            name: pack.name,
            description: pack.description,
            category: pack.category,
            author: pack.author,
            questionCount: questionCount || pack.question_count || 0,
            isHidden: false
          };
        })
      );

      setDbPacks(convertedPacks);
    } catch (error) {
      console.error("Error fetching quiz packs:", error);
      setDbPacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizPacks();
  }, []);

  // Kết hợp dbPacks và customPacks
  const allPacks = [...dbPacks, ...customPacks];

  // Đảm bảo luôn có một pack được chọn mặc định
  useEffect(() => {
    if (!selectedPack && allPacks.length > 0 && !loading) {
      // Ưu tiên chọn pack chính thức đầu tiên, nếu không có thì chọn pack đầu tiên
      const firstOfficialPack = allPacks.find((pack) => pack.author === "official");
      const firstVisiblePack = firstOfficialPack || allPacks.find((pack) => !pack.isHidden);
      
      if (firstVisiblePack) {
        onPackSelect(firstVisiblePack);
      }
    }
  }, [selectedPack, allPacks, loading, onPackSelect]);

  const handleSelectPack = (pack: QuizPack) => {
    if (selectedPack?.id !== pack.id) {
      onPackSelect(pack);
    }
  };

  if (loading) {
    return (
      <div className="max-h-96 overflow-y-auto flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-white/60 text-sm">Đang tải quiz packs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-96 overflow-y-auto"
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
          className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 mb-4"
        >
          {allPacks
            .filter((p) => !p.isHidden)
            .map((pack, index) => (
              <QuizPackItem
                key={pack.id}
                pack={pack}
                isSelected={selectedPack?.id === pack.id}
                onSelect={handleSelectPack}
                index={index}
              />
            ))}
        </motion.div>

        {/* Empty State */}
        {allPacks.filter((p) => !p.isHidden).length === 0 && (
          <div className="text-center py-8">
            <FaBook className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <p className="text-white/60 text-sm">Chưa có quiz pack nào</p>
            <p className="text-white/40 text-xs mt-1">Hãy tạo quiz pack đầu tiên của bạn</p>
          </div>
        )}

        {/* Add Custom Pack Button */}
        <motion.button
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="w-[95%] m-auto bg-gradient-to-r from-green-500/20 to-green-600/20 
             hover:from-green-500/30 hover:to-green-600/30 
             p-3 rounded-xl border border-green-500/50 
             transition-all font-medium shadow-lg 
             flex items-center justify-center text-white"
        >
          <Link
            href="/quiz"
            className="w-auto inline-flex items-center space-x-2 px-3"
          >
            <FaPlus className="text-green-400" />
            <span>Tạo Quiz Pack Mới</span>
          </Link>
        </motion.button>
      </motion.div>
    </>
  );
};

export default QuizPackSelector;