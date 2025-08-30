"use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
} from "react-icons/fa";
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";


interface Player {
  id: number;
  name: string;
  score: number;
  cards: number;
  hasAnswered?: boolean;
  selectedAnswer?: number;
}

interface Question {
  id: number;
  text: string;
  image: string;
  options: string[];
  correctAnswer: number;
}

interface Card {
  id: number;
  uniqueId: string;
  title: string;
  description: string;
  color: string;
  value: number;
}

interface CardUsage {
  playerName: string;
  cardTitle: string;
  round: number;
  questionNumber: number;
  cardDescription: string;
}

interface ActiveCard {
  card: Card;
  id: string;
}

interface ScoreUpdate {
  playerId: number;
  points: number;
  animationId: string;
}

const QuizGame = () => {
  // Sử dụng custom hook cho animation
  const {
    staggerChildren,
    slideInLeft,
    slideInRight,
    scaleIn,
    fadeUp,
    containerVariants,
  } = useEnhancedAnimations();

  // State quản lý dữ liệu game
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: "Bạn", score: 1200, cards: 2, hasAnswered: false },
    { id: 2, name: "Người chơi 2", score: 950, cards: 5, hasAnswered: false },
    { id: 3, name: "Người chơi 3", score: 800, cards: 2, hasAnswered: false },
    { id: 4, name: "Người chơi 4", score: 600, cards: 4, hasAnswered: false },
    { id: 5, name: "Người chơi 5", score: 400, cards: 1, hasAnswered: false },
  ]);

  const [currentPlayerHand, setCurrentPlayerHand] = useState<Card[]>([
    {
      id: 1,
      uniqueId: "card-1-1",
      title: "Thẻ Tăng Điểm",
      description: "Tăng 50 điểm khi trả lời đúng",
      color: "bg-blue-500",
      value: 50,
    },
    {
      id: 2,
      uniqueId: "card-2-1",
      title: "Thẻ Thời Gian",
      description: "Thêm 10 giây suy nghĩ",
      color: "bg-green-500",
      value: 10,
    },
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [round, setRound] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBy, setPausedBy] = useState<string>("Người chơi 1");
  const [activeCards, setActiveCards] = useState<ActiveCard[]>([]);
  const [showLeaderboardAfterAnswer, setShowLeaderboardAfterAnswer] = useState(false);
  const [usedCardsLog, setUsedCardsLog] = useState<CardUsage[]>([]);
  const [isDrawingCard, setIsDrawingCard] = useState(false);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [scoreUpdates, setScoreUpdates] = useState<ScoreUpdate[]>([]);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [showCardTooltip, setShowCardTooltip] = useState<{cardTitle: string, description: string} | null>(null);

  // Danh sách câu hỏi
  const questions: Question[] = [
    {
      id: 1,
      text: "Thủ đô của Việt Nam là gì?",
      image:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      options: ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Huế"],
      correctAnswer: 0,
    },
    {
      id: 2,
      text: "Planet nào lớn nhất trong hệ mặt trời?",
      image:
        "https://images.unsplash.com/photo-1630851240985-cc5227c4e08b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      options: ["Trái Đất", "Sao Mộc", "Sao Thổ", "Sao Hỏa"],
      correctAnswer: 1,
    },
    {
      id: 3,
      text: "Ai vẽ bức tranh Mona Lisa?",
      image:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      options: [
        "Vincent van Gogh",
        "Pablo Picasso",
        "Leonardo da Vinci",
        "Michelangelo",
      ],
      correctAnswer: 2,
    },
  ];

  // Danh sách thẻ bài
  const allCards: Card[] = [
    {
      id: 1,
      uniqueId: "card-1-template",
      title: "Thẻ Tăng Điểm",
      description: "Tăng 50 điểm khi trả lời đúng câu hỏi",
      color: "bg-blue-500",
      value: 50,
    },
    {
      id: 2,
      uniqueId: "card-2-template",
      title: "Thẻ Thời Gian",
      description: "Thêm 10 giây suy nghĩ cho câu hỏi hiện tại",
      color: "bg-green-500",
      value: 10,
    },
    {
      id: 3,
      uniqueId: "card-3-template",
      title: "Thẻ Bảo Vệ",
      description: "Bảo vệ điểm số khi trả lời sai câu hỏi",
      color: "bg-purple-500",
      value: 0,
    },
    {
      id: 4,
      uniqueId: "card-4-template",
      title: "Thẻ May Mắn",
      description: "Tăng 20% cơ hội nhận được thẻ hiếm sau câu hỏi",
      color: "bg-yellow-500",
      value: 0,
    },
    {
      id: 5,
      uniqueId: "card-5-template",
      title: "Thẻ X2",
      description: "Nhân đôi điểm thưởng của câu hỏi hiện tại",
      color: "bg-red-500",
      value: 2,
    },
  ];

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const leaderboardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answerPhaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate other players answering
  const simulateOtherPlayersAnswers = useCallback(() => {
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
  }, []);

  // Xử lý đếm ngược thời gian
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered && !isPaused && !showLeaderboardAfterAnswer && !showCorrectAnswer) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswerSelect(-1);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isAnswered, isPaused, showLeaderboardAfterAnswer, showCorrectAnswer]);

  // Start simulating other players when question starts
  useEffect(() => {
    simulateOtherPlayersAnswers();
  }, [currentQuestionIndex, simulateOtherPlayersAnswers]);

  // Xử lý khi người chơi chọn đáp án
  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered) return;

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
  };

  // Animated score update
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

  // Chuyển đến câu hỏi tiếp theo
  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentQuestionIndex(0);
      setRound(round + 1);
    }

    // Reset states
    setTimeLeft(30);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowCorrectAnswer(false);
    setPlayers(prev => prev.map(player => ({ 
      ...player, 
      hasAnswered: false, 
      selectedAnswer: undefined 
    })));
  };

  // Xử lý tạm ngưng/tiếp tục
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      setPausedBy("Bạn");
    }
  };

  // Xử lý sử dụng thẻ bài với animation queue
  const useCard = (card: Card) => {
    const animationId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to log
    setUsedCardsLog(prev => [...prev, {
      playerName: players[0].name,
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
  };

  // Quay về trang chủ
  const goHome = () => {
    // Logic quay về trang chủ
    console.log("Going home...");
  };

  // Get card info by title
  const getCardInfo = (title: string) => {
    return allCards.find(card => card.title === title);
  };

  // Show card tooltip
  const showCardInfo = (cardTitle: string, description: string) => {
    setShowCardTooltip({ cardTitle, description });
  };

  // Hide card tooltip
  const hideCardInfo = () => {
    setShowCardTooltip(null);
  };

  // Render thanh thời gian với animation mượt
  const renderTopTimer = () => {
    const progress = (timeLeft / 30) * 100;

    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={goHome}
            className="flex items-center p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <FaHome className="text-xl" />
          </button>
          
          <div className="flex items-center">
            <FaClock className="text-[#FF6B35] mr-2" />
            <span className="text-lg font-bold text-white">{timeLeft}s</span>
          </div>
          
          <div className="flex items-center">
            <span className="text-lg font-bold mr-2 text-white">Câu {currentQuestionIndex + 1}/{totalQuestions}</span>
            <button
              onClick={togglePause}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
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
            animate={{ width: `${progress - (100/30)}%` }}
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
  };

  // Render danh sách người chơi với trạng thái
  const renderPlayers = () => {
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
  };

  // Render log thẻ đã sử dụng với tooltip
  const renderCardLog = () => {
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
  };

  // Render bài trên tay
  const renderPlayerHand = () => {
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
  };

  return (
    <motion.div 
      className="relative h-screen w-full font-sans flex flex-col p-4 pb-24 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto flex-1 flex flex-col w-full">
        {/* Thanh thời gian ở đầu trang */}
        <motion.div 
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 mb-4 shadow-xl shadow-black/30 backdrop-blur-md"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          {renderTopTimer()}
        </motion.div>

        {/* Nút toggle leaderboard trên mobile */}
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

        <motion.div 
          className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {/* Cột trái: Danh sách người chơi */}
          <motion.div
            variants={slideInLeft}
            className={`w-full lg:w-1/4 ${showLeaderboard ? "block" : "hidden"} md:block overflow-auto`}
          >
            {renderPlayers()}
          </motion.div>

          {/* Cột giữa: Câu hỏi và đáp án hoặc bảng xếp hạng */}
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
                      src={currentQuestion.image}
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

                  {/* Hiển thị thông báo sau khi trả lời */}
                  {showCorrectAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-white/10 rounded-xl text-center border border-white/10"
                    >
                      {selectedAnswer === currentQuestion.correctAnswer ? (
                        <p className="text-green-400 font-bold">Chính xác! +100 điểm</p>
                      ) : (
                        <p className="text-red-400 font-bold">Sai rồi! Đáp án đúng là: {currentQuestion.options[currentQuestion.correctAnswer]}</p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Cột phải: Log thẻ đã sử dụng */}
          <motion.div 
            variants={slideInRight}
            className="w-full lg:w-1/4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur-md overflow-auto"
          >
            {renderCardLog()}
          </motion.div>
        </motion.div>
      </div>
      
      {/* Bài trên tay */}
      {renderPlayerHand()}
      
      {/* Queue hiệu ứng khi sử dụng thẻ bài */}
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
      
      {/* Hiệu ứng khi rút thẻ bài */}
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
      
      {/* Tooltip thông tin thẻ */}
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
      
      {/* Thông báo tạm ngưng với nền mờ */}
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