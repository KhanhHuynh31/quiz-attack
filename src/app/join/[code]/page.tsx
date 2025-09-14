"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaExclamationTriangle, FaSpinner, FaUser } from "react-icons/fa";
import { motion } from "framer-motion";
import Avatar, { genConfig } from "react-nice-avatar";

// Import components
import AvatarCustomModal from "@/components/home/AvatarCustomModal";

// Import hooks and types
import { useI18n } from "@/hooks/useI18n";
import {
  loadFromLocalStorage,
  LOCAL_STORAGE_KEYS,
  saveToLocalStorage,
} from "@/hooks/useLocalStorage";
import { supabase } from "@/lib/supabaseClient";

// Types
interface Player {
  nickname: string;
  avatar: string;
  isHost: boolean;
}

interface RoomData {
  room_code: string;
  player_list: string[];
  setting_list: string[];
  game_mode: number | null;
  quiz_pack: number | null;
  room_password: string | null;
}

// Constants
const DEFAULT_AVATAR_CONFIG = genConfig();

// Database operations
class DatabaseService {
  static async checkRoomExists(roomCode: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("room")
        .select("room_code")
        .eq("room_code", roomCode)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking room:", error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error("Database error checking room:", error);
      return false;
    }
  }

  static async getRoom(roomCode: string): Promise<RoomData | null> {
    try {
      const { data, error } = await supabase
        .from("room")
        .select("*")
        .eq("room_code", roomCode)
        .single();

      if (error) {
        console.error("Error fetching room:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Database error fetching room:", error);
      return null;
    }
  }

  static async joinRoom(roomCode: string, player: Player): Promise<void> {
    try {
      // First check if room exists
      const { data: roomData, error: fetchError } = await supabase
        .from("room")
        .select("player_list")
        .eq("room_code", roomCode)
        .single();

      if (fetchError || !roomData) {
        throw new Error("Room not found");
      }

      // Add player to the existing player list
      const currentPlayers = roomData.player_list || [];
      const updatedPlayers = [...currentPlayers, JSON.stringify(player)];

      const { error: updateError } = await supabase
        .from("room")
        .update({ player_list: updatedPlayers })
        .eq("room_code", roomCode);

      if (updateError) {
        console.error("Error joining room:", updateError);
        throw updateError;
      }

      console.log("Successfully joined room:", roomCode);
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  }

  static async verifyRoomPassword(
    roomCode: string,
    password: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("room")
        .select("room_password")
        .eq("room_code", roomCode)
        .single();

      if (error) {
        console.error("Error verifying password:", error);
        return false;
      }

      return data.room_password === password;
    } catch (error) {
      console.error("Failed to verify password:", error);
      return false;
    }
  }

  static async checkNicknameInRoom(
    roomCode: string,
    nickname: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("room")
        .select("player_list")
        .eq("room_code", roomCode)
        .single();

      if (error || !data) {
        return false;
      }

      const players: Player[] = data.player_list
        ? data.player_list.map((player: string) => JSON.parse(player))
        : [];

      return players.some(
        (player) => player.nickname.toLowerCase() === nickname.toLowerCase()
      );
    } catch (error) {
      console.error("Error checking nickname:", error);
      return false;
    }
  }
}

const JoinRoomPage: React.FC = () => {
  // Hooks
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();

  // State
  const [roomCode, setRoomCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [roomExists, setRoomExists] = useState<boolean>(false);
  const [requiresPassword, setRequiresPassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [userInfoComplete, setUserInfoComplete] = useState<boolean>(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>(
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.NICKNAME, "")
  );
  const [avatarConfig, setAvatarConfig] = useState(
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.AVATAR_CONFIG, DEFAULT_AVATAR_CONFIG)
  );
  const [customAvatarImage, setCustomAvatarImage] = useState<string | null>(
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.CUSTOM_AVATAR_IMAGE, null)
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isExistingPlayer, setIsExistingPlayer] = useState<boolean>(false);

  // Get room code from URL params
  useEffect(() => {
    if (params?.code) {
      const code = Array.isArray(params.code) ? params.code[0] : params.code;
      setRoomCode(code.toUpperCase());
    }
  }, [params]);

  // Check if room exists and if it requires password
  useEffect(() => {
    const checkRoom = async () => {
      if (!roomCode) return;

      setIsLoading(true);
      try {
        const roomData = await DatabaseService.getRoom(roomCode);
        
        if (!roomData) {
          setRoomExists(false);
          setError("Room not found");
          return;
        }

        setRoomExists(true);
        setRequiresPassword(!!roomData.room_password);
        
        // Check if user has complete info
        const storedNickname = loadFromLocalStorage(LOCAL_STORAGE_KEYS.NICKNAME, "");
        const hasNickname = !!storedNickname;
        const hasAvatar = !!loadFromLocalStorage(LOCAL_STORAGE_KEYS.AVATAR_CONFIG, null) || 
                         !!loadFromLocalStorage(LOCAL_STORAGE_KEYS.CUSTOM_AVATAR_IMAGE, null);
        
        // Check if this nickname already exists in the room
        if (hasNickname) {
          const nicknameExists = await DatabaseService.checkNicknameInRoom(roomCode, storedNickname);
          
          if (nicknameExists) {
            // Nickname already exists, no need to show modal
            setIsExistingPlayer(true);
            setUserInfoComplete(true);
            setShowUserInfoModal(false);
            return;
          }
        }
        
        // If we reach here, either no nickname or nickname doesn't exist in room
        setUserInfoComplete(hasNickname && hasAvatar);
        setShowUserInfoModal(!hasNickname || !hasAvatar);
      } catch (err) {
        console.error("Error checking room:", err);
        setError("Failed to check room");
      } finally {
        setIsLoading(false);
      }
    };

    if (roomCode) {
      checkRoom();
    }
  }, [roomCode]);

  // Handle password submission
  const handlePasswordSubmit = useCallback(async () => {
    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await DatabaseService.verifyRoomPassword(roomCode, password);
      
      if (isValid) {
        setRequiresPassword(false);
        setPasswordError("");
        
        // Check user info again after password is verified
        const storedNickname = loadFromLocalStorage(LOCAL_STORAGE_KEYS.NICKNAME, "");
        const hasNickname = !!storedNickname;
        const hasAvatar = !!loadFromLocalStorage(LOCAL_STORAGE_KEYS.AVATAR_CONFIG, null) || 
                         !!loadFromLocalStorage(LOCAL_STORAGE_KEYS.CUSTOM_AVATAR_IMAGE, null);
        
        // Check if this nickname already exists in the room
        if (hasNickname) {
          const nicknameExists = await DatabaseService.checkNicknameInRoom(roomCode, storedNickname);
          
          if (nicknameExists) {
            // Nickname already exists, no need to show modal
            setIsExistingPlayer(true);
            setUserInfoComplete(true);
            setShowUserInfoModal(false);
            return;
          }
        }
        
        setUserInfoComplete(hasNickname && hasAvatar);
        setShowUserInfoModal(!hasNickname || !hasAvatar);
      } else {
        setPasswordError("Incorrect password");
      }
    } catch (err) {
      setPasswordError("Failed to verify password");
    } finally {
      setIsLoading(false);
    }
  }, [password, roomCode]);

  // Handle user info submission
  const handleUserInfoSubmit = useCallback(async () => {
    if (!nickname.trim()) {
      setError("Nickname is required");
      return;
    }

    // Check if this nickname already exists in the room
    const nicknameExists = await DatabaseService.checkNicknameInRoom(roomCode, nickname);
    
    if (nicknameExists) {
      setError("This nickname is already taken in this room");
      return;
    }

    // Save to local storage
    saveToLocalStorage(LOCAL_STORAGE_KEYS.NICKNAME, nickname);
    saveToLocalStorage(LOCAL_STORAGE_KEYS.AVATAR_CONFIG, avatarConfig);
    if (customAvatarImage) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.CUSTOM_AVATAR_IMAGE, customAvatarImage);
    }

    setUserInfoComplete(true);
    setShowUserInfoModal(false);
    joinRoom();
  }, [nickname, avatarConfig, customAvatarImage, roomCode]);

  // Join the room
  const joinRoom = useCallback(async () => {
    setIsLoading(true);
    try {
      // Only add player to database if they're not already in the room
      if (!isExistingPlayer) {
        const player: Player = {
          nickname,
          avatar: customAvatarImage || JSON.stringify(avatarConfig),
          isHost: false
        };

        await DatabaseService.joinRoom(roomCode, player);
      }
      
      // Redirect to lobby
      router.push(`/lobby/${roomCode}`);
    } catch (err) {
      console.error("Failed to join room:", err);
      setError("Failed to join room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, nickname, avatarConfig, customAvatarImage, router, isExistingPlayer]);

  // If user info is complete and no password is required, join the room automatically
  useEffect(() => {
    if (roomExists && userInfoComplete && !requiresPassword && !showUserInfoModal) {
      joinRoom();
    }
  }, [roomExists, userInfoComplete, requiresPassword, showUserInfoModal, joinRoom]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="flex justify-center mb-4"
          >
            <FaSpinner className="text-4xl" />
          </motion.div>
          <p>Loading room information...</p>
        </div>
      </div>
    );
  }

  // Room not found
  if (!roomExists) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl max-w-md w-full mx-4">
          <FaExclamationTriangle className="text-4xl text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
          <p className="mb-4">The room code <strong>{roomCode}</strong> does not exist or may have been closed.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#FF6B35] text-white py-2 px-6 rounded-xl font-semibold hover:bg-[#FF7A47] transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Password Modal */}
      {requiresPassword && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl max-w-md w-full"
          >
            <h3 className="text-white text-lg font-semibold mb-4">Room Password Required</h3>
            <p className="text-white/80 mb-4">
              This room is password protected. Please enter the password to join.
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter room password"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all mb-2"
            />

            {passwordError && (
              <p className="text-red-400 mb-4">{passwordError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#FF7A47] transition-colors disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Join Room"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Info Modal */}
      {showUserInfoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl max-w-md w-full"
          >
            <h3 className="text-white text-lg font-semibold mb-4">Complete Your Profile</h3>
            <p className="text-white/80 mb-4">
              Please set your nickname and avatar before joining the room.
            </p>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nickname</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Avatar</label>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 cursor-pointer relative"
                    onClick={() => setIsAvatarModalOpen(true)}
                  >
                    {customAvatarImage ? (
                      <img
                        src={customAvatarImage}
                        alt="User avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <Avatar className="w-full h-full" {...avatarConfig} />
                    )}
                  </div>
                  <button
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="text-sm text-[#FF6B35] hover:text-[#FF7A47] transition-colors"
                  >
                    Customize Avatar
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-400 mb-4">{error}</p>
            )}

            <button
              onClick={handleUserInfoSubmit}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#FF6B35] text-white hover:bg-[#FF7A47] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Joining..." : "Join Room"}
            </button>
          </motion.div>
        </div>
      )}

      {/* Avatar Customization Modal */}
      <AvatarCustomModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        avatarConfig={avatarConfig}
        setAvatarConfig={setAvatarConfig as any}
        customAvatarImage={customAvatarImage}
        setCustomAvatarImage={setCustomAvatarImage}
      />

      {/* General Error Display */}
      {error && !showUserInfoModal && !requiresPassword && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2"
          >
            <FaExclamationTriangle />
            <span>{error}</span>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default JoinRoomPage;