export interface ModeTranslation {
  title: string;
  desc: string;
  help: string;
}

export interface TranslationData {
  title: string;
  discord: string;
  gameModes: string;
  nickname: string;
  yourName: string;
  login: string;
  register: string;
  username: string;
  password: string;
  loginWithFacebook: string;
  loginWithGoogle: string;
  createRoom: string;
  roomCodePlaceholder: string;
  create: string;
  joinRoom: string;
  enterRoomCode: string;
  join: string;
  copied: string;
  addCustomPacks: string;
  setPassword: string;
  roomPassword: string;
  chooseAvatar: string;
  uploadAvatar: string;
  modes: {
    classic: ModeTranslation;
    battle: ModeTranslation;
    pve: ModeTranslation;
  };
  rules: string[];
}

export type LanguageCode = 'en' | 'vi';