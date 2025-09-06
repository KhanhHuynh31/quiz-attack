import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaQuestionCircle } from "react-icons/fa";
import { ActiveCard, Card } from "@/types/type";

interface CardAnimationProps {
  activeCards: ActiveCard[];
  isDrawingCard: boolean;
  drawnCard: Card | null;

}

const CardAnimation: React.FC<CardAnimationProps> = ({
  activeCards,
  isDrawingCard,
  drawnCard,
}) => {
  return (
    <>
      {/* Card usage animation queue */}
      <AnimatePresence>
        {activeCards.map((activeCard, index) => (
          <motion.div
            key={activeCard.id}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 50 + index }}
          >
            <motion.div
              className={`relative w-64 h-80 ${activeCard.card.color} rounded-xl shadow-2xl flex flex-col items-center justify-center text-white p-4 backdrop-blur-md border-2 border-white/20`}
              initial={{ scale: 0.5, rotate: -180, y: 300, x: index * 50 }}
              animate={{ scale: 1, rotate: 0, y: 0, x: index * 20 }}
              exit={{ scale: 1.5, opacity: 0, y: -100 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                delay: index * 0.2 
              }}
            >
              <h3 className="text-2xl font-bold mb-2 text-center">
                {activeCard.card.name}
              </h3>
              <p className="text-center text-sm">{activeCard.card.description}</p>
              <div className="absolute bottom-4 text-sm font-semibold">
                Đã sử dụng thẻ bài
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Card drawing animation */}
      <AnimatePresence>
        {isDrawingCard && drawnCard && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`relative w-64 h-80 ${drawnCard.color} rounded-xl shadow-2xl flex flex-col items-center justify-center text-white p-4 backdrop-blur-md border-2 border-white/20`}
              initial={{ scale: 0.5, x: 200, y: -200, rotate: 360 }}
              animate={{ scale: 1, x: 0, y: 0, rotate: 0 }}
              exit={{ scale: 0.5, x: -200, y: 200, opacity: 0 }}
              transition={{ type: "spring", stiffness: 100, duration: 1 }}
            >
              <h3 className="text-2xl font-bold mb-2 text-center">
                {drawnCard.name}
              </h3>
              <p className="text-center text-sm">{drawnCard.description}</p>
              <div className="absolute bottom-4 text-sm font-semibold">
                Thẻ bài mới!
              </div>
              <motion.div
                className="absolute inset-0 border-4 border-yellow-400 rounded-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      

    </>
  );
};

export default CardAnimation;