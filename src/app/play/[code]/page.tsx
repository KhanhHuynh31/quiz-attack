"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
import PlayerHand from "@/components/play/PlayerHand";
import CardAnimation from "@/components/play/CardAnimation";
import PauseOverlay from "@/components/play/PauseOverPlay";
import GameOver from "@/components/play/GameOver";
import { supabase } from "@/lib/supabaseClient";
import { loadPlayerData } from "@/hooks/useLocalStorage";
import CardLogAndChat from "@/components/play/CardLogAndChat";

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
  const currentStateRef = useRef({
    showLeaderboardAfterAnswer: false,
    showCorrectAnswer: false,
    gameOver: false,
  });
  const previousPlayerOrderRef = useRef<string>("");
  const lastHostSeenRef = useRef<number>(Date.now());
  const hostCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentStateRef.current = {
      showLeaderboardAfterAnswer,
      showCorrectAnswer,
      gameOver,
    };
  }, [showLeaderboardAfterAnswer, showCorrectAnswer, gameOver]);

  const allowedCards = useMemo(() => {
    if (
      !config?.gameSettings.allowedCards ||
      config.gameSettings.allowedCards.length === 0
    ) {
      return powerCards;
    }
    return powerCards.filter((card) =>
      config.gameSettings.allowedCards.includes(String(card.id))
    );
  }, [config?.gameSettings.allowedCards]);

  const maxQuestions =
    config?.gameSettings.numberOfQuestion || questions.length;
  const currentQuestion = questions[currentQuestionIndex];

  const sortedPlayers = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const currentOrder = sorted.map((p) => `${p.id}-${p.score}`).join(",");

    if (currentOrder !== previousPlayerOrderRef.current) {
      previousPlayerOrderRef.current = currentOrder;
      return sorted;
    }

    return previousPlayerOrderRef.current ? sorted : sorted;
  }, [players]);

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

  const allPlayersAnsweredMemo = useMemo(() => {
    if (players.length === 0) return false;
    return (
      players.filter((player) => player.hasAnswered).length === players.length
    );
  }, [players]);

  useEffect(() => {
    setAllPlayersAnswered(allPlayersAnsweredMemo);
  }, [allPlayersAnsweredMemo]);

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

  const updatePlayersWithOptimization = useCallback(
    (updater: (prev: Player[]) => Player[]) => {
      setPlayers((prevPlayers) => {
        const newPlayers = updater(prevPlayers);

        const hasChanges =
          JSON.stringify(prevPlayers) !== JSON.stringify(newPlayers);
        if (isHost && hasChanges) {
          const saveToDatabase = async () => {
            try {
              const playerList = newPlayers.map((player) =>
                JSON.stringify({
                  id: player.id,
                  nickname: player.nickname,
                  avatar: player.avatar,
                  score: player.score,
                  cards: player.cards,
                  isHost: player.isHost || false,
                })
              );

              await supabase
                .from("room")
                .update({ player_list: playerList })
                .eq("room_code", roomCode);
            } catch (error) {
              console.error("Error saving player scores:", error);
            }
          };

          saveToDatabase();
        }

        return newPlayers;
      });
    },
    [isHost, roomCode]
  );

  const loadPlayerScoresFromDatabase = useCallback(async () => {
    try {
      const { data: roomData, error } = await supabase
        .from("room")
        .select("player_list")
        .eq("room_code", roomCode)
        .single();

      if (error || !roomData?.player_list) {
        console.error("No saved player scores found");
        return {};
      }

      const playerScores: { [key: number]: { score: number; cards: number } } =
        {};

      roomData.player_list.forEach((playerJson: string) => {
        try {
          const playerData = JSON.parse(playerJson);
          playerScores[playerData.id] = {
            score: playerData.score || 0,
            cards: playerData.cards || 0,
          };
        } catch (parseError) {
          console.error("Error parsing player data:", parseError);
        }
      });

      return playerScores;
    } catch (error) {
      console.error("Error loading player scores:", error);
      return {};
    }
  }, [roomCode]);
  const handleTimeCardEffect = useCallback(
    async (card: Card, effect: any) => {
      if (!isHost) {
        // Non-host players send request to host
        if (channelRef.current) {
          await channelRef.current.send({
            type: "broadcast",
            event: "time_card_request",
            payload: {
              roomCode,
              cardEffect: effect,
              playerId: currentPlayerId,
              playerName: playerData?.player.nickname,
            },
          });
        }
        return;
      }

      // Host handles the time effect
      let newTime = timeLeft;

      // Handle 100% reset case first (highest priority)
      if (effect.value === "100%") {
        // Reset to full time from game settings
        newTime = config?.gameSettings.timePerQuestion || 30;
      } else if (
        typeof effect.value === "string" &&
        effect.value.includes("%")
      ) {
        // Handle other percentage cases
        const percent = parseInt(effect.value.replace("%", ""), 10);
        newTime = Math.max(
          1,
          timeLeft + Math.floor((timeLeft * percent) / 100)
        );
      } else if (typeof effect.value === "number") {
        // Handle fixed number additions/subtractions
        newTime = Math.max(1, timeLeft + effect.value);
      }

      setTimeLeft(newTime);

      // Broadcast time update manually since broadcastTimeUpdate isn't available yet
      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: "broadcast",
            event: "timer_update",
            payload: {
              roomCode,
              timeLeft: newTime,
            },
          });
        } catch (error) {
          console.error("Error broadcasting time update:", error);
        }
      }

      // Update database manually since updateGameState isn't available yet
      try {
        await supabase
          .from("room")
          .update({ current_time_left: newTime })
          .eq("room_code", roomCode);
      } catch (error) {
        console.error("Error updating game state:", error);
      }

      // Create effect tracking
      const effectId = `time-effect-${Date.now()}`;
      const timeEffect: ActiveCardEffect = {
        id: effectId,
        type: "time",
        effect,
        startTime: Date.now(),
        targetPlayer: 1,
        expiresAtQuestionEnd: true,
      };

      setActiveEffects((prev) => [...prev, timeEffect]);
    },
    [isHost, timeLeft, config, roomCode, currentPlayerId, playerData]
  );

  const loadGameData = useCallback(async () => {
    try {
      setLoading(true);

      const localPlayerData = loadPlayerData();
      if (
        !localPlayerData ||
        !localPlayerData.player.nickname ||
        !localPlayerData.player.avatar
      ) {
        showError("Player data not found. Redirecting to join page...");
        router.push(`/join/${roomCode}`);
        return;
      }

      setPlayerData(localPlayerData);
      setCurrentPlayerId(localPlayerData.player.id);
      setIsHost(localPlayerData.player.isHost || false);

      const { data: roomData, error: roomError } = await supabase
        .from("room")
        .select("*")
        .eq("room_code", roomCode)
        .single();

      if (roomError || !roomData) {
        showError("Room not found");
        return;
      }

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

      if (roomData.room_status === "finished") {
        showError("Game has ended");
        return;
      }

      const parsedSettings: GameSettings = roomData.setting_list?.[0]
        ? JSON.parse(roomData.setting_list[0])
        : DEFAULT_GAME_SETTINGS;

      const quizPackId = roomData.quiz_pack || DEFAULT_QUIZ_PACKS[0].id;
      const selectedQuizPack =
        DEFAULT_QUIZ_PACKS.find((pack: QuizPack) => pack.id === quizPackId) ||
        DEFAULT_QUIZ_PACKS[0];

      const selectedGameMode =
        GAME_MODES.find((mode: GameMode) => mode.id === roomData.game_mode) ||
        GAME_MODES[0] ||
        null;

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

      const gameConfig: ExtendedGameConfig = {
        roomCode,
        players: [],
        gameSettings: { ...parsedSettings, selectedQuizPack },
        selectedGameMode,
      };

      setConfig(gameConfig);
      setCurrentQuestionIndex(roomData.current_question_index || 0);
      setIsPaused(roomData.is_paused || false);
      setGameOver(roomData.game_over || false);
      setTimeLeft(
        roomData.current_time_left || parsedSettings.timePerQuestion || 30
      );

      setLoading(false);
    } catch (err) {
      console.error("Error loading game data:", err);
      showError("Failed to load game data");
    }
  }, [roomCode, showError, router]);

  const broadcastTimeUpdate = useCallback(
    async (time: number) => {
      if (!channelRef.current || !isHost) return;

      try {
        await channelRef.current.send({
          type: "broadcast",
          event: "timer_update",
          payload: {
            roomCode,
            timeLeft: time,
          },
        });
      } catch (error) {
        console.error("Error broadcasting time update:", error);
      }
    },
    [roomCode, isHost]
  );

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
        await supabase.from("room").update(updates).eq("room_code", roomCode);

        await channelRef.current.send({
          type: "broadcast",
          event: "game_state_update",
          payload: {
            roomCode,
            ...updates,
          },
        });
      } catch (error) {
        console.error("Error updating game state:", error);
      }
    },
    [roomCode, isHost]
  );

  const trackHostPresence = useCallback(
    (presences: any[]) => {
      const hostPresent = presences.some((p) => p.isHost);
      if (hostPresent) {
        lastHostSeenRef.current = Date.now();

        if (hostCheckTimeoutRef.current) {
          clearTimeout(hostCheckTimeoutRef.current);
          hostCheckTimeoutRef.current = null;
        }
      } else if (!isHost) {
        const timeSinceLastHostSeen = Date.now() - lastHostSeenRef.current;

        if (timeSinceLastHostSeen > 3000) {
          if (!hostCheckTimeoutRef.current) {
            hostCheckTimeoutRef.current = setTimeout(() => {
              const finalCheck = Date.now() - lastHostSeenRef.current;
              if (finalCheck > 5000) {
                setRoomClosed(true);
              }
            }, 2000);
          }
        }
      }
    },
    [isHost]
  );

  const setupRealtimeSubscriptions = useCallback(async () => {
    if (!roomCode || !playerData?.player?.id) return;

    const savedScores = await loadPlayerScoresFromDatabase();
    const channel = supabase.channel(`room:${roomCode}`);

    let updateTimeout: NodeJS.Timeout | null = null;

    const updatePlayers = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      updateTimeout = setTimeout(() => {
        const state = channel.presenceState();
        const playerMap = new Map<number, Player>();
        const allPresences: any[] = [];

        for (const key in state) {
          const presences = state[key] as PlayerPresence[];
          if (presences[0]) {
            const { presence_ref, ...player } = presences[0];
            allPresences.push(player);
            const savedPlayerData = savedScores[player.id];

            playerMap.set(player.id, {
              ...player,
              hasAnswered: player.hasAnswered || false,
              selectedAnswer: player.selectedAnswer || undefined,
              score: savedPlayerData?.score ?? player.score ?? 0,
              cards: savedPlayerData?.cards ?? player.cards ?? 0,
            });
          }
        }

        trackHostPresence(allPresences);

        const updatedPlayers = Array.from(playerMap.values());
        updatePlayersWithOptimization(() => updatedPlayers);
      }, 100);
    };

    channel
      .on("presence", { event: "sync" }, updatePlayers)
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const { presence_ref, ...newPlayer } =
          newPresences[0] as PlayerPresence;

        trackHostPresence([newPlayer]);

        updatePlayersWithOptimization((prev) => {
          if (prev.some((p) => p.id === newPlayer.id)) return prev;

          const savedPlayerData = savedScores[newPlayer.id];
          const playerWithScores = {
            ...newPlayer,
            hasAnswered: newPlayer.hasAnswered || false,
            selectedAnswer: newPlayer.selectedAnswer || undefined,
            score: savedPlayerData?.score ?? newPlayer.score ?? 0,
            cards: savedPlayerData?.cards ?? newPlayer.cards ?? 0,
          };

          return [...prev, playerWithScores];
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const { presence_ref, ...leftPlayer } =
          leftPresences[0] as PlayerPresence;

        updatePlayersWithOptimization((prev) =>
          prev.filter((p) => p.id !== leftPlayer.id)
        );

        if (leftPlayer.isHost && !isHost) {
          setTimeout(() => {
            const currentState = channel.presenceState();
            const hostStillPresent = Object.values(currentState).some(
              (presences: any) => presences.some((p: any) => p.isHost)
            );

            if (!hostStillPresent) {
              setRoomClosed(true);
            }
          }, 3000);
        }
      })

      .on("broadcast", { event: "css_card_request" }, async ({ payload }) => {
        if (payload.roomCode === roomCode && isHost) {
          const { cardEffect, playerId, playerName, effectId } = payload;

          const cssEffect: ActiveCardEffect = {
            id: effectId,
            type: "css",
            effect: cardEffect,
            duration: Math.max(1000, timeLeft * 1000),
            startTime: Date.now(),
            targetPlayer: 0,
            expiresAtQuestionEnd: true,
          };

          setActiveEffects((prev) => [...prev, cssEffect]);
          setGameModifiers((prev) => ({
            ...prev,
            cssEffects: [...prev.cssEffects, cardEffect.effect],
          }));

          if (channelRef.current) {
            await channelRef.current.send({
              type: "broadcast",
              event: "css_effect_applied",
              payload: {
                roomCode,
                effect: cssEffect,
                cssEffectType: cardEffect.effect,
              },
            });
          }

          const cssTimeout = setTimeout(() => {
            setActiveEffects((prev) => prev.filter((e) => e.id !== effectId));
            setGameModifiers((prev) => ({
              ...prev,
              cssEffects: prev.cssEffects.filter(
                (css) => css !== cardEffect.effect
              ),
            }));

            if (channelRef.current) {
              channelRef.current.send({
                type: "broadcast",
                event: "css_effect_removed",
                payload: {
                  roomCode,
                  effectId: effectId,
                },
              });
            }
          }, Math.max(1000, timeLeft * 1000));

          effectCleanupRef.current.push(cssTimeout);
        }
      })
      .on("broadcast", { event: "css_effect_applied" }, ({ payload }) => {
        if (payload.roomCode === roomCode) {
          const { effect, cssEffectType } = payload;

          setActiveEffects((prev) => [...prev, effect]);
          setGameModifiers((prev) => ({
            ...prev,
            cssEffects: [...prev.cssEffects, cssEffectType],
          }));

          const cssTimeout = setTimeout(() => {
            setActiveEffects((prev) => prev.filter((e) => e.id !== effect.id));
            setGameModifiers((prev) => ({
              ...prev,
              cssEffects: prev.cssEffects.filter(
                (css) => css !== cssEffectType
              ),
            }));
          }, effect.duration);

          effectCleanupRef.current.push(cssTimeout);
        }
      })
      .on("broadcast", { event: "css_effect_removed" }, ({ payload }) => {
        if (payload.roomCode === roomCode) {
          const { effectId } = payload;

          setActiveEffects((prev) => prev.filter((e) => e.id !== effectId));
          setGameModifiers((prev) => ({
            ...prev,
            cssEffects: prev.cssEffects.filter(
              (css) =>
                !activeEffectsRef.current.some(
                  (e) => e.id === effectId && e.type === "css"
                )
            ),
          }));
        }
      })
      .on("broadcast", { event: "game_state_update" }, ({ payload }) => {
        if (payload.roomCode === roomCode) {
          if (payload.current_question_index !== undefined) {
            setCurrentQuestionIndex(payload.current_question_index);
          }
          if (payload.is_paused !== undefined) {
            setIsPaused(payload.is_paused);
            if (payload.pausedBy) {
              setPausedBy(payload.pausedBy);
            }
          }
          if (payload.game_over !== undefined) {
            setGameOver(payload.game_over);
          }
          if (payload.current_time_left !== undefined) {
            setTimeLeft(payload.current_time_left);
          }
        }
      })
      .on("broadcast", { event: "timer_update" }, ({ payload }) => {
        if (payload.roomCode === roomCode) {
          setTimeLeft(payload.timeLeft);
        }
      })
      .on("broadcast", { event: "player_answer" }, ({ payload }) => {
        if (payload.roomCode === roomCode) {
          updatePlayersWithOptimization((prev) =>
            prev.map((player) =>
              player.id === payload.playerId
                ? {
                    ...player,
                    hasAnswered: true,
                    selectedAnswer: payload.selectedAnswer,
                    score: payload.scoreChange
                      ? player.score + payload.scoreChange
                      : player.score,
                  }
                : player
            )
          );
        }
      })
      .on("broadcast", { event: "card_used" }, ({ payload }) => {
        if (
          payload.roomCode === roomCode &&
          payload.playerId !== playerData.player.id
        ) {
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
      .on("broadcast", { event: "time_card_request" }, async ({ payload }) => {
        if (payload.roomCode === roomCode && isHost) {
          const { cardEffect, playerId, playerName } = payload;

          let newTime = timeLeft;

          if (cardEffect.value === "100%") {
            newTime = config?.gameSettings.timePerQuestion || 30;
          } else if (
            typeof cardEffect.value === "string" &&
            cardEffect.value.includes("%")
          ) {
            const percent = parseInt(cardEffect.value.replace("%", ""), 10);
            newTime = Math.max(
              1,
              timeLeft + Math.floor((timeLeft * percent) / 100)
            );
          } else if (typeof cardEffect.value === "number") {
            newTime = Math.max(1, timeLeft + cardEffect.value);
          }
          setTimeLeft(newTime);
          await broadcastTimeUpdate(newTime);

          await updateGameState({ current_time_left: newTime });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const savedPlayerData = savedScores[playerData.player.id];

          await channel.track({
            id: playerData.player.id,
            nickname: playerData.player.nickname,
            avatar: playerData.player.avatar,
            isHost: playerData.player.isHost,
            score: savedPlayerData?.score ?? playerData.player.score ?? 0,
            cards: savedPlayerData?.cards ?? playerData.player.cards ?? 0,
            hasAnswered: false,
            selectedAnswer: undefined,
          });
        }
      });

    channelRef.current = channel;

    const personalChannel = supabase.channel(`player:${playerData.player.id}`);
    personalChannel
      .on("broadcast", { event: "kicked" }, (payload) => {
        if (payload.payload.roomCode === roomCode) {
          alert("You have been kicked from the room by the host.");
          router.push("/?message=kicked");
        }
      })
      .subscribe();

    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      if (hostCheckTimeoutRef.current) {
        clearTimeout(hostCheckTimeoutRef.current);
        hostCheckTimeoutRef.current = null;
      }
      channel.unsubscribe();
      personalChannel.unsubscribe();
    };
  }, [
    roomCode,
    playerData,
    currentQuestionIndex,
    router,
    loadPlayerScoresFromDatabase,
    updatePlayersWithOptimization,
    trackHostPresence,
  ]);

  const updatePlayerScore = useCallback(
    async (playerId: number, scoreChange: number) => {
      if (!channelRef.current) return;

      try {
        updatePlayersWithOptimization((prev) =>
          prev.map((player) =>
            player.id === playerId
              ? { ...player, score: player.score + scoreChange }
              : player
          )
        );

        await channelRef.current.send({
          type: "broadcast",
          event: "player_answer",
          payload: {
            roomCode,
            playerId,
            scoreChange,
          },
        });
      } catch (error) {
        console.error("Error updating player score:", error);
      }
    },
    [roomCode, updatePlayersWithOptimization]
  );

  const broadcastCardUsage = useCallback(
    async (card: Card) => {
      if (!channelRef.current || !playerData) return;

      try {
        await channelRef.current.send({
          type: "broadcast",
          event: "card_used",
          payload: {
            roomCode,
            playerId: playerData.player.id,
            playerName: playerData.player.nickname,
            cardName: card.name,
            cardDescription: card.description,
          },
        });
      } catch (error) {
        console.error("Error broadcasting card usage:", error);
      }
    },
    [roomCode, playerData]
  );

  const applyCardEffect = useCallback(
    (card: Card, cardData: Card) => {
      const effectId = `effect-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const { effect } = cardData;
      const currentTime = Date.now();

      const handleTimeEffect = async () => {
        await handleTimeCardEffect(cardData, effect);
      };

      const handleCssEffect = () => {
        const cssEffect: ActiveCardEffect = {
          id: effectId,
          type: "css",
          effect,
          duration: Math.max(1000, timeLeft * 1000),
          startTime: currentTime,
          targetPlayer: 0,
          expiresAtQuestionEnd: true,
        };

        if (isHost) {
          setActiveEffects((prev) => [...prev, cssEffect]);
          setGameModifiers((prev) => ({
            ...prev,
            cssEffects: [...prev.cssEffects, effect.effect],
          }));

          if (channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "css_effect_applied",
              payload: {
                roomCode,
                effect: cssEffect,
                cssEffectType: effect.effect,
              },
            });
          }
        } else {
          if (channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "css_card_request",
              payload: {
                roomCode,
                cardEffect: effect,
                playerId: currentPlayerId,
                playerName: playerData?.player.nickname,
                effectId: effectId,
              },
            });
          }
          return;
        }

        const cssTimeout = setTimeout(() => {
          setActiveEffects((prev) => prev.filter((e) => e.id !== effectId));
          setGameModifiers((prev) => ({
            ...prev,
            cssEffects: prev.cssEffects.filter((css) => css !== effect.effect),
          }));

          if (isHost && channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "css_effect_removed",
              payload: {
                roomCode,
                effectId: effectId,
              },
            });
          }
        }, Math.max(1000, timeLeft * 1000));

        effectCleanupRef.current.push(cssTimeout);
      };

      const handleScoreEffect = () => {
        if (effect.value === 2) {
          const scoreEffect: ActiveCardEffect = {
            id: effectId,
            type: "score",
            effect,
            startTime: currentTime,
            targetPlayer: 1,
            expiresAtQuestionEnd: true,
          };

          setActiveEffects((prev) => [...prev, scoreEffect]);
          setGameModifiers((prev) => ({
            ...prev,
            scoreMultiplier: effect.value,
          }));
        } else if (effect.value > 1) {
          const scoreEffect: ActiveCardEffect = {
            id: effectId,
            type: "score",
            effect,
            startTime: currentTime,
            targetPlayer: 1,
            expiresAtQuestionEnd: true,
          };
          setActiveEffects((prev) => [...prev, scoreEffect]);
          setGameModifiers((prev) => ({
            ...prev,
            scoreMultiplier: effect.value,
          }));
        } else {
          updatePlayersWithOptimization((prev) =>
            prev.map((player) =>
              player.id === currentPlayerId
                ? { ...player, score: player.score + effect.value }
                : player
            )
          );
        }
      };

      const handleAnswerEffect = () => {
        if (!currentQuestion) return;

        const answerEffect: ActiveCardEffect = {
          id: effectId,
          type: "answer",
          effect,
          startTime: currentTime,
          targetPlayer: effect.mode === "remove" ? 1 : 2,
          expiresAtQuestionEnd: true,
        };

        setActiveEffects((prev) => [...prev, answerEffect]);

        if (effect.mode === "remove") {
          const wrongAnswers = currentQuestion.options
            .map((_, index) => index)
            .filter((i) => i !== currentQuestion.correctAnswer);
          const answersToRemove = wrongAnswers.slice(0, effect.count || 1);

          setGameModifiers((prev) => ({
            ...prev,
            removedAnswers: [...prev.removedAnswers, ...answersToRemove],
          }));
        }

        if (effect.mode === "lock") {
          const availableAnswers = currentQuestion.options
            .map((_, index) => index)
            .filter((i) => !gameModifiers.lockedAnswers.includes(i));
          const answersToLock = availableAnswers
            .sort(() => Math.random() - 0.5)
            .slice(0, effect.count || 1);

          setGameModifiers((prev) => ({
            ...prev,
            lockedAnswers: [...prev.lockedAnswers, ...answersToLock],
          }));
        }
      };

      switch (effect.type) {
        case "time":
          handleTimeEffect();
          break;
        case "css":
          handleCssEffect();
          break;
        case "score":
          handleScoreEffect();
          break;
        case "answer":
          handleAnswerEffect();
          break;
        default:
          console.warn(`Unknown effect type: ${effect.type}`);
      }
    },
    [
      currentQuestion,
      gameModifiers.lockedAnswers,
      currentPlayerId,
      handleTimeCardEffect,
      updatePlayersWithOptimization,
      timeLeft,
    ]
  );

  const activeEffectsRef = useRef<ActiveCardEffect[]>([]);
  activeEffectsRef.current = activeEffects;

  const clearQuestionEffects = useCallback(() => {
    effectCleanupRef.current.forEach((timeout) => clearTimeout(timeout));
    effectCleanupRef.current = [];

    setActiveEffects((prev) =>
      prev.filter((effect) => !effect.expiresAtQuestionEnd)
    );

    setGameModifiers((prev) => ({
      timeModifier: 0,
      cssEffects: prev.cssEffects.filter(
        (css) =>
          !activeEffectsRef.current.some(
            (effect) => effect.type === "css" && effect.expiresAtQuestionEnd
          )
      ),
      scoreMultiplier: 1,
      removedAnswers: [],
      fakeAnswers: prev.fakeAnswers,
      lockedAnswers: [],
    }));
  }, []);
  const goToNextQuestion = useCallback(() => {
    if (gameOver || currentQuestionIndex + 1 >= maxQuestions) {
      setGameOver(true);
      updateGameState({ game_over: true, room_status: "finished" });
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

    updatePlayersWithOptimization((prev) =>
      prev.map((player) => ({
        ...player,
        hasAnswered: false,
        selectedAnswer: undefined,
      }))
    );

    if (isHost) {
      updateGameState({
        current_question_index: nextQuestionIndex,
        current_time_left: newTime,
      });
      broadcastTimeUpdate(newTime);
    }

    clearQuestionEffects();
  }, [
    currentQuestionIndex,
    maxQuestions,
    config,
    gameOver,
    clearQuestionEffects,
    isHost,
    updateGameState,
    broadcastTimeUpdate,
    updatePlayersWithOptimization,
  ]);

  const handleAnswerSelect = useCallback(
    async (optionIndex: number) => {
      if (isAnswered || !currentQuestion || gameOver || !currentPlayerId)
        return;

      setSelectedAnswer(optionIndex);
      setIsAnswered(true);
      setShowCorrectAnswer(true);

      updatePlayersWithOptimization((prev) =>
        prev.map((player) =>
          player.id === currentPlayerId
            ? { ...player, hasAnswered: true, selectedAnswer: optionIndex }
            : player
        )
      );

      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "player_answer",
          payload: {
            roomCode,
            playerId: currentPlayerId,
            selectedAnswer: optionIndex,
            scoreChange: 0,
          },
        });
      }

      const isCorrect = optionIndex === currentQuestion.correctAnswer;
      let earnedScore = 0;

      if (isCorrect) {
        const activeScoreMultiplier = activeEffectsRef.current
          .filter(
            (effect) => effect.type === "score" && effect.expiresAtQuestionEnd
          )
          .reduce((multiplier, effect) => {
            if (
              "value" in effect.effect &&
              typeof (effect.effect as any).value === "number" &&
              (effect.effect as any).value > 1
            ) {
              return multiplier * (effect.effect as any).value;
            }
            return multiplier;
          }, 1);

        earnedScore = Math.round(100 * activeScoreMultiplier);
        setRoundScore(earnedScore);

        updatePlayerScore(currentPlayerId, earnedScore);

        if (config?.selectedGameMode && config.selectedGameMode.id === 1) {
          if (allowedCards.length > 0) {
            const randomCard: Card = {
              ...allowedCards[Math.floor(Math.random() * allowedCards.length)],
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

              updatePlayersWithOptimization((prev) =>
                prev.map((player) =>
                  player.id === currentPlayerId
                    ? { ...player, cards: player.cards + 1 }
                    : player
                )
              );
            }, 1500);
          }
        }
      }
    },
    [
      isAnswered,
      currentQuestion,
      gameOver,
      allowedCards,
      currentPlayerId,
      updatePlayerScore,
      roomCode,
      config,
      updatePlayersWithOptimization,
    ]
  );

  const handleTimeoutForUnansweredPlayers = useCallback(() => {
    updatePlayersWithOptimization((prev) =>
      prev.map((player) => {
        if (!player.hasAnswered) {
          return {
            ...player,
            hasAnswered: true,
            selectedAnswer: -1,
          };
        }
        return player;
      })
    );

    if (channelRef.current && isHost) {
      channelRef.current.send({
        type: "broadcast",
        event: "timeout_answers",
        payload: {
          roomCode,
        },
      });
    }

    if (!isAnswered && currentPlayerId) {
      setIsAnswered(true);
      setSelectedAnswer(-1);
      setShowCorrectAnswer(true);
    }
  }, [
    updatePlayersWithOptimization,
    roomCode,
    isHost,
    isAnswered,
    currentPlayerId,
  ]);

  const togglePause = useCallback(async () => {
    if (gameOver) return;

    const newPausedState = !isPaused;
    setIsPaused(newPausedState);

    if (!isPaused && playerData) {
      setPausedBy(playerData.player.nickname);
    }

    if (isHost) {
      await updateGameState({ is_paused: newPausedState });
      broadcastTimeUpdate(timeLeft);
    }
  }, [
    isPaused,
    playerData,
    gameOver,
    isHost,
    updateGameState,
    timeLeft,
    broadcastTimeUpdate,
  ]);

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

      const animationId = `card-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      applyCardEffect(card, cardData);

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

      setCurrentPlayerHand((prev) =>
        prev.filter((c) => c.uniqueId !== card.uniqueId)
      );

      updatePlayersWithOptimization((prev) =>
        prev.map((player) =>
          player.id === currentPlayerId
            ? { ...player, cards: player.cards - 1 }
            : player
        )
      );

      await broadcastCardUsage(card);

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
      updatePlayersWithOptimization,
    ]
  );

  const goHome = useCallback(() => router.push(`/lobby/${roomCode}`), [router]);

  const restartGame = useCallback(async () => {
    if (!isHost) return;

    [timerRef, leaderboardTimerRef, answerPhaseTimerRef].forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });

    clearQuestionEffects();

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

    updatePlayersWithOptimization((prev) =>
      prev.map((player) => ({
        ...player,
        score: 0,
        cards: 0,
        hasAnswered: false,
        selectedAnswer: undefined,
      }))
    );

    try {
      await supabase
        .from("room")
        .update({
          current_question_index: 0,
          current_time_left: initialTime,
          is_paused: false,
          game_over: false,
          room_status: "playing",
          player_list: [],
        })
        .eq("room_code", roomCode);

      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "game_state_update",
          payload: {
            roomCode,
            currentQuestionIndex: 0,
            isPaused: false,
            gameOver: false,
            timeLeft: initialTime,
          },
        });
      }
    } catch (error) {
      console.error("Error restarting game:", error);
    }
  }, [
    config,
    clearQuestionEffects,
    isHost,
    roomCode,
    updatePlayersWithOptimization,
  ]);

  const getCardInfo = useCallback(
    (name: string) => {
      return allowedCards.find((card) => card.name === name);
    },
    [allowedCards]
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

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    if (!loading && !error && playerData) {
      (async () => {
        try {
          cleanupFn = await setupRealtimeSubscriptions();
        } catch (err) {
          console.error("Error setting up realtime subscriptions:", err);
        }
      })();
    }

    return () => {
      if (typeof cleanupFn === "function") {
        try {
          cleanupFn();
        } catch (err) {
          console.error("Error during realtime cleanup:", err);
        }
      }
    };
  }, [loading, error, playerData, setupRealtimeSubscriptions]);

  useEffect(() => {
    if (
      config &&
      currentQuestionIndex + 1 >= config.gameSettings.numberOfQuestion
    ) {
      if (showLeaderboardAfterAnswer) {
        const gameOverTimer = setTimeout(() => {
          setGameOver(true);
          updateGameState({ game_over: true, room_status: "finished" });
        }, 5000);
        return () => clearTimeout(gameOverTimer);
      }
    }
  }, [
    currentQuestionIndex,
    config,
    showLeaderboardAfterAnswer,
    updateGameState,
  ]);

  useEffect(() => {
    if (showCorrectAnswer || showLeaderboardAfterAnswer) {
      const shouldClearEffects = activeEffects.some(
        (effect) => effect.expiresAtQuestionEnd
      );
      if (shouldClearEffects) {
        clearQuestionEffects();
      }
    }
  }, [
    showCorrectAnswer,
    showLeaderboardAfterAnswer,
    activeEffects,
    clearQuestionEffects,
  ]);
  useEffect(() => {
    let emergencyTimeout: NodeJS.Timeout | null = null;

    if (showLeaderboardAfterAnswer && !gameOver) {
      emergencyTimeout = setTimeout(() => {
        setShowLeaderboardAfterAnswer(false);
        setScoreUpdates([]);
        goToNextQuestion();
      }, 10000);
    }

    return () => {
      if (emergencyTimeout) {
        clearTimeout(emergencyTimeout);
      }
    };
  }, [showLeaderboardAfterAnswer, gameOver, goToNextQuestion]);

  useEffect(() => {
    if (answerPhaseTimerRef.current) {
      clearTimeout(answerPhaseTimerRef.current);
      answerPhaseTimerRef.current = null;
    }
    if (leaderboardTimerRef.current) {
      clearTimeout(leaderboardTimerRef.current);
      leaderboardTimerRef.current = null;
    }

    if (timeLeft === 0 && !gameOver && !isPaused && !allPlayersAnswered) {
      handleTimeoutForUnansweredPlayers();
      return;
    }

    const readyForLeaderboard =
      (allPlayersAnswered || timeLeft === 0) &&
      (isAnswered || timeLeft === 0) &&
      !gameOver &&
      !isPaused;

    if (
      readyForLeaderboard &&
      showCorrectAnswer &&
      !showLeaderboardAfterAnswer
    ) {
      answerPhaseTimerRef.current = setTimeout(() => {
        setShowCorrectAnswer(false);
        setShowLeaderboardAfterAnswer(true);
        leaderboardTimerRef.current = setTimeout(() => {
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
  }, [
    allPlayersAnswered,
    timeLeft,
    isAnswered,
    showLeaderboardAfterAnswer,
    showCorrectAnswer,
    gameOver,
    isPaused,
    roundScore,
    currentPlayerId,
    goToNextQuestion,
    handleTimeoutForUnansweredPlayers,
  ]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isHost) {
      const shouldRunTimer =
        timeLeft > 0 &&
        !allPlayersAnswered &&
        !isPaused &&
        !showLeaderboardAfterAnswer &&
        !gameOver;

      if (shouldRunTimer) {
        timerRef.current = setTimeout(() => {
          const newTime = timeLeft - 1;
          setTimeLeft(newTime);
          broadcastTimeUpdate(newTime);
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
    broadcastTimeUpdate,
  ]);

  useEffect(() => {
    if (scoreUpdates.length === 0) return;

    const updateTimeout = setTimeout(() => {
      updatePlayersWithOptimization((prev) => {
        return prev.map((player) => {
          const playerUpdate = scoreUpdates.find(
            (update) => update.playerId === player.id
          );
          return playerUpdate
            ? { ...player, score: player.score + playerUpdate.points }
            : player;
        });
      });
    }, 1000);

    return () => clearTimeout(updateTimeout);
  }, [scoreUpdates, updatePlayersWithOptimization]);

  useEffect(() => {
    return () => {
      [timerRef, leaderboardTimerRef, answerPhaseTimerRef].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
          ref.current = null;
        }
      });

      if (hostCheckTimeoutRef.current) {
        clearTimeout(hostCheckTimeoutRef.current);
        hostCheckTimeoutRef.current = null;
      }

      effectCleanupRef.current.forEach((timeout) => clearTimeout(timeout));
      effectCleanupRef.current = [];

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState error={error} />;

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
      <GameOver
        players={sortedPlayers}
        onGoHome={goHome}
        onRestart={restartGame}
      />
    );
  }

  const getModifiedQuestion = () => {
    if (!currentQuestion) return currentQuestion;

    let modifiedOptions: (string | null)[] = [...currentQuestion.options];

    if (gameModifiers.removedAnswers.length > 0) {
      modifiedOptions = modifiedOptions.map((option, index) =>
        gameModifiers.removedAnswers.includes(index) ? null : option
      );
    }

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
    <div className="flex flex-1 lg:h-screen">
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
        className="relative min-h-screen w-full font-sans flex flex-1 flex-col p-4"
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
        <div className="max-w-8xl mx-auto flex-1 flex flex-col w-full min-h-0 ">
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
              players={sortedPlayers}
              scoreUpdates={scoreUpdates}
              showLeaderboardAfterAnswer={showLeaderboardAfterAnswer}
              roundScore={roundScore}
              showLeaderboard={
                showLeaderboardAfterAnswer || (timeLeft === 0 && isAnswered)
              }
            />
            <div
              className={`
                  w-full lg:w-2/4 
                  rounded-3xl border border-white/10 
                  bg-gradient-to-b from-white/10 to-white/5 
                  p-6 shadow-2xl shadow-black/40 backdrop-blur-md overflow-auto
                  ${gameModifiers.cssEffects.join(" ")} 
                `}
            >
              <QuestionCard
                showLeaderboardAfterAnswer={showLeaderboardAfterAnswer}
                timeLeft={timeLeft}
                currentQuestion={modifiedQuestion}
                isAnswered={isAnswered}
                showCorrectAnswer={showCorrectAnswer}
                selectedAnswer={selectedAnswer}
                config={config}
                handleAnswerSelect={handleAnswerSelect}
                players={sortedPlayers}
                scoreUpdates={scoreUpdates}
                gameModifiers={gameModifiers}
                allPlayersAnswered={allPlayersAnswered}
              />
            </div>

            <div
              className=" rounded-3xl border border-white/10 
                  bg-gradient-to-b from-white/10 to-white/5 flex flex-1 min-w-[300px]"
            >
              <CardLogAndChat
                usedCardsLog={usedCardsLog}
                getCardInfo={getCardInfo}
                showCardInfo={showCardInfo}
                roomCode={roomCode}
                playerData={playerData}
                isLobby={false}
              />
            </div>
          </motion.div>
        </div>

        <PlayerHand currentPlayerHand={currentPlayerHand} useCard={useCard} />

        <CardAnimation
          activeCards={activeCards}
          isDrawingCard={isDrawingCard}
          drawnCard={drawnCard}
        />

        <PauseOverlay
          isPaused={isPaused}
          pausedBy={pausedBy}
          togglePause={togglePause}
        />
      </motion.div>
    </div>
  );
};

export default QuizGame;
