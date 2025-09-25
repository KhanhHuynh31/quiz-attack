import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaClock,
  FaSyncAlt,
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { GameSettings } from "@/types/type";
import { useI18n } from "@/hooks/useI18n";
import { lobbyTranslations } from "@/i18n/translations";
import { powerCards } from "@/data/cardData";

interface GameSettingSelectorProps {
  settings: GameSettings;
  onSettingChange: <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => void;
  isQuizMode?: boolean;
}

const TIME_OPTIONS = [10, 20, 30, 60, 120, 180] as const;
const ROUND_OPTIONS = [5, 10, 15, 20] as const;
const TIME_LIMITS = { min: 5, max: 120 } as const;
const ROUND_LIMITS = { min: 1, max: 50 } as const;

const GameSettingSelector: React.FC<GameSettingSelectorProps> = ({
  settings,
  onSettingChange,
  isQuizMode = false,
}) => {
  const { language } = useI18n();
  const t =
    lobbyTranslations[language as keyof typeof lobbyTranslations] ||
    lobbyTranslations.en;

  const [customTimeInput, setCustomTimeInput] = useState(false);
  const [customRoundInput, setCustomRoundInput] = useState(false);
  const [tempCustomTime, setTempCustomTime] = useState(
    settings.timePerQuestion.toString()
  );
  const [tempCustomRounds, setTempCustomRounds] = useState(
    settings.numberOfQuestion.toString()
  );
  const [selectedCardType, setSelectedCardType] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);

  const allCardIds = useMemo(
    () => powerCards.map((card) => card.id.toString()),
    []
  );

  const cardTypes = useMemo(
    () =>
      ["all", ...new Set(powerCards.map((card) => card.type))].filter(
        Boolean
      ) as string[],
    []
  );

  const filteredCards = useMemo(
    () =>
      selectedCardType === "all"
        ? powerCards
        : powerCards.filter((card) => card.type === selectedCardType),
    [selectedCardType]
  );

  const effectiveAllowedCards = useMemo(() => {
    if (isQuizMode) return [];

    if (!settings.allowedCards || settings.allowedCards.length === 0) {
      return allCardIds;
    }

    return settings.allowedCards.map((card) => card.toString());
  }, [settings.allowedCards, allCardIds, isQuizMode]);

  useEffect(() => {
    if (
      !isQuizMode &&
      (!settings.allowedCards || settings.allowedCards.length === 0)
    ) {
      onSettingChange("allowedCards", allCardIds);
    }
  }, [allCardIds, onSettingChange, settings.allowedCards, isQuizMode]);

  useEffect(() => {
    setTempCustomTime(settings.timePerQuestion.toString());
    setTempCustomRounds(settings.numberOfQuestion.toString());
  }, [settings.timePerQuestion, settings.numberOfQuestion]);

  const handleCustomTimeSubmit = useCallback(() => {
    const timeValue = parseInt(tempCustomTime);
    if (timeValue >= TIME_LIMITS.min && timeValue <= TIME_LIMITS.max) {
      onSettingChange("timePerQuestion", timeValue);
      setCustomTimeInput(false);
    }
  }, [tempCustomTime, onSettingChange]);

  const handleCustomRoundsSubmit = useCallback(() => {
    const roundsValue = parseInt(tempCustomRounds);
    if (roundsValue >= ROUND_LIMITS.min && roundsValue <= ROUND_LIMITS.max) {
      onSettingChange("numberOfQuestion", roundsValue);
      setCustomRoundInput(false);
    }
  }, [tempCustomRounds, onSettingChange]);

  const handleCardToggle = useCallback(
    (cardId: string) => {
      const currentCards = effectiveAllowedCards;
      const isCurrentlySelected = currentCards.includes(cardId);

      let newCards: string[];

      if (isCurrentlySelected) {
        newCards = currentCards.filter((c) => c !== cardId);
        if (newCards.length === 0) {
          return;
        }
      } else {
        newCards = [...currentCards, cardId];
      }

      onSettingChange("allowedCards", newCards);
    },
    [effectiveAllowedCards, onSettingChange]
  );

  const isCardSelected = useCallback(
    (cardId: string) => effectiveAllowedCards.includes(cardId.toString()),
    [effectiveAllowedCards]
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
        className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-2xl p-5 border border-white/10 shadow-lg"
      >
        <label className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
            >
              <FaClock className="text-blue-400 text-xl" />
            </motion.div>
            <span className="font-semibold text-white">
              {t.timePerQuestion}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm font-bold">
              {settings.timePerQuestion}s
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCustomTimeInput(!customTimeInput)}
              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
              aria-label="Edit custom time"
            >
              <FaEdit />
            </motion.button>
          </div>
        </label>

        <AnimatePresence>
          {customTimeInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center space-x-2"
            >
              <input
                type="number"
                min={TIME_LIMITS.min}
                max={TIME_LIMITS.max}
                value={tempCustomTime}
                onChange={(e) => setTempCustomTime(e.target.value)}
                className="flex-1 bg-blue-900/50 border border-blue-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter custom time (${TIME_LIMITS.min}-${TIME_LIMITS.max}s)`}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleCustomTimeSubmit()
                }
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCustomTimeSubmit}
                className="p-2 bg-blue-700 rounded-lg text-white"
                aria-label="Confirm custom time"
              >
                <FaCheck />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCustomTimeInput(false)}
                className="p-2 bg-red-700 rounded-lg text-white"
                aria-label="Cancel custom time"
              >
                <FaTimes />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-2">
          {TIME_OPTIONS.map((time) => (
            <motion.button
              key={time}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 8px rgb(59, 130, 246)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSettingChange("timePerQuestion", time)}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                settings.timePerQuestion === time
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {time}s
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-5 border border-white/10 shadow-lg"
      >
        <label className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <FaSyncAlt className="text-green-400 text-xl" />
            </motion.div>
            <span className="font-semibold text-white">
              {t.numberOfQuestion}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm font-bold">
              {settings.numberOfQuestion}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCustomRoundInput(!customRoundInput)}
              className="p-1 text-green-400 hover:text-green-300 transition-colors"
              aria-label="Edit custom rounds"
            >
              <FaEdit />
            </motion.button>
          </div>
        </label>

        <AnimatePresence>
          {customRoundInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center space-x-2"
            >
              <input
                type="number"
                min={ROUND_LIMITS.min}
                max={ROUND_LIMITS.max}
                value={tempCustomRounds}
                onChange={(e) => setTempCustomRounds(e.target.value)}
                className="flex-1 bg-green-900/50 border border-green-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={`Enter custom rounds (${ROUND_LIMITS.min}-${ROUND_LIMITS.max})`}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleCustomRoundsSubmit()
                }
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCustomRoundsSubmit}
                className="p-2 bg-green-700 rounded-lg text-white"
                aria-label="Confirm custom rounds"
              >
                <FaCheck />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCustomRoundInput(false)}
                className="p-2 bg-red-700 rounded-lg text-white"
                aria-label="Cancel custom rounds"
              >
                <FaTimes />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-2">
          {ROUND_OPTIONS.map((rounds) => (
            <motion.button
              key={rounds}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 8px rgb(34, 197, 94)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSettingChange("numberOfQuestion", rounds)}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                settings.numberOfQuestion === rounds
                  ? "bg-green-600 text-white shadow-lg shadow-green-500/50"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {rounds}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Show Correct Answer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
        className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-5 border border-white/10 shadow-lg"
      >
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{
                scale: settings.showCorrectAnswer ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {settings.showCorrectAnswer ? (
                <FaEye className="text-purple-400 text-xl" />
              ) : (
                <FaEyeSlash className="text-purple-400 text-xl" />
              )}
            </motion.div>
            <span className="font-semibold text-white">
              {t.showCorrectAnswer}
            </span>
          </div>
          <div
            onClick={() =>
              onSettingChange("showCorrectAnswer", !settings.showCorrectAnswer)
            }
            className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all ${
              settings.showCorrectAnswer ? "bg-purple-600" : "bg-gray-700"
            }`}
          >
            <motion.div
              className="bg-white w-5 h-5 rounded-full shadow-md"
              animate={{ x: settings.showCorrectAnswer ? 28 : 0 }}
              transition={{ type: "spring", stiffness: 700, damping: 30 }}
            />
          </div>
        </label>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-white/70 mt-3"
        >
          {settings.showCorrectAnswer ? t.showAnswersDesc : t.hideAnswersDesc}
        </motion.p>
      </motion.div>

      {/* Power Cards Settings - Ẩn khi là Quiz Mode */}
      {!isQuizMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 rounded-2xl p-5 border border-white/10 shadow-lg"
        >
          <div className="flex justify-between flex-wrap items-center mb-4 gap-2">
            <h4 className="font-semibold text-white flex items-center space-x-3">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
              >
                🃏
              </motion.span>
              <span>{t.powerCards}</span>
              <span className="text-amber-400 text-sm pr-2">
                ({effectiveAllowedCards.length}/{allCardIds.length})
              </span>
            </h4>

            <div className="flex items-center space-x-2">
              {/* Card Type Filter */}
              <div className="relative w-full sm:w-64 max-w-full">
                <select
                  value={selectedCardType}
                  onChange={(e) => setSelectedCardType(e.target.value)}
                  onFocus={() => setIsOpen(true)}
                  onBlur={() => setIsOpen(false)}
                  className="
                            w-full
                            bg-amber-800/50 border border-amber-700
                            rounded-lg p-2 pr-8
                            text-white text-sm
                            focus:outline-none focus:ring-2 focus:ring-amber-500
                            appearance-none
                          "
                >
                  {cardTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "all"
                        ? "All Types"
                        : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>

                {/* Arrow icon với motion */}
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                  <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 250, damping: 20 }}
                    className="w-4 h-4 fill-current text-amber-400"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </motion.svg>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/70 mb-4">{t.powerCardsDesc}</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCardType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {filteredCards.map((card, index) => {
                const isEnabled = isCardSelected(card.id.toString());
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100,
                    }}
                    whileHover={{ y: -5 }}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                      isEnabled
                        ? `bg-gradient-to-r ${card.color} border-transparent shadow-lg`
                        : "bg-gray-800/50 border-gray-700 opacity-70"
                    }`}
                    onClick={() => handleCardToggle(card.id.toString())}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xl">{card.emoji}</span>
                          <span
                            className={`font-semibold ${
                              isEnabled ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {card.name}
                          </span>
                        </div>
                        <p
                          className={`text-xs ${
                            isEnabled ? "text-white/90" : "text-gray-500"
                          } mb-1`}
                        >
                          {card.description}
                        </p>
                        {card.value && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              isEnabled
                                ? "bg-black/20 text-white"
                                : "bg-gray-700/50 text-gray-400"
                            }`}
                          >
                            Value: {card.value}
                          </span>
                        )}
                      </div>

                      {/* Checkmark indicator */}
                      <motion.div
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ml-2 ${
                          isEnabled ? "bg-white" : "bg-gray-600"
                        }`}
                        animate={{ scale: isEnabled ? [0.8, 1.1, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {isEnabled && (
                          <motion.svg
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="w-3 h-3 text-indigo-600"
                            viewBox="0 0 12 10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M1 5L4 8L11 1" />
                          </motion.svg>
                        )}
                      </motion.div>
                    </div>

                    {/* Hover effect */}
                    <motion.div
                      className="absolute inset-0 bg-white/10 opacity-0"
                      whileHover={{ opacity: 0.2 }}
                    />

                    {/* Type badge */}
                    <div
                      className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full ${
                        isEnabled
                          ? "bg-black/30 text-white/90"
                          : "bg-gray-700/70 text-gray-400"
                      }`}
                    >
                      {card.type || "unknown"}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default GameSettingSelector;
