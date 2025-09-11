"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useEnhancedAnimations } from "@/hooks/useEnhancedAnimations";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  ActiveCard,
  ActiveCardEffect,
  CardUsage,
  ExtendedGameConfig,
  GameModifiers,
  LocalStorageQuestion,
  Player,
  Card,
  Question,
  ScoreUpdate,
} from "@/types/type";
import { powerCards } from "@/data/cardData";
import LoadingState from "@/components/play/LoadingState";
import ErrorState from "@/components/play/ErrorState";
import Timer from "@/components/play/Timer";
import PlayerList from "@/components/play/Playlist";
import QuestionCard from "@/components/play/QuestionCard";
import CardLog from "@/components/play/CardLog";
import PlayerHand from "@/components/play/PlayerHand";
import CardAnimation from "@/components/play/CardAnimation";
import ConfigViewer from "@/components/play/ConfigViewer";
import PauseOverlay from "@/components/play/PauseOverPlay";
import GameOver from "@/components/play/GameOver";

const QuizGame = () => {
  // Animation hooks
  const { containerVariants } = useEnhancedAnimations();

  // Router hooks
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;

  // Game state
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerHand, setCurrentPlayerHand] = useState<Card[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showLeaderboard] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedBy, setPausedBy] = useState<string>("");
  const [activeCards, setActiveCards] = useState<ActiveCard[]>([]);
  const [showLeaderboardAfterAnswer, setShowLeaderboardAfterAnswer] =
    useState(false);
  const [usedCardsLog, setUsedCardsLog] = useState<CardUsage[]>([]);
  const [isDrawingCard, setIsDrawingCard] = useState(false);
  const [drawnCard, setDrawnCard] = useState<Card | null>(null);
  const [scoreUpdates, setScoreUpdates] = useState<ScoreUpdate[]>([]);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Card effect states
  const [activeEffects, setActiveEffects] = useState<ActiveCardEffect[]>([]);
  const [gameModifiers, setGameModifiers] = useState<GameModifiers>({
    timeModifier: 0,
    cssEffects: [],
    scoreMultiplier: 1,
    removedAnswers: [],
    fakeAnswers: [],
    lockedAnswers: [],
  });

  // Core game data
  const [config, setConfig] = useState<ExtendedGameConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const leaderboardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answerPhaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const effectCleanupRef = useRef<NodeJS.Timeout[]>([]);

  // Memoized values
  const allCards = useMemo(
    () =>
      powerCards.map((card: Card) => ({
        id: card.id || 0,
        name: card.name,
        description: card.description,
        color: card.color,
        emoji: card.emoji,
        type: card.type,
        uniqueId: card.uniqueId || `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
    []
  );

  const maxQuestions =
    config?.gameSettings.numberOfQuestion || questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  // Determine if cards can be played
  const canPlayCards = useMemo(() => {
    return (
      !isAnswered &&
      !showCorrectAnswer &&
      !showLeaderboardAfterAnswer &&
      !isPaused &&
      !gameOver &&
      timeLeft > 0
    );
  }, [
    isAnswered,
    showCorrectAnswer,
    showLeaderboardAfterAnswer,
    isPaused,
    gameOver,
    timeLeft,
  ]);

  // Enhanced card effect application with proper cleanup
  const applyCardEffect = useCallback(
    (card: Card, cardData: Card) => {
      const effectId = `effect-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const effect = cardData.effect;
      const currentTime = Date.now();

      console.log(`Applying card effect: ${card.name}`, effect);

      switch (effect.type) {
        case "time":
          const timeEffect: ActiveCardEffect = {
            id: effectId,
            type: "time",
            effect,
            startTime: currentTime,
            targetPlayer: 1,
          };

          setActiveEffects((prev) => [...prev, timeEffect]);

          // Apply time modification immediately
          setTimeLeft((prev) => {
            const newTime = Math.max(1, prev + effect.value);
            return newTime;
          });

          // Auto-remove time effect at end of question
          break;

        case "css":
          const cssEffect: ActiveCardEffect = {
            id: effectId,
            type: "css",
            effect,
            duration: 5000,
            startTime: currentTime,
            targetPlayer: effect.value < 0 ? 2 : 1,
          };

          setActiveEffects((prev) => [...prev, cssEffect]);
          setGameModifiers((prev) => ({
            ...prev,
            cssEffects: [...prev.cssEffects, effect.effect],
          }));

          // Clean up CSS effect after duration
          const cssTimeout = setTimeout(() => {
            setActiveEffects((prev) => prev.filter((e) => e.id !== effectId));
            setGameModifiers((prev) => ({
              ...prev,
              cssEffects: prev.cssEffects.filter(
                (css) => css !== effect.effect
              ),
            }));
          }, 5000);

          effectCleanupRef.current.push(cssTimeout);
          break;

        case "score":
          if (effect.value === -50) {
            // Point steal - immediate effect
            setPlayers((prev) =>
              prev.map((player) => {
                if (player.id === 1) {
                  return { ...player, score: Math.max(0, player.score + 50) };
                } else if (player.id === 2) {
                  return { ...player, score: Math.max(0, player.score - 50) };
                }
                return player;
              })
            );

            setScoreUpdates((prev) => [
              ...prev,
              {
                playerId: 1,
                points: 50,
                animationId: `steal-gain-${effectId}`,
              },
              {
                playerId: 2,
                points: -50,
                animationId: `steal-loss-${effectId}`,
              },
            ]);
          } else {
            // Score multiplier for current question only
            const scoreEffect: ActiveCardEffect = {
              id: effectId,
              type: "score",
              effect,
              startTime: currentTime,
              targetPlayer: 1,
            };

            setActiveEffects((prev) => [...prev, scoreEffect]);
            setGameModifiers((prev) => ({
              ...prev,
              scoreMultiplier: effect.value,
            }));
          }
          break;

        case "answer":
          if (!currentQuestion) break;

          const answerEffect: ActiveCardEffect = {
            id: effectId,
            type: "answer",
            effect,
            startTime: currentTime,
            targetPlayer: effect.mode === "remove" ? 1 : 2,
          };

          setActiveEffects((prev) => [...prev, answerEffect]);

          if (effect.mode === "remove") {
            // Remove wrong answers
            const wrongAnswers = currentQuestion.options
              .map((_, index) => index)
              .filter((index) => index !== currentQuestion.correctAnswer);

            const answersToRemove = wrongAnswers.slice(0, effect.count || 1);
            setGameModifiers((prev) => ({
              ...prev,
              removedAnswers: [...prev.removedAnswers, ...answersToRemove],
            }));
          } else if (effect.mode === "fake") {
            // Add fake answer options (visual effect)
            const fakeAnswers = Array(effect.count || 1)
              .fill(0)
              .map((_, i) => `Đáp án giả ${i + 1}`);

            setGameModifiers((prev) => ({
              ...prev,
              fakeAnswers: [...prev.fakeAnswers, ...fakeAnswers],
            }));
          } else if (effect.mode === "lock") {
            // Lock random answers
            const availableAnswers = currentQuestion.options
              .map((_, index) => index)
              .filter((index) => !gameModifiers.lockedAnswers.includes(index));

            const answersToLock = availableAnswers
              .sort(() => Math.random() - 0.5)
              .slice(0, effect.count || 1);

            setGameModifiers((prev) => ({
              ...prev,
              lockedAnswers: [...prev.lockedAnswers, ...answersToLock],
            }));
          }
          break;

        default:
          console.warn(`Unknown effect type: ${effect.type}`);
      }
    },
    [currentQuestion, gameModifiers.lockedAnswers]
  );

  // Clear all question-specific effects
  const clearQuestionEffects = useCallback(() => {
    // Clear all active timeouts
    effectCleanupRef.current.forEach((timeout) => clearTimeout(timeout));
    effectCleanupRef.current = [];

    setActiveEffects([]);
    setGameModifiers({
      timeModifier: 0,
      cssEffects: [],
      scoreMultiplier: 1,
      removedAnswers: [],
      fakeAnswers: [],
      lockedAnswers: [],
    });
  }, []);

  // Utility functions
  const redirectToHome = useCallback(() => {
    setTimeout(() => router.push("/"), 2000);
  }, [router]);

  const showError = useCallback(
    (message: string) => {
      setError(message);
      setLoading(false);
      redirectToHome();
    },
    [redirectToHome]
  );

  const validateConfig = useCallback(
    (parsedConfig: ExtendedGameConfig): boolean => {
      return !!(
        parsedConfig.roomCode &&
        parsedConfig.roomCode === roomCode &&
        parsedConfig.players?.length > 0 &&
        parsedConfig.gameSettings
      );
    },
    [roomCode]
  );

  const validateQuestions = useCallback((questions: any[]): boolean => {
    return (
      Array.isArray(questions) &&
      questions.length > 0 &&
      questions.every(
        (q) =>
          q.question &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          typeof q.correctAnswer === "number" &&
          q.correctAnswer >= 0 &&
          q.correctAnswer < q.options.length
      )
    );
  }, []);

  const convertQuestionsFormat = useCallback(
    (localStorageQuestions: LocalStorageQuestion[]): Question[] => {
      return localStorageQuestions.map((lsQuestion, index) => ({
        id: index + 1,
        text: lsQuestion.question,
        imageUrl: lsQuestion.imageUrl || "",
        options: lsQuestion.options,
        correctAnswer: lsQuestion.correctAnswer,
        explanation: lsQuestion.explanation || "",
      }));
    },
    []
  );

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
        const storedConfig = localStorage.getItem(`quizConfig-${roomCode}`);

        if (!storedConfig) {
          showError("Không tìm thấy phòng chơi");
          return;
        }

        const parsedConfig: ExtendedGameConfig = JSON.parse(storedConfig);

        if (!validateConfig(parsedConfig)) {
          showError("Cấu hình phòng chơi không hợp lệ");
          return;
        }

        const configQuestions =
          parsedConfig.gameSettings.selectedQuizPack?.questions;
        if (!configQuestions || !validateQuestions(configQuestions)) {
          showError("Danh sách câu hỏi không hợp lệ");
          return;
        }

        const convertedQuestions = convertQuestionsFormat(configQuestions);
        setQuestions(convertedQuestions);
        setConfig(parsedConfig);
        setTimeLeft(parsedConfig.gameSettings.timePerQuestion);

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
  }, [
    roomCode,
    showError,
    validateConfig,
    validateQuestions,
    convertQuestionsFormat,
    initializePlayers,
  ]);

  // Clear effects on question change
  useEffect(() => {
    clearQuestionEffects();
  }, [currentQuestionIndex, clearQuestionEffects]);

  // Game over check
  useEffect(() => {
    if (
      config &&
      currentQuestionIndex + 1 >= config.gameSettings.numberOfQuestion
    ) {
      if (showLeaderboardAfterAnswer) {
        const gameOverTimer = setTimeout(() => setGameOver(true), 5000);
        return () => clearTimeout(gameOverTimer);
      }
    }
  }, [currentQuestionIndex, config, showLeaderboardAfterAnswer]);

  // Game logic functions
  const simulateOtherPlayersAnswers = useCallback(() => {
    if (questions.length === 0 || gameOver) return;

    const delay = Math.random() * 15000 + 5000;
    const timeout = setTimeout(() => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) => {
          if (player.id !== 1 && !player.hasAnswered) {
            return {
              ...player,
              hasAnswered: true,
              selectedAnswer: Math.floor(Math.random() * 4),
            };
          }
          return player;
        })
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, [questions.length, gameOver]);

  const goToNextQuestion = useCallback(() => {
    if (gameOver || currentQuestionIndex + 1 >= maxQuestions) {
      setGameOver(true);
      return;
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeLeft(config?.gameSettings.timePerQuestion || 30);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowCorrectAnswer(false);
    setRoundScore(0);

    setPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        hasAnswered: false,
        selectedAnswer: undefined,
      }))
    );

    clearQuestionEffects();
  }, [
    currentQuestionIndex,
    maxQuestions,
    config,
    gameOver,
    clearQuestionEffects,
  ]);

  const handleAnswerSelect = useCallback(
    (optionIndex: number) => {
      if (isAnswered || !currentQuestion || gameOver) return;

      setSelectedAnswer(optionIndex);
      setIsAnswered(true);
      setShowCorrectAnswer(true);

      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === 1
            ? { ...player, hasAnswered: true, selectedAnswer: optionIndex }
            : player
        )
      );

      const isCorrect = optionIndex === currentQuestion.correctAnswer;
      let earnedScore = 0;

      if (isCorrect) {
        earnedScore = Math.round(100 * gameModifiers.scoreMultiplier);
        setRoundScore(earnedScore);

        // Draw a card
        const randomCard: Card = {
          ...allCards[Math.floor(Math.random() * allCards.length)],
          uniqueId: `card-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        };

        setDrawnCard(randomCard);
        setIsDrawingCard(true);

        setTimeout(() => {
          setCurrentPlayerHand((prev) => [...prev, randomCard]);
          setIsDrawingCard(false);
          setDrawnCard(null);
          setPlayers((prev) =>
            prev.map((player) =>
              player.id === 1 ? { ...player, cards: player.cards + 1 } : player
            )
          );
        }, 1500);
      }

      // Updated sequence: Show correct answer for 4 seconds, then show leaderboard
      answerPhaseTimerRef.current = setTimeout(() => {
        setShowCorrectAnswer(false);
        setShowLeaderboardAfterAnswer(true);

        // Apply score updates when showing leaderboard
        if (earnedScore > 0) {
          const animationId = `score-${Date.now()}`;
          setScoreUpdates([{ playerId: 1, points: earnedScore, animationId }]);
        }

        leaderboardTimerRef.current = setTimeout(() => {
          setShowLeaderboardAfterAnswer(false);
          setScoreUpdates([]);
          goToNextQuestion();
        }, 4000); // Show leaderboard for 4 seconds
      }, 4000); // Show correct answer for 4 seconds
    },
    [
      isAnswered,
      currentQuestion,
      gameOver,
      gameModifiers.scoreMultiplier,
      allCards,
      goToNextQuestion,
    ]
  );

  const togglePause = useCallback(() => {
    if (gameOver) return;
    setIsPaused(!isPaused);
    if (!isPaused) {
      setPausedBy(players[0]?.name || "");
    }
  }, [isPaused, players, gameOver]);

  // Enhanced useCard function with timing restriction and toast notifications
  const useCard = useCallback(
    (card: Card) => {
      // Restrict card usage to before answering
      if (!canPlayCards) {
        toast.error("Không thể sử dụng thẻ sau khi trả lời", {
          icon: "⏱️",
          duration: 3000,
        });
        console.log("Cannot play cards at this time");
        return;
      }

      const animationId = `card-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const cardData = powerCards.find((pc) => pc.name === card.name);

      if (!cardData) {
        console.error(`Card not found for: ${card.name}`);
        return;
      }

      // Apply the card effect
      applyCardEffect(card, cardData);

      // Log card usage
      setUsedCardsLog((prev) => [
        ...prev,
        {
          playerName: players[0]?.name || "",
          cardTitle: card.name,
          round: currentQuestionIndex + 1,
          questionNumber: currentQuestionIndex + 1,
          cardDescription: card.description,
        },
      ]);

      // Remove card from hand using uniqueId
      setCurrentPlayerHand((prev) =>
        prev.filter((c) => c.uniqueId !== card.uniqueId)
      );
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === 1 ? { ...player, cards: player.cards - 1 } : player
        )
      );

      // Show card animation
      setActiveCards((prev) => [...prev, { card, id: animationId }]);
      setTimeout(() => {
        setActiveCards((prev) => prev.filter((ac) => ac.id !== animationId));
      }, 2000);
    },
    [canPlayCards, players, currentQuestionIndex, applyCardEffect]
  );

  // Navigation functions
  const goHome = useCallback(() => router.push("/"), [router]);

  const restartGame = useCallback(() => {
    // Clear all timeouts
    [timerRef, leaderboardTimerRef, answerPhaseTimerRef].forEach((ref) => {
      if (ref.current) clearTimeout(ref.current);
    });

    clearQuestionEffects();

    // Reset all game state
    setCurrentQuestionIndex(0);
    setTimeLeft(config?.gameSettings.timePerQuestion || 30);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowCorrectAnswer(false);
    setShowLeaderboardAfterAnswer(false);
    setScoreUpdates([]);
    setRoundScore(0);
    setCurrentPlayerHand([]);
    setUsedCardsLog([]);
    setActiveCards([]);
    setDrawnCard(null);
    setIsDrawingCard(false);
    setGameOver(false);

    setPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        score: 0,
        cards: 0,
        hasAnswered: false,
        selectedAnswer: undefined,
      }))
    );
  }, [config, clearQuestionEffects]);

  const getCardInfo = useCallback(
    (name: string) => {
      return allCards.find((card) => card.name === name);
    },
    [allCards]
  );

  const showCardInfo = useCallback((cardTitle: string, description: string) => {
    // Hiển thị thông tin thẻ dưới dạng toast đơn giản
    toast(
      <div>
        <div className="font-bold">{cardTitle}</div>
        <div className="text-sm mt-1">{description}</div>
      </div>,
      {
        icon: "ℹ️",
        duration: 4000,
      }
    );
  }, []);

  const toggleConfigView = useCallback(() => {
    setShowConfig(!showConfig);
  }, [showConfig]);

  // Timer effect
  useEffect(() => {
    if (
      timeLeft > 0 &&
      !isAnswered &&
      !isPaused &&
      !showLeaderboardAfterAnswer &&
      !showCorrectAnswer &&
      questions.length > 0 &&
      !gameOver
    ) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (
      timeLeft === 0 &&
      !isAnswered &&
      questions.length > 0 &&
      !gameOver
    ) {
      handleAnswerSelect(-1);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    timeLeft,
    isAnswered,
    isPaused,
    showLeaderboardAfterAnswer,
    showCorrectAnswer,
    questions.length,
    handleAnswerSelect,
    gameOver,
  ]);

  // Other effects
  useEffect(() => {
    if (!gameOver) {
      return simulateOtherPlayersAnswers();
    }
  }, [currentQuestionIndex, simulateOtherPlayersAnswers, gameOver]);

  useEffect(() => {
    scoreUpdates.forEach((update) => {
      setTimeout(() => {
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.id === update.playerId
              ? { ...player, score: player.score + update.points }
              : player
          )
        );
      }, 1000);
    });
  }, [scoreUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      [timerRef, leaderboardTimerRef, answerPhaseTimerRef].forEach((ref) => {
        if (ref.current) clearTimeout(ref.current);
      });
      effectCleanupRef.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  // Render loading/error states
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  if (questions.length === 0 || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white p-4">
        <div className="text-center p-8 bg-white/10 rounded-2xl backdrop-blur-md">
          <h2 className="text-2xl font-bold mb-4">Không có câu hỏi</h2>
          <p className="mb-6">Không tìm thấy câu hỏi nào cho phòng chơi này</p>
          <p>Đang chuyển hướng về trang chủ...</p>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <GameOver players={players} onGoHome={goHome} onRestart={restartGame} />
    );
  }

  // Create modified question for display
  const getModifiedQuestion = () => {
    if (!currentQuestion) return currentQuestion;

    let modifiedOptions: (string | null)[] = [...currentQuestion.options];

    // Apply removed answers effect
    if (gameModifiers.removedAnswers.length > 0) {
      modifiedOptions = modifiedOptions.map((option, index) =>
        gameModifiers.removedAnswers.includes(index) ? null : option
      );
    }

    // Filter out null options and return
    const filteredOptions: string[] = modifiedOptions.filter(
      (opt): opt is string => opt !== null
    );

    return {
      ...currentQuestion,
      options: filteredOptions,
      lockedAnswers: gameModifiers.lockedAnswers,
    };
  };

  const modifiedQuestion = getModifiedQuestion();

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <motion.div
        className="relative min-h-screen w-full font-sans flex flex-col p-4 overflow-auto lg:overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          filter: gameModifiers.cssEffects.includes("blur(4px)")
            ? "blur(4px)"
            : undefined,
          transform: gameModifiers.cssEffects.includes(
            "transform: rotate(180deg)"
          )
            ? "rotate(180deg)"
            : undefined,
        }}
      >
        <div className="max-w-6xl mx-auto flex-1 flex flex-col w-full min-h-0">
          {/* Top Timer */}
          <Timer
            timeLeft={timeLeft}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={maxQuestions}
            isPaused={isPaused}
            togglePause={togglePause}
            goHome={goHome}
            toggleConfigView={toggleConfigView}
            config={config}
          />

          {/* Main content */}
          <motion.div
            className="flex-1 flex flex-col lg:flex-row gap-6 overflow-auto lg:overflow-hidden min-h-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Left column: Players */}
            <PlayerList
              players={players}
              scoreUpdates={scoreUpdates}
              showLeaderboardAfterAnswer={showLeaderboardAfterAnswer}
              roundScore={roundScore}
              showLeaderboard={showLeaderboard}
            />

            {/* Center column: Question */}
            <QuestionCard
              showLeaderboardAfterAnswer={showLeaderboardAfterAnswer}
              timeLeft={timeLeft}
              currentQuestion={modifiedQuestion}
              isAnswered={isAnswered}
              showCorrectAnswer={showCorrectAnswer}
              selectedAnswer={selectedAnswer}
              config={config}
              handleAnswerSelect={handleAnswerSelect}
              players={players}
              scoreUpdates={scoreUpdates}
              gameModifiers={gameModifiers}
            />

            {/* Right column: Card usage log */}
            <CardLog
              usedCardsLog={usedCardsLog}
              getCardInfo={getCardInfo}
              showCardInfo={showCardInfo}
            />
          </motion.div>
        </div>

        {/* Player hand */}
        <PlayerHand currentPlayerHand={currentPlayerHand} useCard={useCard} />

        {/* Card animations */}
        <CardAnimation
          activeCards={activeCards}
          isDrawingCard={isDrawingCard}
          drawnCard={drawnCard}
        />

        {/* Config Viewer Modal */}
        <ConfigViewer
          showConfig={showConfig}
          config={config}
          toggleConfigView={toggleConfigView}
        />

        {/* Pause overlay */}
        <PauseOverlay
          isPaused={isPaused}
          pausedBy={pausedBy}
          togglePause={togglePause}
        />
      </motion.div>
    </>
  );
};

export default QuizGame;