"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiMessageCircle, FiZap, FiUsers } from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";
import { CardUsage, Card, PlayerData } from "@/types/type";
import Avatar, { genConfig } from "react-nice-avatar";

interface AvatarFullConfig {
  [key: string]: any;
}

interface ChatMessage {
  id: string;
  player_id: number;
  player_name: string;
  player_avatar: string;
  message: string;
  timestamp: string;
  room_code: string;
}

interface CardLogAndChatProps {
  usedCardsLog: CardUsage[];
  getCardInfo: (name: string) => Card | undefined;
  showCardInfo: (cardTitle: string, description: string) => void;
  roomCode: string;
  playerData: PlayerData | null;
  isLobby?: boolean;
}

const CardLogAndChat: React.FC<CardLogAndChatProps> = ({
  usedCardsLog,
  getCardInfo,
  showCardInfo,
  roomCode,
  playerData,
  isLobby = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "cards">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<any>(null);


  const setupChatSubscription = useCallback(async () => {
    if (!roomCode || !playerData?.player?.id) return;

    console.log("Setting up chat subscription for room:", roomCode);

    const { data: existingMessages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_code", roomCode)
      .order("timestamp", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Error loading messages:", error);
    } else if (existingMessages) {
      console.log("Loaded existing messages:", existingMessages.length);
      setMessages(existingMessages);
    }

    if (chatChannelRef.current) {
      console.log("Cleaning up previous subscription");
      await supabase.removeChannel(chatChannelRef.current);
      chatChannelRef.current = null;
    }

    const channel = supabase.channel(`chat:${roomCode}:${Date.now()}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          console.log("New message received:", payload);
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMessage.id);
            if (exists) return prev;

            const updated = [...prev, newMessage];
            return updated.slice(-50);
          });
        }
      )
      .subscribe((status) => {
        console.log("Chat subscription status:", status);
      });

    chatChannelRef.current = channel;

    return () => {
      if (chatChannelRef.current) {
        console.log("Cleaning up chat subscription");
        supabase.removeChannel(chatChannelRef.current);
        chatChannelRef.current = null;
      }
    };
  }, [roomCode, playerData?.player?.id]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !playerData?.player || isLoading) return;

    setIsLoading(true);
    try {
      const messageData = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        player_id: playerData.player.id,
        player_name: playerData.player.nickname,
        player_avatar: playerData.player.avatar,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        room_code: roomCode,
      };

      console.log("Sending message:", messageData);

      const { error } = await supabase
        .from("chat_messages")
        .insert([messageData]);

      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  }, [newMessage, playerData?.player, roomCode, isLoading]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  const getAvatarContent = useCallback((message: ChatMessage) => {
    try {
      if (message.player_avatar?.startsWith("{")) {
        const config = JSON.parse(message.player_avatar) as AvatarFullConfig;
        return <Avatar className="w-full h-full" {...config} />;
      } else {
        return (
          <div className="w-full h-full flex items-center justify-center text-sm">
            {message.player_avatar || "👤"}
          </div>
        );
      }
    } catch (error) {
      console.error("Error parsing avatar:", error);
      const fallbackConfig = genConfig();
      return <Avatar className="w-full h-full" {...fallbackConfig} />;
    }
  }, []);

  const recentCards = useMemo(() => {
    return usedCardsLog.slice(-10).reverse();
  }, [usedCardsLog]);

  // Group messages by continuous messages from same user within 1 minute
  const groupedMessages = useMemo(() => {
    const groups: ChatMessage[][] = [];
    let currentGroup: ChatMessage[] = [];

    messages.forEach((message, index) => {
      if (index === 0) {
        currentGroup.push(message);
        return;
      }

      const prevMessage = messages[index - 1];
      const timeDiff =
        new Date(message.timestamp).getTime() -
        new Date(prevMessage.timestamp).getTime();

      // Start new group if:
      // 1. Different user
      // 2. Time difference more than 1 minute
      if (message.player_id !== prevMessage.player_id || timeDiff > 60000) {
        groups.push([...currentGroup]);
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }, [messages]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (roomCode && playerData?.player?.id) {
      (async () => {
        cleanup = await setupChatSubscription();
      })();
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [setupChatSubscription]);

  return (
    <motion.div
      className={`flex flex-1 flex-col min-w-[300px] overflow-hidden ${
        isLobby ? "lobby-mode" : ""
      }`}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Discord-style Tab Headers */}
      <div className="flex border-b border-gray-700">
        {isLobby ? (
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 flex items-center justify-center gap-2 p-4 text-sm font-medium transition-all duration-200 border-b-2 ${
              activeTab === "chat"
                ? "text-white border-discord-blue"
                : "text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500"
            }`}
          >
            <FiMessageCircle size={16} />
            Chat {messages.length > 0 && `(${messages.length})`}
          </button>
        ) : (
          <>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === "chat"
                  ? "text-white border-discord-blue"
                  : "text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500"
              }`}
            >
              <FiMessageCircle size={16} />
              Chat {messages.length > 0 && `(${messages.length})`}
            </button>
            <button
              onClick={() => setActiveTab("cards")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === "cards"
                  ? "text-white border-discord-blue"
                  : "text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500"
              }`}
            >
              <FiZap size={16} />
              Cards ({usedCardsLog.length})
            </button>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-auto">
        <AnimatePresence mode="wait">
          {activeTab === "chat" ? (
            <motion.div
              key="chat-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col min-h-0  "
            >
              {/* Messages Container - Discord Style */}
              <div className="flex-1 py-2 overflow-y-auto min-h-0  custom-scrollbar">
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-gray-400 py-8"
                  >
                    <FiUsers className="mx-auto mb-3 opacity-40" size={32} />
                    <p className="text-base font-medium mb-1">
                      No messages yet
                    </p>
                    <p className="text-sm opacity-70">
                      Start the conversation!
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-1">
                    {groupedMessages.map((group, groupIndex) => (
                      <div key={groupIndex} className="flex flex-col gap-1">
                        {group.map((message, index) => {
                          const isFirstInGroup = index === 0;
                          const isLastInGroup = index === group.length - 1;

                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className="group flex gap-3 hover:bg-gradient-to-r from-white/5 to-white/10 px-2 py-1 "
                            >
                              <div className="flex items-start gap-3 max-w-full w-full">
                                {/* Avatar - Only show for first message in group */}
                                <div
                                  className={`flex-shrink-0 ${
                                    isFirstInGroup ? "w-12 h-12" : "w-0"
                                  }`}
                                >
                                  {isFirstInGroup && (
                                    <div className="w-12 h-12 rounded-full overflow-hidden mt-1">
                                      {getAvatarContent(message)}
                                    </div>
                                  )}
                                </div>

                                {/* Message Content */}
                                <div className="flex-1 min-w-0">
                                  {isFirstInGroup && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-white hover:text-discord-blue cursor-pointer">
                                        {message.player_name}
                                      </span>
                                      {/* Only show timestamp for first message or if it's the only message in group */}
                                      {(isFirstInGroup ||
                                        group.length === 1) && (
                                        <span className="text-xs text-gray-400">
                                          {formatTimestamp(message.timestamp)}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <div
                                    className={`${
                                      isFirstInGroup ? "" : "ml-14"
                                    } flex items-start justify-between gap-2`}
                                  >
                                    <p className="text-sm text-gray-200 leading-relaxed break-words flex-1">
                                      {message.message}
                                    </p>
                                    {/* Show timestamp on hover for non-first messages */}
                                    {!isFirstInGroup && (
                                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        {formatTimestamp(message.timestamp)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Discord-style Message Input - No Border */}
              <div className="p-4 ">
                <div className="relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message #${roomCode}`}
                    disabled={isLoading}
                    className="w-full bg-black/20 border-none rounded-lg px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50 transition-all duration-200 "
                    maxLength={2000}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isLoading}
                      className="bg-discord-blue hover:bg-discord-blue-hover disabled:opacity-50 disabled:hover:bg-discord-blue p-2 rounded transition-all duration-200"
                    >
                      <FiSend
                        size={16}
                        className={isLoading ? "animate-pulse" : ""}
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cards-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 p-4 overflow-y-auto max-h-[520px] custom-scrollbar "
            >
              <div className="space-y-3">
                {recentCards.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-gray-400 py-12"
                  >
                    <FiZap className="mx-auto mb-4 opacity-40" size={32} />
                    <p className="text-lg font-medium">No cards used yet</p>
                  </motion.div>
                ) : (
                  recentCards.map((cardUsage, index) => {
                    const cardInfo = getCardInfo(cardUsage.cardTitle);
                    return (
                      <motion.div
                        key={`${cardUsage.cardTitle}-${cardUsage.round}-${index}`}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.08 }}
                        className="bg-white/10 rounded-lg p-3 hover:bg-white/12 transition-all duration-200 cursor-pointer"
                        onClick={() =>
                          showCardInfo(
                            cardUsage.cardTitle,
                            cardUsage.cardDescription
                          )
                        }
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-discord-blue bg-discord-blue/20 px-2 py-1 rounded font-medium">
                            Round {cardUsage.round}
                          </span>
                          <span className="text-lg">
                            {cardInfo?.emoji || "🃏"}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white mb-1">
                          {cardUsage.cardTitle}
                        </h4>
                        <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                          {cardUsage.cardDescription}
                        </p>
                        <p className="text-xs text-gray-400">
                          Used by{" "}
                          <span className="text-discord-blue">
                            {cardUsage.playerName}
                          </span>
                        </p>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .border-discord-blue {
          border-color: #5865f2;
        }
        .bg-discord-blue {
          background-color: #5865f2;
        }
        .bg-discord-blue-hover {
          background-color: #4752c4;
        }
        .text-discord-blue {
          color: #5865f2;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2f3136;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #202225;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #36393f;
        }
      `}</style>
    </motion.div>
  );
};

export default CardLogAndChat;
