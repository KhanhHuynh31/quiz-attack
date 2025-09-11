import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/types/type";
import { useState, useEffect, useRef } from "react";

interface PlayerHandProps {
  currentPlayerHand: Card[];
  useCard: (card: Card) => void;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ currentPlayerHand, useCard }) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isHandExtended, setIsHandExtended] = useState(false);
  const handRef = useRef<HTMLDivElement>(null);

  // Xử lý click ra ngoài để bỏ chọn thẻ
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (handRef.current && !handRef.current.contains(event.target as Node)) {
        setSelectedCard(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCardClick = (card: Card) => {
    if (selectedCard === card.uniqueId) {
      useCard(card);
      setSelectedCard(null);
    } else {
      setSelectedCard(card.uniqueId || null);
    }
  };

  // Hàm xác định màu nền dựa trên card type
  const getCardStyle = (card: Card) => {
    const baseStyle = "relative w-20 h-28 rounded-xl shadow-2xl flex flex-col items-center justify-center text-white text-xs text-center p-2 cursor-pointer border-2 overflow-hidden card-in-hand";
    
    // Style dựa trên card.type
    const typeStyles: Record<string, string> = {
      offensive: "bg-gradient-to-br from-red-500 to-orange-700 border-red-400 shadow-red-900/50",
      defensive: "bg-gradient-to-br from-blue-500 to-indigo-700 border-blue-400 shadow-blue-900/50",
      boost: "bg-gradient-to-br from-green-500 to-emerald-700 border-green-400 shadow-green-900/50",
      special: "bg-gradient-to-br from-purple-500 to-violet-700 border-purple-400 shadow-purple-900/50"
    };
    
    // Style dựa trên card.color (nếu có)
    const colorStyles: Record<string, string> = {
      red: "bg-gradient-to-br from-red-500 to-rose-700 border-red-400 shadow-red-900/50",
      blue: "bg-gradient-to-br from-blue-500 to-indigo-700 border-blue-400 shadow-blue-900/50",
      green: "bg-gradient-to-br from-emerald-500 to-green-700 border-green-400 shadow-green-900/50",
      yellow: "bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-400 shadow-yellow-900/50",
      purple: "bg-gradient-to-br from-purple-500 to-violet-700 border-purple-400 shadow-purple-900/50"
    };
    
    // Ưu tiên sử dụng type nếu có, nếu không thì dùng color
    const style = card.type ? typeStyles[card.type] || typeStyles.offensive : 
                  card.color ? colorStyles[card.color] || colorStyles.red : 
                  typeStyles.offensive;
    
    return `${baseStyle} ${style}`;
  };


  return (
    <motion.div 
      ref={handRef}
      className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      {/* Hiệu ứng ánh sáng nền */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/30 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="flex flex-col items-center">
        {/* Nút mở rộng thu gọn - Chỉ hiện khi mở rộng */}
       

        {/* Vùng mở rộng khi thu gọn */}
        {!isHandExtended && (
          <motion.div 
            className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 pointer-events-auto z-60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsHandExtended(true)}
          />
        )}

        <motion.div 
          className="flex justify-center gap-2 pointer-events-auto max-w-4xl mx-auto flex-wrap"
          animate={{ y: isHandExtended ? 0 : 60 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <AnimatePresence>
            {currentPlayerHand.map((card, index) => {
              const cardStyle = getCardStyle(card);
              
              return (
                <motion.div
                  key={card.uniqueId || `card-${index}`}
                  className={cardStyle}
                  initial={{ scale: 0, opacity: 0, y: 100, rotate: -10 + (index * 5) }}
                  animate={{ 
                    scale: selectedCard === card.uniqueId ? 1.15 : 1,
                    opacity: 1, 
                    y: selectedCard === card.uniqueId ? -40 : 0,
                    rotate: selectedCard === card.uniqueId ? 0 : -5 + (index * 3),
                    zIndex: selectedCard === card.uniqueId ? 50 : index,
                    transition: { delay: index * 0.1 }
                  }}
                  whileHover={{ 
                    y: selectedCard ? -40 : -20, 
                    scale: selectedCard ? 1.15 : 1.1, 
                    rotate: 0,
                    zIndex: 50
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(card)}
                  exit={{ scale: 0, opacity: 0, y: 100, transition: { duration: 0.2 } }}
                  layout
                >
                  {/* Hiệu ứng ánh sáng trên thẻ bài */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                  
                  {/* Hiệu ứng viền sáng khi được chọn */}
                  <motion.div 
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ boxShadow: "inset 0 0 0px 0px rgba(255,255,255,0.5)" }}
                    animate={{ 
                      boxShadow: selectedCard === card.uniqueId 
                        ? "inset 0 0 15px 5px rgba(255,255,255,0.8)" 
                        : "inset 0 0 0px 0px rgba(255,255,255,0.5)" 
                    }}
                    transition={{ duration: 0.3 }}
                  />
                   
                  {/* Nội dung thẻ bài */}
                  <div className="relative z-10 flex flex-col items-center justify-between h-full w-full py-2">
                    <div className="font-bold text-sm mb-1 leading-tight">{card.name.split(" ")[0]}</div>
                    
                    <div className="flex-1 flex items-center">
                      <div className="text-xs leading-tight font-medium">
                        {card.name.split(" ").slice(1).join(" ")}
                      </div>
                    </div>
                    
                    <div className="text-[10px] opacity-80 mt-1">
                      {card.uniqueId?.slice(-4) || ""}
                    </div>
                  </div>

                  {/* Hiệu ứng particles khi chọn thẻ */}
                  {selectedCard === card.uniqueId && (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 rounded-full bg-yellow-400"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ 
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: Math.cos((i * 72) * Math.PI / 180) * 30,
                            y: Math.sin((i * 72) * Math.PI / 180) * 30
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            delay: i * 0.1
                          }}
                        />
                      ))}
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PlayerHand;