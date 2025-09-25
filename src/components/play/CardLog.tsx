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
}

const CardLogAndChat: React.FC<CardLogAndChatProps> = ({
  usedCardsLog,
  getCardInfo,
  showCardInfo,
  roomCode,
  playerData,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "cards">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatChannelRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
      setTimeout(scrollToBottom, 100);
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
          setTimeout(scrollToBottom, 100);
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
  }, [roomCode, playerData?.player?.id, scrollToBottom]);

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

  useEffect(() => {
    if (activeTab === "chat") {
      setTimeout(scrollToBottom, 100);
    }
  }, [activeTab, scrollToBottom]);

  return (
    <motion.div
      className="w-full lg:w-96 flex flex-col bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-blue-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Tab Headers with enhanced styling */}
      <div className="flex border-b border-white/10 bg-black/20">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-3 p-4 text-base font-semibold transition-all duration-300 ${
            activeTab === "chat"
              ? "text-cyan-300 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 shadow-inner"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <FiMessageCircle size={18} className="animate-pulse" />
          Chat ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab("cards")}
          className={`flex-1 flex items-center justify-center gap-3 p-4 text-base font-semibold transition-all duration-300 ${
            activeTab === "cards"
              ? "text-amber-300 bg-gradient-to-r from-amber-500/20 to-orange-500/20 shadow-inner"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <FiZap size={18} className="animate-pulse" />
          Cards ({usedCardsLog.length})
        </button>
      </div>

      {/* Content Area - Fixed height for internal scrolling only */}
      <div className="flex-1 flex flex-col h-[600px]">
        <AnimatePresence mode="wait">
          {activeTab === "chat" ? (
            <motion.div
              key="chat-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col min-h-0 max-h-[600px]"
            >
              {/* Messages with fixed height and internal scroll */}
              <div className="flex-1 p-4 overflow-y-auto min-h-0 max-h-[500px] custom-scrollbar">
                <style jsx>{`
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(45deg, #06b6d4, #8b5cf6);
                    border-radius: 10px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(45deg, #0891b2, #7c3aed);
                  }
                `}</style>
                <div className="space-y-1">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-white/60 py-8"
                    >
                      <div className="relative">
                        <FiUsers
                          className="mx-auto mb-3 opacity-40"
                          size={28}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 rounded-full blur-xl"></div>
                      </div>
                      <p className="text-base font-medium mb-1">
                        No messages yet
                      </p>
                      <p className="text-xs opacity-70">Start chatting! 🎮</p>
                    </motion.div>
                  ) : (
                    messages.map((message, index) => {
                      const isOwnMessage =
                        message.player_id === playerData?.player?.id;
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, x: isOwnMessage ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.2,
                            ease: "easeOut",
                          }}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          } w-full mb-2`}
                        >
                          {/* Other player message - with avatar and name */}
                          {!isOwnMessage && (
                            <div className="flex items-start gap-2 max-w-[75%]">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-cyan-500 flex-shrink-0 ring-1 ring-white/20">
                                {getAvatarContent(message)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-emerald-300 font-bold mb-1 px-1">
                                  {message.player_name}
                                </span>
                                <div className="bg-slate-700/80 backdrop-blur-sm rounded-lg rounded-tl-none px-3 py-2 border border-slate-600/50 shadow-md">
                                  <p className="text-sm text-white leading-snug break-words">
                                    {message.message}
                                  </p>
                                  <span className="text-xs text-slate-400 mt-1 block">
                                    {formatTimestamp(message.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Own message - compact game style */}
                          {isOwnMessage && (
                            <div className="max-w-[70%] flex flex-col items-end">
                              <div className="relative bg-gradient-to-r from-blue-500/90 to-purple-500/90 rounded-lg rounded-tr-none px-3 py-2 border border-blue-400/30 shadow-lg">
                                {/* Game-style border effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-lg rounded-tr-none border border-white/20"></div>
                                <div className="relative z-10">
                                  <p className="text-sm text-white font-medium leading-snug break-words">
                                    {message.message}
                                  </p>
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className="text-xs text-blue-200/80">
                                      {formatTimestamp(message.timestamp)}
                                    </span>
                                    <div className="text-xs text-blue-200/80">
                                      ✓
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Compact Message Input - Game UI Style */}
              <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-800/60 to-slate-900/60 flex-shrink-0">
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type message..."
                      disabled={isLoading}
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 disabled:opacity-50 transition-all duration-200"
                      maxLength={200}
                    />
                    <div className="absolute bottom-1 right-2 text-xs text-slate-500">
                      {newMessage.length}/200
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:hover:from-cyan-500 disabled:hover:to-blue-500 p-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <FiSend
                      size={16}
                      className={isLoading ? "animate-pulse" : ""}
                    />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cards-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 p-6 overflow-y-auto max-h-[520px] custom-scrollbar"
            >
              <div className="space-y-4">
                {recentCards.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-white/60 py-12"
                  >
                    <FiZap
                      className="mx-auto mb-4 opacity-40 animate-pulse"
                      size={32}
                    />
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
                        className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 hover:from-white/15 hover:to-white/10 transition-all duration-200 cursor-pointer backdrop-blur-sm hover:shadow-xl hover:scale-[1.02]"
                        onClick={() =>
                          showCardInfo(
                            cardUsage.cardTitle,
                            cardUsage.cardDescription
                          )
                        }
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-amber-300/80 bg-amber-500/20 px-3 py-1 rounded-full font-medium">
                            Round {cardUsage.round}
                          </span>
                          <span className="text-lg">
                            {cardInfo?.emoji || "🃏"}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mb-2 tracking-wide">
                          {cardUsage.cardTitle}
                        </h4>
                        <p className="text-sm text-white/70 mb-3 line-clamp-2 leading-relaxed">
                          {cardUsage.cardDescription}
                        </p>
                        <p className="text-xs text-cyan-400 font-medium">
                          Used by {cardUsage.playerName}
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
    </motion.div>
  );
};

export default CardLogAndChat;
