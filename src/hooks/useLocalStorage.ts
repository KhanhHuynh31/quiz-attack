import { PlayerData } from "@/types/type";
const STORAGE_KEY = "quizAttack_playerData";
export const LOCAL_STORAGE_KEYS = {
  NICKNAME: "quizAttack_nickname",
  AVATAR_CONFIG: "quizAttack_avatarConfig",
  CUSTOM_AVATAR_IMAGE: "quizAttack_customAvatarImage",
  PLAYER_DATA: "quizAttack_playerData",
} as const;

// Local storage utilities
export const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const saveToLocalStorage = <T,>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};
export function loadPlayerData(): PlayerData | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as PlayerData;
  } catch (err) {
    console.error("Failed to parse player data", err);
    return null;
  }
}