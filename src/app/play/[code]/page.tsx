"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Player,
  Card,
  Question,
  ScoreUpdate,
  GameSettings,
  GameMode,
  QuizPack,
  PlayerData,
} from "@/types/type";
import { powerCards } from "@/data/cardData";
import { DEFAULT_GAME_SETTINGS } from "@/data/gameConfig";
import { DEFAULT_QUIZ_PACKS } from "@/data/quizData";
import { GAME_MODES } from "@/data/modeData";
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
import { supabase } from "@/lib/supabaseClient";
import { loadPlayerData } from "@/hooks/useLocalStorage";

type PlayerPresence = Player & { presence_ref: string };

const QuizGame = () => {
  const { containerVariants } = useEnhancedAnimations();
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerHand, setCurrentPlayerHand] = useState<Card[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
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
  const [showConfig, setShowConfig] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);

  const [activeEffects, setActiveEffects] = useState<ActiveCardEffect[]>([]);
  const [gameModifiers, setGameModifiers] = useState<GameModifiers>({
    timeModifier: 0,
    cssEffects: [],
    scoreMultiplier: 1,
    removedAnswers: [],
    fakeAnswers: [],
    lockedAnswers: [],
  });

  const [config, setConfig] = useState<ExtendedGameConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomClosed, setRoomClosed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const leaderboardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answerPhaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const effectCleanupRef = useRef<NodeJS.Timeout[]>([]);
  const channelRef = useRef<any>(null);

  // Add refs to track the current state for cleanup
  const currentStateRef = useRef({
    showLeaderboardAfterAnswer: false,
    showCorrectAnswer: false,
    gameOver: false,
  });

  // Update the ref whenever state changes
  useEffect(() => {
    currentStateRef.current = {
      showLeaderboardAfterAnswer,
      showCorrectAnswer,
      gameOver,
    };
  }, [showLeaderboardAfterAnswer, showCorrectAnswer, gameOver]);

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

  const maxQuestions = config?.gameSettings.numberOfQuestion || questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  const canPlayCards = useMemo(() => {
    return (
      !isAnswered &&
      !showCorrectAnswer &&
      !showLeaderboardAfterAnswer &&
      !isPaused &&
      !gameOver &&
      timeLeft > 0
    );
  }, [isAnswered, showCorrectAnswer, showLeaderboardAfterAnswer, isPaused, gameOver, timeLeft]);

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

  // Check if all players have answered
  useEffect(() => {
    if (players.length > 0) {
      const answeredCount = players.filter(player => player.hasAnswered).length;
      const newAllPlayersAnswered = answeredCount === players.length;
      setAllPlayersAnswered(newAllPlayersAnswered);
    }
  }, [players]);

  // Load room data and validate player access
  const loadGameData = useCallback(async () => {
    try {
      setLoading(true);

      // Load player data from localStorage
      const localPlayerData = loadPlayerData();
      if (!localPlayerData || !localPlayerData.player.nickname || !localPlayerData.player.avatar) {
        showError("Player data not found. Redirecting to join page...");
        router.push(`/join/${roomCode}`);
        return;
      }

      setPlayerData(localPlayerData);
      setCurrentPlayerId(localPlayerData.player.id);
      setIsHost(localPlayerData.player.isHost || false);

      // Load room data from database
      const { data: roomData, error: roomError } = await supabase
        .from("room")
        .select("*")
        .eq("room_code", roomCode)
        .single();

      if (roomError || !roomData) {
        showError("Room not found");
        return;
      }

      // Check if room has password and validate it
      if (roomData.room_password) {
        const storedRoomSettings = localPlayerData?.roomSettings;
        const isPasswordValid = !!(
          storedRoomSettings &&
          storedRoomSettings.roomCode === roomCode &&
          storedRoomSettings.password === roomData.room_password
        );

        if (!isPasswordValid) {
          showError("Invalid room password. Redirecting to join page...");
          router.push(`/join/${roomCode}`);
          return;
        }
      }

      // Check if game is still active
      if (roomData.room_status === 'finished') {
        showError("Game has ended");
        return;
      }

      // Load game settings
      const parsedSettings: GameSettings = roomData.setting_list?.[0]
        ? JSON.parse(roomData.setting_list[0])
        : DEFAULT_GAME_SETTINGS;

      // Load quiz pack
      const quizPackId = roomData.quiz_pack || DEFAULT_QUIZ_PACKS[0].id;
      const selectedQuizPack =
        DEFAULT_QUIZ_PACKS.find((pack: QuizPack) => pack.id === quizPackId) ||
        DEFAULT_QUIZ_PACKS[0];

      // Load game mode
      const selectedGameMode = GAME_MODES.find(
        (mode: GameMode) => mode.id === roomData.game_mode
      ) || GAME_MODES[0] || null;

      // Load questions for the quiz pack
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_pack_id", quizPackId)
        .limit(parsedSettings.numberOfQuestion || 10);

      if (questionsError || !questionsData?.length) {
        showError("No questions found for this quiz pack");
        return;
      }

      const convertedQuestions: Question[] = questionsData.map((q, index) => ({
        id: index + 1,
        text: q.question,
        imageUrl: q.image_url || "",
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation || "",
      }));

      setQuestions(convertedQuestions);

      // Create extended game config
      const gameConfig: ExtendedGameConfig = {
        roomCode,
        players: [], // Will be populated from realtime
        gameSettings: { ...parsedSettings, selectedQuizPack },
        selectedGameMode,
      };

      setConfig(gameConfig);
      setCurrentQuestionIndex(roomData.current_question_index || 0);
      setIsPaused(roomData.is_paused || false);
      setGameOver(roomData.game_over || false);
      setTimeLeft(roomData.current_time_left || parsedSettings.timePerQuestion || 30);

      setLoading(false);
    } catch (err) {
      console.error("Error loading game data:", err);
      showError("Failed to load game data");
    }
  }, [roomCode, showError, router]);

  // Broadcast timer updates to all players (host only)
  const broadcastTimeUpdate = useCallback(async (time: number) => {
    if (!channelRef.current || !isHost) return;

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'timer_update',
        payload: {
          roomCode,
          timeLeft: time,
        }
      });
    } catch (error) {
      console.error("Error broadcasting time update:", error);
    }
  }, [roomCode, isHost]);

  // Update game state in database (host only)
  const updateGameState = useCallback(
    async (updates: {
      current_question_index?: number;
      is_paused?: boolean;
      game_over?: boolean;
      room_status?: string;
      current_time_left?: number;
    }) => {
      if (!isHost || !channelRef.current) return;

      try {
        // Update database
        await supabase.from("room").update(updates).eq("room_code", roomCode);

        // Broadcast to all players
        await channelRef.current.send({
          type: 'broadcast',
          event: 'game_state_update',
          payload: {
            roomCode,
            ...updates,
          }
        });
      } catch (error) {
        console.error("Error updating game state:", error);
      }
    },
    [roomCode, isHost]
  );

  // Setup realtime subscriptions for players
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!roomCode || !playerData?.player?.id) return;

    const channel = supabase.channel(`room:${roomCode}`);

    const updatePlayers = () => {
      const state = channel.presenceState();
      const playerMap = new Map<number, Player>();
      
      for (const key in state) {
        const presences = state[key] as PlayerPresence[];
        if (presences[0]) {
          const { presence_ref, ...player } = presences[0];
          playerMap.set(player.id, {
            ...player,
            hasAnswered: player.hasAnswered || false,
            selectedAnswer: player.selectedAnswer || undefined,
          });
        }
      }
      
      setPlayers(Array.from(playerMap.values()));
    };

    channel
      .on("presence", { event: "sync" }, updatePlayers)
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const { presence_ref, ...newPlayer } = newPresences[0] as PlayerPresence;
        setPlayers((prev) => {
          if (prev.some((p) => p.id === newPlayer.id)) return prev;
          return [...prev, {
            ...newPlayer,
            hasAnswered: newPlayer.hasAnswered || false,
            selectedAnswer: newPlayer.selectedAnswer || undefined,
          }];
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const { presence_ref, ...leftPlayer } = leftPresences[0] as PlayerPresence;
        setPlayers((prev) => prev.filter((p) => p.id !== leftPlayer.id));
        
        // If host left, mark room as closed
        if (leftPlayer.isHost) {
          setRoomClosed(true);
        }
      })
      // Listen for game state updates
      .on("broadcast", { event: "game_state_update" }, ({ payload }) => {
        if (payload.roomCode === roomCode) {
          if (payload.currentQuestionIndex !== undefined) {
            setCurrentQuestionIndex(payload.currentQuestionIndex);
          }
          if (payload.isPaused !== undefined) {
            setIsPaused(payload.isPaused);
            if (payload.pausedBy) {
              setPausedBy(payload.pausedBy);
            }
          }
          if (payload.gameOver !== undefined) {
            setGameOver(payload.gameOver);
          }
          if (payload.timeLeft !== undefined) {
            setTimeLeft(payload.timeLeft);
          }
        }
      })
      // Listen for timer updates
      .on("broadcast", { event: "timer_update" }, ({ payload }) => {
        if (payload.roomCode === roomCode) {
          setTimeLeft(payload.timeLeft);
        }
      })
      // Listen for player answer updates
      .on("broadcast", { event: "player_answer" }, ({ payload }) => {
        if (payload.roomCode === roomCode) {
          setPlayers((prev) =>
            prev.map((player) =>
              player.id === payload.playerId
                ? {
                    ...player,
                    hasAnswered: true,
                    selectedAnswer: payload.selectedAnswer,
                    score: payload.score || player.score,
                  }
                : player
            )
          );
        }
      })
      // Listen for card usage
      .on("broadcast", { event: "card_used" }, ({ payload }) => {
        if (payload.roomCode === roomCode && payload.playerId !== playerData.player.id) {
          // Show card usage animation for other players
          setUsedCardsLog((prev) => [
            ...prev,
            {
              playerName: payload.playerName,
              cardTitle: payload.cardName,
              round: currentQuestionIndex + 1,
              questionNumber: currentQuestionIndex + 1,
              cardDescription: payload.cardDescription,
            },
          ]);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track current player presence
          await channel.track({
            id: playerData.player.id,
            nickname: playerData.player.nickname,
            avatar: playerData.player.avatar,
            isHost: playerData.player.isHost,
            score: playerData.player.score || 0,
            cards: playerData.player.cards || 0,
            hasAnswered: false,
            selectedAnswer: undefined,
          });
        }
      });

    channelRef.current = channel;

    // Also listen for kick notifications on personal channel
    const personalChannel = supabase.channel(`player:${playerData.player.id}`);
    personalChannel
      .on('broadcast', { event: 'kicked' }, (payload) => {
        if (payload.payload.roomCode === roomCode) {
          alert("You have been kicked from the room by the host.");
          router.push("/?message=kicked");
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      personalChannel.unsubscribe();
    };
  }, [roomCode, playerData, currentQuestionIndex, router]);

  // Update player score in database
  const updatePlayerScore = useCallback(
    async (playerId: number, scoreChange: number) => {
      if (!channelRef.current) return;

      try {
        // Broadcast score update to all players
        await channelRef.current.send({
          type: 'broadcast',
          event: 'player_answer',
          payload: {
            roomCode,
            playerId,
            score: scoreChange,
          }
        });
      } catch (error) {
        console.error("Error updating player score:", error);
      }
    },
    [roomCode]
  );

  // Broadcast card usage to other players
  const broadcastCardUsage = useCallback(
    async (card: Card) => {
      if (!channelRef.current || !playerData) return;

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'card_used',
          payload: {
            roomCode,
            playerId: playerData.player.id,
            playerName: playerData.player.nickname,
            cardName: card.name,
            cardDescription: card.description,
          }
        });
      } catch (error) {
        console.error("Error broadcasting card usage:", error);
      }
    },
    [roomCode, playerData]
  );

  // Load data on mount
  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Setup realtime subscriptions after data is loaded
  useEffect(() => {
    if (!loading && !error && playerData) {
      const cleanup = setupRealtimeSubscriptions();
      return cleanup;
    }
  }, [loading, error, playerData, setupRealtimeSubscriptions]);

  const applyCardEffect = useCallback(
    (card: Card, cardData: Card) => {
      const effectId = `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
          setTimeLeft((prev) => {
            const newTime = Math.max(1, prev + effect.value);
            if (isHost) {
              broadcastTimeUpdate(newTime);
            }
            return newTime;
          });
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

          const cssTimeout = setTimeout(() => {
            setActiveEffects((prev) => prev.filter((e) => e.id !== effectId));
            setGameModifiers((prev) => ({
              ...prev,
              cssEffects: prev.cssEffects.filter((css) => css !== effect.effect),
            }));
          }, 5000);

          effectCleanupRef.current.push(cssTimeout);
          break;

        case "score":
          if (effect.value === -50) {
            setPlayers((prev) =>
              prev.map((player) => {
                if (player.id === currentPlayerId) {
                  return { ...player, score: Math.max(0, player.score + 50) };
                } else if (player.id !== currentPlayerId) {
                  return { ...player, score: Math.max(0, player.score - 50) };
                }
                return player;
              })
            );

            setScoreUpdates((prev) => [
              ...prev,
              { playerId: currentPlayerId!, points: 50, animationId: `steal-gain-${effectId}` },
            ]);
          } else {
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
            const wrongAnswers = currentQuestion.options
              .map((_, index) => index)
              .filter((index) => index !== currentQuestion.correctAnswer);

            const answersToRemove = wrongAnswers.slice(0, effect.count || 1);
            setGameModifiers((prev) => ({
              ...prev,
              removedAnswers: [...prev.removedAnswers, ...answersToRemove],
            }));
          } else if (effect.mode === "fake") {
            const fakeAnswers = Array(effect.count || 1)
              .fill(0)
              .map((_, i) => `Đáp án giả ${i + 1}`);

            setGameModifiers((prev) => ({
              ...prev,
              fakeAnswers: [...prev.fakeAnswers, ...fakeAnswers],
            }));
          } else if (effect.mode === "lock") {
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
    [currentQuestion, gameModifiers.lockedAnswers, currentPlayerId, isHost, broadcastTimeUpdate]
  );

  const clearQuestionEffects = useCallback(() => {
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

  useEffect(() => {
    clearQuestionEffects();
  }, [currentQuestionIndex, clearQuestionEffects]);

  useEffect(() => {
    if (config && currentQuestionIndex + 1 >= config.gameSettings.numberOfQuestion) {
      if (showLeaderboardAfterAnswer) {
        const gameOverTimer = setTimeout(() => {
          setGameOver(true);
          updateGameState({ game_over: true, room_status: 'finished' });
        }, 5000);
        return () => clearTimeout(gameOverTimer);
      }
    }
  }, [currentQuestionIndex, config, showLeaderboardAfterAnswer, updateGameState]);

  const goToNextQuestion = useCallback(() => {
    if (gameOver || currentQuestionIndex + 1 >= maxQuestions) {
      setGameOver(true);
      updateGameState({ game_over: true, room_status: 'finished' });
      return;
    }

    const nextQuestionIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextQuestionIndex);
    const newTime = config?.gameSettings.timePerQuestion || 30;
    setTimeLeft(newTime);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowCorrectAnswer(false);
    setRoundScore(0);
    setAllPlayersAnswered(false);

    // Reset player answer states but keep scores
    setPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        hasAnswered: false,
        selectedAnswer: undefined,
      }))
    );

    if (isHost) {
      updateGameState({ 
        current_question_index: nextQuestionIndex,
        current_time_left: newTime 
      });
      broadcastTimeUpdate(newTime);
    }

    clearQuestionEffects();
  }, [currentQuestionIndex, maxQuestions, config, gameOver, clearQuestionEffects, isHost, updateGameState, broadcastTimeUpdate]);

  const handleAnswerSelect = useCallback(
    async (optionIndex: number) => {
      if (isAnswered || !currentQuestion || gameOver || !currentPlayerId) return;

      setSelectedAnswer(optionIndex);
      setIsAnswered(true);
      setShowCorrectAnswer(true);

      // Update local player state
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === currentPlayerId
            ? { ...player, hasAnswered: true, selectedAnswer: optionIndex }
            : player
        )
      );

      // Broadcast answer to other players
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'player_answer',
          payload: {
            roomCode,
            playerId: currentPlayerId,
            selectedAnswer: optionIndex,
          }
        });
      }

      const isCorrect = optionIndex === currentQuestion.correctAnswer;
      let earnedScore = 0;

      if (isCorrect) {
        earnedScore = Math.round(100 * gameModifiers.scoreMultiplier);
        setRoundScore(earnedScore);

        // Update score
        updatePlayerScore(currentPlayerId, earnedScore);

        // Draw a card if game mode allows it
        if (config?.selectedGameMode && config.selectedGameMode.id === 1) { // Assuming mode 1 has cards
          const randomCard: Card = {
            ...allCards[Math.floor(Math.random() * allCards.length)],
            uniqueId: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };

          setDrawnCard(randomCard);
          setIsDrawingCard(true);

          setTimeout(() => {
            setCurrentPlayerHand((prev) => [...prev, randomCard]);
            setIsDrawingCard(false);
            setDrawnCard(null);
            setPlayers((prev) =>
              prev.map((player) =>
                player.id === currentPlayerId ? { ...player, cards: player.cards + 1 } : player
              )
            );
          }, 1500);
        }
      }

      // Only show score updates when all players have answered or time runs out
      // This will be handled in a separate useEffect
    },
    [
      isAnswered,
      currentQuestion,
      gameOver,
      gameModifiers.scoreMultiplier,
      allCards,
      currentPlayerId,
      updatePlayerScore,
      roomCode,
      config,
    ]
  );

  // EMERGENCY BACKUP: Force transition if stuck on leaderboard too long
  useEffect(() => {
    let emergencyTimeout: NodeJS.Timeout | null = null;
    
    if (showLeaderboardAfterAnswer && !gameOver) {
      console.log('Emergency backup timer started (10s)...');
      emergencyTimeout = setTimeout(() => {
        console.log('EMERGENCY: Forcing transition from leaderboard!');
        setShowLeaderboardAfterAnswer(false);
        setScoreUpdates([]);
        goToNextQuestion();
      }, 10000); // 10 seconds emergency backup
    }

    return () => {
      if (emergencyTimeout) {
        clearTimeout(emergencyTimeout);
      }
    };
  }, [showLeaderboardAfterAnswer, gameOver, goToNextQuestion]);

  // SIMPLIFIED: Show leaderboard when all players have answered or time runs out
  useEffect(() => {
    console.log('Leaderboard effect triggered:', {
      allPlayersAnswered,
      timeLeft,
      isAnswered,
      showLeaderboardAfterAnswer,
      showCorrectAnswer,
      gameOver,
      isPaused
    });

    // Clear any existing timers to prevent conflicts
    if (answerPhaseTimerRef.current) {
      clearTimeout(answerPhaseTimerRef.current);
      answerPhaseTimerRef.current = null;
    }
    if (leaderboardTimerRef.current) {
      clearTimeout(leaderboardTimerRef.current);
      leaderboardTimerRef.current = null;
    }

    // Simplified condition: if all answered OR time is 0, and someone answered
    const readyForLeaderboard = (allPlayersAnswered || timeLeft === 0) && 
                               isAnswered && 
                               !gameOver && 
                               !isPaused;

    if (readyForLeaderboard && showCorrectAnswer && !showLeaderboardAfterAnswer) {
      console.log('Starting answer phase timer (2s)...');
      
      answerPhaseTimerRef.current = setTimeout(() => {
        console.log('Moving to leaderboard...');
        setShowCorrectAnswer(false);
        setShowLeaderboardAfterAnswer(true);

        // Add score updates if player earned points
        if (roundScore > 0 && currentPlayerId) {
          const animationId = `score-${Date.now()}`;
          setScoreUpdates([{ playerId: currentPlayerId, points: roundScore, animationId }]);
        }

        // Force move to next question after 4 seconds
        leaderboardTimerRef.current = setTimeout(() => {
          console.log('Forcing move to next question...');
          setShowLeaderboardAfterAnswer(false);
          setScoreUpdates([]);
          goToNextQuestion();
        }, 4000);
      }, 2000);
    }

    return () => {
      if (answerPhaseTimerRef.current) {
        clearTimeout(answerPhaseTimerRef.current);
        answerPhaseTimerRef.current = null;
      }
      if (leaderboardTimerRef.current) {
        clearTimeout(leaderboardTimerRef.current);
        leaderboardTimerRef.current = null;
      }
    };
  }, [allPlayersAnswered, timeLeft, isAnswered, showLeaderboardAfterAnswer, showCorrectAnswer, gameOver, isPaused, roundScore, currentPlayerId, goToNextQuestion]);

  const togglePause = useCallback(async () => {
    if (gameOver) return;

    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (!isPaused && playerData) {
      setPausedBy(playerData.player.nickname);
    }

    if (isHost) {
      await updateGameState({ is_paused: newPausedState });
      
      // Broadcast current time when pausing/resuming
      broadcastTimeUpdate(timeLeft);
    }
  }, [isPaused, playerData, gameOver, isHost, updateGameState, timeLeft, broadcastTimeUpdate]);

  const useCard = useCallback(
    async (card: Card) => {
      if (!canPlayCards) {
        toast.error("Không thể sử dụng thẻ sau khi trả lời", {
          icon: "⏱️",
          duration: 3000,
        });
        return;
      }

      const cardData = powerCards.find((pc) => pc.name === card.name);
      if (!cardData) {
        console.error(`Card not found for: ${card.name}`);
        return;
      }

      const animationId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Apply card effect
      applyCardEffect(card, cardData);

      // Update card usage log
      setUsedCardsLog((prev) => [
        ...prev,
        {
          playerName: playerData?.player.nickname || "",
          cardTitle: card.name,
          round: currentQuestionIndex + 1,
          questionNumber: currentQuestionIndex + 1,
          cardDescription: card.description,
        },
      ]);

      // Remove card from hand
      setCurrentPlayerHand((prev) => prev.filter((c) => c.uniqueId !== card.uniqueId));
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === currentPlayerId ? { ...player, cards: player.cards - 1 } : player
        )
      );

      // Broadcast card usage to other players
      await broadcastCardUsage(card);

      // Show card animation
      setActiveCards((prev) => [...prev, { card, id: animationId }]);
      setTimeout(() => {
        setActiveCards((prev) => prev.filter((ac) => ac.id !== animationId));
      }, 2000);
    },
    [
      canPlayCards,
      playerData,
      currentQuestionIndex,
      applyCardEffect,
      currentPlayerId,
      broadcastCardUsage,
    ]
  );

  const goHome = useCallback(() => router.push("/"), [router]);

  const restartGame = useCallback(async () => {
    if (!isHost) return;

    // Clear all timers
    [timerRef, leaderboardTimerRef, answerPhaseTimerRef].forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });

    clearQuestionEffects();

    // Reset game state
    const initialTime = config?.gameSettings.timePerQuestion || 30;
    setCurrentQuestionIndex(0);
    setTimeLeft(initialTime);
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
    setAllPlayersAnswered(false);

    // Reset players scores and answer states
    setPlayers((prev) =>
      prev.map((player) => ({
        ...player,
        score: 0,
        cards: 0,
        hasAnswered: false,
        selectedAnswer: undefined,
      }))
    );

    // Update database
    try {
      await supabase
        .from("room")
        .update({
          current_question_index: 0,
          current_time_left: initialTime,
          is_paused: false,
          game_over: false,
          room_status: 'playing',
        })
        .eq("room_code", roomCode);

      // Broadcast restart to all players
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'game_state_update',
          payload: {
            roomCode,
            currentQuestionIndex: 0,
            isPaused: false,
            gameOver: false,
            timeLeft: initialTime,
          }
        });
      }
    } catch (error) {
      console.error("Error restarting game:", error);
    }
  }, [config, clearQuestionEffects, isHost, roomCode]);

  const getCardInfo = useCallback(
    (name: string) => {
      return allCards.find((card) => card.name === name);
    },
    [allCards]
  );

  const showCardInfo = useCallback((cardTitle: string, description: string) => {
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

// FIXED: Timer effect - Only host manages the timer
useEffect(() => {
  // Clear existing timer
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  if (isHost) {
    const shouldRunTimer = timeLeft > 0 &&
                          !allPlayersAnswered &&
                          !isPaused &&
                          !showLeaderboardAfterAnswer &&
                          !gameOver;

    if (shouldRunTimer) {
      timerRef.current = setTimeout(() => {
        const newTime = timeLeft - 1;
        setTimeLeft(newTime);
        broadcastTimeUpdate(newTime);
        
        // When time runs out, mark all unanswered players as answered with -1
        if (newTime === 0) {
          setPlayers((prev) =>
            prev.map((player) =>
              !player.hasAnswered ? { ...player, hasAnswered: true, selectedAnswer: -1 } : player
            )
          );
        }
      }, 1000);
    }
  }

  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
}, [
  timeLeft,
  allPlayersAnswered,
  isPaused,
  showLeaderboardAfterAnswer,
  gameOver,
  isHost,
  broadcastTimeUpdate
]);

  // Score updates effect
  useEffect(() => {
    scoreUpdates.forEach((update) => {
      setTimeout(() => {
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.id === update.playerId ? { ...player, score: player.score + update.points } : player
          )
        );
      }, 1000);
    });
  }, [scoreUpdates]);

  // FIXED: Cleanup effect
  useEffect(() => {
    return () => {
      // Clear all timers with proper null checks
      [timerRef, leaderboardTimerRef, answerPhaseTimerRef].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          ref.current = null;
        }
      });
      
      // Clear effect cleanup timers
      effectCleanupRef.current.forEach((timeout) => clearTimeout(timeout));
      effectCleanupRef.current = [];

      // Unsubscribe from channels
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Loading state
  if (loading) return <LoadingState />;
  
  // Error state
  if (error) return <ErrorState error={error} />;

  // Room closed state
  if (roomClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="bg-gray-800 p-8 rounded-xl text-center border border-white/20 shadow-xl">
          <p className="text-xl mb-4">The host has left the room.</p>
          <p className="mb-6">The room no longer exists.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goHome}
            className="bg-blue-500 px-6 py-3 rounded-lg font-medium"
          >
            Go Home
          </motion.button>
        </div>
      </div>
    );
  }

  // No questions state
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

  // Game over state
  if (gameOver) {
    return <GameOver players={players} onGoHome={goHome} onRestart={restartGame} />;
  }

  const getModifiedQuestion = () => {
    if (!currentQuestion) return currentQuestion;

    let modifiedOptions: (string | null)[] = [...currentQuestion.options];

    if (gameModifiers.removedAnswers.length > 0) {
      modifiedOptions = modifiedOptions.map((option, index) =>
        gameModifiers.removedAnswers.includes(index) ? null : option
      );
    }

    const filteredOptions: string[] = modifiedOptions.filter((opt): opt is string => opt !== null);

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
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <motion.div
        className="relative min-h-screen w-full font-sans flex flex-col p-4 overflow-auto lg:overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          filter: gameModifiers.cssEffects.includes("blur(4px)") ? "blur(4px)" : undefined,
          transform: gameModifiers.cssEffects.includes("transform: rotate(180deg)")
            ? "rotate(180deg)"
            : undefined,
        }}
      >
        <div className="max-w-6xl mx-auto flex-1 flex flex-col w-full min-h-0">
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

          <motion.div
            className="flex-1 flex flex-col lg:flex-row gap-6 overflow-auto lg:overflow-hidden min-h-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <PlayerList
              players={players}
              scoreUpdates={scoreUpdates}
              showLeaderboardAfterAnswer={showLeaderboardAfterAnswer}
              roundScore={roundScore}
              showLeaderboard={showLeaderboardAfterAnswer || (timeLeft === 0 && isAnswered)}
            />

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
              allPlayersAnswered={allPlayersAnswered}
            />

            <CardLog usedCardsLog={usedCardsLog} getCardInfo={getCardInfo} showCardInfo={showCardInfo} />
          </motion.div>
        </div>

        <PlayerHand currentPlayerHand={currentPlayerHand} useCard={useCard} />

        <CardAnimation activeCards={activeCards} isDrawingCard={isDrawingCard} drawnCard={drawnCard} />

        <ConfigViewer showConfig={showConfig} config={config} toggleConfigView={toggleConfigView} />

        <PauseOverlay isPaused={isPaused} pausedBy={pausedBy} togglePause={togglePause} />
      </motion.div>
    </>
  );
};

export default QuizGame;