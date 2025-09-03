"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCrown,
  FaUser,
  FaPause,
  FaPlay,
  FaDesktop,
  FaMobile,
  FaClock,
  FaTimes,
  FaCheck,
  FaQuestionCircle,
  FaHome,
  FaInfoCircle,
} from "react-icons/fa";
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";
import { useParams, useRouter } from "next/navigation";
import { ActiveCard, Card, CardUsage, GameConfig, Player, Question, ScoreUpdate } from "@/types/type";
import { PowerCard, powerCards } from "@/data/cardData";

interface LocalStorageQuestion {
  id: string;
  question: string;
  options: string[];
  imageUrl?: string;
  correctAnswer: number;
  explanation: string;
}

interface ExtendedGameConfig extends GameConfig {
  questions?: LocalStorageQuestion[];
}

const QuizGame = () => {
  // Animation hooks
  const {
    staggerChildren,
    slideInLeft,
    slideInRight,
    scaleIn,
    fadeUp,
    containerVariants,
  } = useEnhancedAnimations();

  // Router hooks
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;

  // Game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerHand, setCurrentPlayerHand] = useState<Card[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [round, setRound] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBy, setPausedBy] = useState<string>("");
  const [activeCards, setActiveCards] = useState<ActiveCard[]>([]);
  const [showLeaderboardAfterAnswer, setShowLeaderboardAfterAnswer] = useState(false);
  const [usedCardsLog, setUsedCardsLog] = useState<CardUsage[]>([]);
  const [isDrawingCard, setIsDrawingCard] = useState(false);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [scoreUpdates, setScoreUpdates] = useState<ScoreUpdate[]>([]);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [showCardTooltip, setShowCardTooltip] = useState<{cardTitle: string, description: string} | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  // Core game data
  const [config, setConfig] = useState<ExtendedGameConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const leaderboardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answerPhaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized values
  const allCards = useMemo(() => powerCards.map((card: PowerCard) => ({
    id: parseInt(card.id.replace(/\D/g, '')) || 0,
    uniqueId: card.id,
    title: card.name,
    description: card.description,
    color: card.color,
    value: card.value || 0,
    emoji: card.emoji,
    type: card.type
  })), []);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  // Utility functions
  const redirectToHome = useCallback(() => {
    setTimeout(() => router.push("/"), 2000);
  }, [router]);

  const showError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
    redirectToHome();
  }, [redirectToHome]);

  const validateConfig = useCallback((parsedConfig: ExtendedGameConfig): boolean => {
    if (!parsedConfig.roomCode || parsedConfig.roomCode !== roomCode) {
      return false;
    }
    if (!parsedConfig.players || parsedConfig.players.length === 0) {
      return false;
    }
    if (!parsedConfig.gameSettings) {
      return false;
    }
    return true;
  }, [roomCode]);

  const validateQuestions = useCallback((questions: any[]): boolean => {
    if (!Array.isArray(questions) || questions.length === 0) {
      return false;
    }
    return questions.every(q => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length >= 2 && 
      typeof q.correctAnswer === 'number' &&
      q.correctAnswer >= 0 && 
      q.correctAnswer < q.options.length
    );
  }, []);

  const convertQuestionsFormat = useCallback((localStorageQuestions: LocalStorageQuestion[]): Question[] => {
    return localStorageQuestions.map((lsQuestion, index) => ({
      id: index + 1,
      text: lsQuestion.question,
      imageUrl: lsQuestion.imageUrl || "",
      options: lsQuestion.options,
      correctAnswer: lsQuestion.correctAnswer,
      explanation: lsQuestion.explanation || ""
    }));
  }, []);

  const initializePlayers = useCallback((configPlayers: any[]): Player[] => {
    return configPlayers.map((player, index) => ({
      id: index + 1,
      name: player.name,
      score: 0,
      cards: 0,
      hasAnswered: false,
      selectedAnswer: undefined,
    }));
  }, []);

  // Data loading effect
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true);
        
        // Load config from localStorage
        const storedConfig = localStorage.getItem(`quizConfig-${roomCode}`);
        
        if (!storedConfig) {
          showError("Không tìm thấy phòng chơi");
          return;
        }
        
        const parsedConfig: ExtendedGameConfig = JSON.parse(storedConfig);
        
        // Validate config
        if (!validateConfig(parsedConfig)) {
          showError("Cấu hình phòng chơi không hợp lệ");
          return;
        }
        
        // Extract questions from config
        const configQuestions = parsedConfig.gameSettings.selectedQuizPack?.questions;
        if (!configQuestions) {
          showError("Không tìm thấy câu hỏi trong cấu hình");
          return;
        }
        
        // Validate questions
        if (!validateQuestions(configQuestions)) {
          showError("Danh sách câu hỏi không hợp lệ");
          return;
        }
        
        // Convert and set questions
        const convertedQuestions = convertQuestionsFormat(configQuestions);
        setQuestions(convertedQuestions);
        
        // Set config
        setConfig(parsedConfig);
        
        // Initialize game settings
        setTimeLeft(parsedConfig.gameSettings.timePerQuestion);
        
        // Initialize players
        const formattedPlayers = initializePlayers(parsedConfig.players);
        setPlayers(formattedPlayers);
        setPausedBy(formattedPlayers[0]?.name || "");
        
        setLoading(false);
        
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu trò chơi:", err);
        showError("Có lỗi xảy ra khi tải dữ liệu trò chơi");
      }
    };
    
    if (roomCode) {
      loadGameData();
    }
  }, [roomCode, showError, validateConfig, validateQuestions, convertQuestionsFormat, initializePlayers]);

  // Game logic functions
  const simulateOtherPlayersAnswers = useCallback(() => {
    if (questions.length === 0) return;
    
    const delay = Math.random() * 15000 + 5000; // 5-20 seconds
    setTimeout(() => {
      setPlayers(prevPlayers => 
        prevPlayers.map(player => {
          if (player.id !== 1 && !player.hasAnswered) {
            const randomAnswer = Math.floor(Math.random() * 4);
            return { 
              ...player, 
              hasAnswered: true, 
              selectedAnswer: randomAnswer 
            };
          }
          return player;
        })
      );
    }, delay);
  }, [questions.length]);

  const handleAnswerSelect = useCallback((optionIndex: number) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    setShowCorrectAnswer(true);

    // Update current player status
    setPlayers(prevPlayers => 
      prevPlayers.map(player => 
        player.id === 1 
          ? { ...player, hasAnswered: true, selectedAnswer: optionIndex }
          : player
      )
    );

    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    let earnedScore = 0;

    if (isCorrect) {
      earnedScore = 100;
      setRoundScore(earnedScore);

      // Add random card with animation
      const randomCard = { 
        ...allCards[Math.floor(Math.random() * allCards.length)], 
        uniqueId: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      };
      setDrawnCard(randomCard);
      setIsDrawingCard(true);
      
      setTimeout(() => {
        setCurrentPlayerHand((prev) => [...prev, randomCard]);
        setIsDrawingCard(false);
        setDrawnCard(null);
        
        setPlayers(prev => 
          prev.map(player => 
            player.id === 1 
              ? { ...player, cards: player.cards + 1 } 
              : player
          )
        );
      }, 1500);
    } else {
      setRoundScore(0);
    }

    // Show correct answer for 3 seconds then show leaderboard
    answerPhaseTimerRef.current = setTimeout(() => {
      setShowCorrectAnswer(false);
      setShowLeaderboardAfterAnswer(true);

      // Add score update animation
      if (earnedScore > 0) {
        const animationId = `score-${Date.now()}`;
        setScoreUpdates([{ playerId: 1, points: earnedScore, animationId }]);
      }

      leaderboardTimerRef.current = setTimeout(() => {
        setShowLeaderboardAfterAnswer(false);
        setScoreUpdates([]);
        setRoundScore(0);
        goToNextQuestion();
      }, 5000);
    }, 3000);
  }, [isAnswered, currentQuestion, allCards]);

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentQuestionIndex(0);
      setRound(round + 1);
    }

    // Reset states
    setTimeLeft(config?.gameSettings.timePerQuestion || 30);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowCorrectAnswer(false);
    setPlayers(prev => prev.map(player => ({ 
      ...player, 
      hasAnswered: false, 
      selectedAnswer: undefined 
    })));
  }, [currentQuestionIndex, totalQuestions, round, config]);

  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      setPausedBy(players[0]?.name || "");
    }
  }, [isPaused, players]);

  const useCard = useCallback((card: Card) => {
    const animationId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to log
    setUsedCardsLog(prev => [...prev, {
      playerName: players[0]?.name || "",
      cardTitle: card.title,
      round: round,
      questionNumber: currentQuestionIndex + 1,
      cardDescription: card.description
    }]);
    
    // Remove card from hand
    setCurrentPlayerHand((prev) => prev.filter((c) => c.uniqueId !== card.uniqueId));

    // Update player card count
    setPlayers(prevPlayers => 
      prevPlayers.map(player => 
        player.id === 1 
          ? { ...player, cards: player.cards - 1 } 
          : player
      )
    );

    // Add to active cards queue
    setActiveCards(prev => [...prev, { card, id: animationId }]);

    // Remove from queue after animation
    setTimeout(() => {
      setActiveCards(prev => prev.filter(ac => ac.id !== animationId));
    }, 2000);
  }, [players, round, currentQuestionIndex]);

  const goHome = useCallback(() => router.push("/"), [router]);

  const getCardInfo = useCallback((title: string) => {
    return allCards.find(card => card.title === title);
  }, [allCards]);

  const showCardInfo = useCallback((cardTitle: string, description: string) => {
    setShowCardTooltip({ cardTitle, description });
  }, []);

  const hideCardInfo = useCallback(() => {
    setShowCardTooltip(null);
  }, []);

  const toggleConfigView = useCallback(() => {
    setShowConfig(!showConfig);
  }, [showConfig]);

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered && !isPaused && !showLeaderboardAfterAnswer && !showCorrectAnswer && questions.length > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !isAnswered && questions.length > 0) {
      handleAnswerSelect(-1);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isAnswered, isPaused, showLeaderboardAfterAnswer, showCorrectAnswer, questions.length, handleAnswerSelect]);

  // Simulation effect
  useEffect(() => {
    simulateOtherPlayersAnswers();
  }, [currentQuestionIndex, simulateOtherPlayersAnswers]);

  // Score update effect
  useEffect(() => {
    scoreUpdates.forEach(update => {
      setTimeout(() => {
        setPlayers(prevPlayers => 
          prevPlayers.map(player => 
            player.id === update.playerId 
              ? { ...player, score: player.score + update.points } 
              : player
          )
        );
      }, 1000);
    });
  }, [scoreUpdates]);

  // Render functions
  const renderTopTimer = useCallback(() => {
    if (!config) return null;
    
    const timePerQuestion = config.gameSettings.timePerQuestion;
    const progress = (timeLeft / timePerQuestion) * 100;

    return (
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
            <button
              onClick={toggleConfigView}
              className="flex items-center p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              title="Xem cấu hình trò chơi"
            >
              <FaInfoCircle className="text-xl" />
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
    );
  }, [config, timeLeft, currentQuestionIndex, totalQuestions, isPaused, goHome, toggleConfigView, togglePause]);

  const renderPlayers = useCallback(() => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    return (
      <motion.div 
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2 variants={fadeUp} className="text-xl font-bold text-center mb-4 text-white">Bảng xếp hạng</motion.h2>
        {sortedPlayers.map((player, index) => {
          const scoreUpdate = scoreUpdates.find(su => su.playerId === player.id);
          
          return (
            <motion.div
              key={player.id}
              variants={fadeUp}
              className={`flex items-center justify-between p-3 rounded-lg backdrop-blur-md ${
                index === 0
                  ? "bg-yellow-500/20 border-2 border-yellow-400/30"
                  : "bg-white/5 border border-white/10"
              } shadow-xl shadow-black/30 relative overflow-hidden`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white mr-3 relative">
                  {index === 0 ? (
                    <FaCrown className="text-yellow-300" />
                  ) : (
                    <FaUser />
                  )}
                  {player.hasAnswered && (
                    <FaCheck className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white rounded-full p-0.5" />
                  )}
                </div>
                <span className="font-medium text-white">{player.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-white/70 mr-3">{player.cards} cards</span>
                {showLeaderboardAfterAnswer && roundScore > 0 && player.id === 1 ? (
                  <div className="flex items-center">
                    <span className="font-bold text-white">{player.score - roundScore}</span>
                    <span className="text-green-400 font-bold mx-2">+{roundScore}</span>
                    <motion.span 
                      className="font-bold text-white"
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ delay: 1, duration: 0.5 }}
                    >
                      = {player.score}
                    </motion.span>
                  </div>
                ) : (
                  <span className="font-bold text-white">{player.score}</span>
                )}
                {scoreUpdate && (
                  <motion.span 
                    className="text-green-400 font-bold absolute right-3 -top-2"
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -20, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                  >
                    +{scoreUpdate.points}
                  </motion.span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }, [players, scoreUpdates, showLeaderboardAfterAnswer, roundScore, containerVariants, fadeUp]);

  const renderCardLog = useCallback(() => {
    const groupedLogs: {[key: string]: CardUsage[]} = {};
    
    usedCardsLog.forEach(log => {
      const key = `Vòng ${log.round} - Câu ${log.questionNumber}`;
      if (!groupedLogs[key]) {
        groupedLogs[key] = [];
      }
      groupedLogs[key].push(log);
    });

    return (
      <div className="h-full flex flex-col">
        <motion.h2 variants={fadeUp} className="text-xl font-bold mb-2 text-white">Lịch sử dùng thẻ</motion.h2>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {usedCardsLog.length === 0 ? (
            <motion.div variants={fadeUp} className="text-white/50 text-center mt-10">
              Chưa có thẻ nào được sử dụng
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {Object.entries(groupedLogs).map(([question, logs]) => (
                <motion.div 
                  key={question} 
                  variants={slideInRight}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-md"
                >
                  <h3 className="font-semibold text-sm mb-2 text-white">{question}</h3>
                  <div className="space-y-2">
                    {logs.map((log, index) => {
                      const cardInfo = getCardInfo(log.cardTitle);
                      return (
                        <motion.div 
                          key={`${question}-${index}`}
                          className={`p-2 rounded-lg text-white ${cardInfo?.color || 'bg-gray-500'} relative backdrop-blur-md`}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="font-semibold text-sm">{log.playerName}</div>
                          <div className="text-xs opacity-90">{log.cardTitle}</div>
                          <button
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black bg-opacity-20 flex items-center justify-center hover:bg-opacity-40 transition-all"
                            onMouseEnter={() => showCardInfo(log.cardTitle, log.cardDescription)}
                            onMouseLeave={hideCardInfo}
                          >
                            <FaQuestionCircle className="text-xs" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    );
  }, [usedCardsLog, getCardInfo, showCardInfo, hideCardInfo, containerVariants, fadeUp, slideInRight]);

  const renderPlayerHand = useCallback(() => {
    return (
      <motion.div 
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="flex justify-center gap-2 pointer-events-auto">
          {currentPlayerHand.map((card) => (
            <motion.div
              key={card.uniqueId}
              className={`w-16 h-20 ${card.color} rounded-lg shadow-md flex flex-col items-center justify-center text-white text-xs text-center p-1 cursor-pointer backdrop-blur-md border border-white/20`}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              whileHover={{ y: -20, scale: 1.2, zIndex: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => useCard(card)}
            >
              <div className="font-bold mb-1">{card.title.split(" ")[0]}</div>
              <div className="text-[10px] leading-tight">
                {card.title.split(" ").slice(1).join(" ")}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }, [currentPlayerHand, useCard]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Đang tải trò chơi...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
        <div className="text-center p-8 bg-white/10 rounded-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-4">Lỗi</h2>
          <p className="mb-6">{error}</p>
          <p>Đang chuyển hướng về trang chủ...</p>
        </div>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0 || !currentQuestion) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
        <div className="text-center p-8 bg-white/10 rounded-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-4">Không có câu hỏi</h2>
          <p className="mb-6">Không tìm thấy câu hỏi nào cho phòng chơi này</p>
          <p>Đang chuyển hướng về trang chủ...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="relative h-screen w-full font-sans flex flex-col p-4 pb-24 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto flex-1 flex flex-col w-full">
        {/* Top Timer */}
        <motion.div 
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 mb-4 shadow-xl shadow-black/30 backdrop-blur-md"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          {renderTopTimer()}
        </motion.div>

        {/* Mobile leaderboard toggle */}
        <motion.div 
          className="md:hidden flex justify-center mb-4"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20"
          >
            {showLeaderboard ? "Ẩn BXH" : "Hiện BXH"}
            {showLeaderboard ? (
              <FaDesktop className="ml-2" />
            ) : (
              <FaMobile className="ml-2" />
            )}
          </button>
        </motion.div>

        {/* Main content */}
        <motion.div 
          className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {/* Left column: Players */}
          <motion.div
            variants={slideInLeft}
            className={`w-full lg:w-1/4 ${showLeaderboard ? "block" : "hidden"} md:block overflow-auto`}
          >
            {renderPlayers()}
          </motion.div>

          {/* Center column: Question or leaderboard */}
          <motion.div 
            variants={scaleIn}
            className="w-full lg:w-2/4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-md overflow-auto"
          >
            <AnimatePresence mode="wait">
              {showLeaderboardAfterAnswer ? (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <h2 className="text-2xl font-bold text-center mb-6 text-white">Cập nhật điểm số</h2>
                  {renderPlayers()}
                  <p className="text-center mt-6 text-white/60">
                    Tiếp tục sau {Math.ceil(timeLeft/6)} giây...
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6 text-white">
                    {currentQuestion.text}
                  </h1>

                  <div className="flex justify-center mb-4 md:mb-6">
                    <motion.img
                      src={currentQuestion.imageUrl}
                      alt="Question illustration"
                      className="w-full h-48 object-cover rounded-xl shadow-md border border-white/10"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {currentQuestion.options.map((option, index) => {
                      let buttonClass = "bg-white/10 text-white border-2 border-white/10 hover:bg-white/20";

                      if (isAnswered || showCorrectAnswer) {
                        if (index === currentQuestion.correctAnswer) {
                          buttonClass = "bg-green-500/20 text-white border-2 border-green-500/30";
                        } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
                          buttonClass = "bg-red-500/20 text-white border-2 border-red-500/30";
                        } else if (index === selectedAnswer) {
                          buttonClass = "bg-blue-500/20 text-white border-2 border-blue-500/30";
                        } else {
                          buttonClass = "bg-white/5 text-white/70 border-2 border-white/5";
                        }
                      }

                      return (
                        <motion.button
                          key={index}
                          className={`p-3 md:p-4 rounded-2xl text-left font-medium transition-all duration-300 ${buttonClass}`}
                          whileHover={!isAnswered && !showCorrectAnswer ? { scale: 1.02 } : {}}
                          whileTap={!isAnswered && !showCorrectAnswer ? { scale: 0.98 } : {}}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={isAnswered || isPaused || showLeaderboardAfterAnswer || showCorrectAnswer}
                        >
                          {option}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Show explanation after answering */}
                  {showCorrectAnswer && config?.gameSettings.showCorrectAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-white/10 rounded-xl text-center border border-white/10"
                    >
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <div>
                          <p className="text-green-400 font-bold mb-2">Chính xác! +100 điểm</p>
                          {currentQuestion.explanation && (
                            <p className="text-white/80 text-sm">{currentQuestion.explanation}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-red-400 font-bold mb-2">
                            Sai rồi! Đáp án đúng là: {currentQuestion.options[currentQuestion.correctAnswer]}
                          </p>
                          {currentQuestion.explanation && (
                            <p className="text-white/80 text-sm">{currentQuestion.explanation}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right column: Card usage log */}
          <motion.div 
            variants={slideInRight}
            className="w-full lg:w-1/4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md overflow-auto"
          >
            {renderCardLog()}
          </motion.div>
        </motion.div>
      </div>
      
      {/* Player hand */}
      {renderPlayerHand()}
      
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
                {activeCard.card.title}
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
                {drawnCard.title}
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
      
      {/* Card tooltip */}
      <AnimatePresence>
        {showCardTooltip && (
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 text-white p-4 rounded-xl shadow-xl z-60 max-w-sm border border-white/10 backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{showCardTooltip.cardTitle}</h3>
              <button
                onClick={hideCardInfo}
                className="text-gray-300 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-sm text-gray-200">{showCardTooltip.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Viewer Modal */}
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
      
      {/* Pause overlay */}
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
    </motion.div>
  );
};

export default QuizGame;