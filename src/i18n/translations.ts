export interface ModeTranslation {
  title: string;
  desc: string;
  help: string;
}
export type LanguageCode = "en" | "vi";

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
  addNewPack: string;
  packName: string;
  topic: string;
  enterTopic: string;
  addPack: string;
  edit: string;
  view: string;
  delete: string;
  questions: string;
  back: string;
  addQuestion: string;
  editQuestion: string;
  questionText: string;
  enterQuestionText: string;
  imageUrl: string;
  optional: string;
  options: string;
  option: string;
  save: string;
  cancel: string;
  noQuestions: string;
  addFirstQuestion: string;
  listView: string;
  gridView: string;
  pack: string;
  enterPackName: string;
  manageQuestionPacks: string;
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

export const translations: Record<LanguageCode, TranslationData> = {
  en: {
    title: "QUIZ ATTACK",
    discord: "Discord",
    gameModes: "Game Modes",
    nickname: "Nickname",
    yourName: "Your name",
    login: "Login",
    register: "Register Account",
    username: "Username",
    password: "Password",
    loginWithFacebook: "Login with Facebook",
    loginWithGoogle: "Login with Google",
    createRoom: "Create Room",
    roomCodePlaceholder: "ROOM CODE (auto if empty)",
    create: "Create",
    joinRoom: "Join Room",
    enterRoomCode: "Enter room code",
    join: "Join",
    copied: "Copied",
    addCustomPacks: "Add Custom Packs",
    setPassword: "Set Password",
    roomPassword: "Room Password",
    chooseAvatar: "Choose Avatar",
    uploadAvatar: "Upload Avatar",

    // New translations for QuestionsModal
    manageQuestionPacks: "Manage Question Packs",
    addNewPack: "Add New Pack",
    packName: "Pack Name",
    enterPackName: "Enter pack name",
    topic: "Topic",
    enterTopic: "Enter topic",
    addPack: "Add Pack",
    edit: "Edit",
    view: "View",
    delete: "Delete",
    questions: "questions",
    back: "Back",
    addQuestion: "Add Question",
    editQuestion: "Edit Question",
    questionText: "Question Text",
    enterQuestionText: "Enter question text",
    imageUrl: "Image URL",
    optional: "optional",
    options: "Options",
    option: "Option",
    save: "Save",
    cancel: "Cancel",
    noQuestions: "No questions in this pack yet",
    addFirstQuestion: "Add your first question",
    listView: "List View",
    gridView: "Grid View",
    pack: "Pack",

    modes: {
      classic: {
        title: "Classic Quiz",
        desc: "Answer fast – earn points – highest score wins.",
        help: "Classic mode is the traditional quiz format where players compete to answer questions as quickly and accurately as possible. Each correct answer earns points, with bonus points for faster responses. The player with the highest total score after all rounds wins the game.",
      },
      battle: {
        title: "Card Battle",
        desc: "Use cards to disrupt time, shuffle answers, choose topics.",
        help: "Card Battle mode adds strategic elements with special cards that can change the game dynamics. Players can use cards to extend or reduce time limits, shuffle answer choices, select question categories, or apply other tactical advantages. Timing your card usage is key to victory.",
      },
      pve: {
        title: "VS AI Host",
        desc: "AI asks questions and plays challenge cards for the room.",
        help: "In VS AI Host mode, an artificial intelligence acts as the game master, generating questions and strategically playing challenge cards that affect all players. This creates a cooperative-competitive environment where players must adapt to AI-controlled game modifications while competing against each other.",
      },
    },
    rules: [
      "Answer correctly to earn points. Submit earlier for higher bonus points.",
      "Cards can change time, shuffle answers, select topics.",
      "After 10 rounds, the player with the **highest total score** wins.",
    ],
  },
  vi: {
    title: "QUIZ ATTACK",
    discord: "Discord",
    gameModes: "Chế Độ Chơi",
    nickname: "Biệt Danh",
    yourName: "Tên của bạn",
    login: "Đăng nhập",
    register: "Đăng ký tài khoản",
    username: "Tên đăng nhập",
    password: "Mật khẩu",
    loginWithFacebook: "Đăng nhập với Facebook",
    loginWithGoogle: "Đăng nhập với Google",
    createRoom: "Tạo Phòng",
    roomCodePlaceholder: "MÃ PHÒNG (tự động nếu để trống)",
    create: "Tạo",
    joinRoom: "Vào Phòng",
    enterRoomCode: "Nhập mã phòng",
    join: "Vào",
    copied: "Đã Sao Chép",
    addCustomPacks: "Thêm Gói Tự Tạo",
    setPassword: "Đặt mật khẩu",
    roomPassword: "Mật khẩu phòng",
    chooseAvatar: "Chọn ảnh đại diện",
    uploadAvatar: "Tải ảnh lên",

    // New translations for QuestionsModal
    manageQuestionPacks: "Quản lý Bộ Câu Hỏi",
    addNewPack: "Thêm Bộ Mới",
    packName: "Tên Bộ",
    enterPackName: "Nhập tên bộ",
    topic: "Chủ Đề",
    enterTopic: "Nhập chủ đề",
    addPack: "Thêm Bộ",
    edit: "Sửa",
    view: "Xem",
    delete: "Xóa",
    questions: "câu hỏi",
    back: "Quay lại",
    addQuestion: "Thêm Câu Hỏi",
    editQuestion: "Sửa Câu Hỏi",
    questionText: "Nội Dung Câu Hỏi",
    enterQuestionText: "Nhập nội dung câu hỏi",
    imageUrl: "URL Hình Ảnh",
    optional: "tùy chọn",
    options: "Lựa Chọn",
    option: "Lựa chọn",
    save: "Lưu",
    cancel: "Hủy",
    noQuestions: "Chưa có câu hỏi nào trong bộ này",
    addFirstQuestion: "Thêm câu hỏi đầu tiên",
    listView: "Xem Danh Sách",
    gridView: "Xem Lưới",
    pack: "Bộ",

    modes: {
      classic: {
        title: "Quiz Cổ Điển",
        desc: "Trả lời nhanh – tích điểm – ai cao nhất thắng.",
        help: "Chế độ Cổ điển là định dạng quiz truyền thống nơi người chơi cạnh tranh trả lời câu hỏi nhanh và chính xác nhất có thể. Mỗi câu trả lời đúng kiếm điểm, với điểm thưởng cho những phản hồi nhanh hơn. Người chơi có tổng điểm cao nhất sau tất cả các vòng sẽ thắng cuộc.",
      },
      battle: {
        title: "Đấu Thẻ Bài",
        desc: "Dùng thẻ gây rối thời gian, đảo đáp án, chọn chủ đề.",
        help: "Chế độ Đấu Thẻ Bài thêm các yếu tố chiến thuật với thẻ đặc biệt có thể thay đổi động lực trò chơi. Người chơi có thể sử dụng thẻ để kéo dài hoặc giảm giới hạn thời gian, xáo trộn các lựa chọn trả lời, chọn danmục câu hỏi, hoặc áp dụng các lợi thế chiến thuật khác. Thời điểm sử dụng thẻ là chìa khóa chiến thắng.",
      },
      pve: {
        title: "Đấu AI Host",
        desc: "Máy ra câu hỏi và tung thẻ thử thách cho cả phòng.",
        help: "Trong chế độ Đấu AI Host, trí tuệ nhân tạo đóng vai trò chủ trò chơi, tạo ra câu hỏi và chiến thuật chơi thẻ thách thức ảnh hưởng đến tất cả người chơi. Điều này tạo ra môi trường hợp tác-cạnh tranh nơi người chơi phải thích ứng với các sửa đổi trò chơi do AI kiểm soát trong khi cạnh tranh với nhau.",
      },
    },
    rules: [
      "Trả lời đúng để tích điểm. Nộp càng sớm, điểm bonus càng cao.",
      "Thẻ bài có thể thay đổi thời gian, xáo đáp án, chọn chủ đề.",
      "Hết 10 vòng, người có **tổng điểm cao nhất** thắng.",
    ],
  },
};
// lobbyTranslations.ts
export interface LobbyTranslations {
  home: string;
  room: string;
  players: string;
  maxPlayers: string;
  unlimited: string;
  kickPlayer: string;
  host: string;
  ready: string;
  notReady: string;
  startGame: string;
  chooseGameMode: string;
  gameMode: string;
  quizPacks: string;
  copyLink: string;
  shareRoom: string;
  showQrCode: string;
  settings: string;
  timePerQuestion: string;
  numberOfRounds: string;
  showCorrectAnswer: string;
  allowedPowerCards: string;
  addCustomPack: string;
  showAnswersDesc: string;
  hideAnswersDesc: string;
  powerCards: string;
  powerCardsDesc: string;
}

export const lobbyTranslations: Record<string, LobbyTranslations> = {
  en: {
    home: "Home",
    room: "Room",
    players: "Players",
    maxPlayers: "Max Players",
    unlimited: "Unlimited",
    kickPlayer: "Kick Player",
    host: "Host",
    ready: "Ready",
    notReady: "Not Ready",
    startGame: "Start Game",
    chooseGameMode: "Choose Game Mode",
    gameMode: "Game Mode",
    quizPacks: "Quiz Packs",
    settings: "Settings",
    copyLink: "Copy Link",
    shareRoom: "Share Room",
    showQrCode: "Show QR Code",
    timePerQuestion: "Time per Question",
    numberOfRounds: "Number of Rounds",
    showCorrectAnswer: "Show Correct Answer",
    allowedPowerCards: "Allowed Power Cards",
    addCustomPack: "Add Custom Pack",
    showAnswersDesc: "Players will see the correct answer after each question",
    hideAnswersDesc: "Players won't see the correct answers during the game",
    powerCards: "Power Cards",
    powerCardsDesc: "Select which power cards are available during the game",
  },
  vi: {
    home: "Trang Chủ",
    room: "Phòng",
    players: "Người Chơi",
    maxPlayers: "Số Người Tối Đa",
    unlimited: "Không Giới Hạn",
    kickPlayer: "Đuổi Người Chơi",
    host: "Chủ Phòng",
    ready: "Sẵn Sàng",
    notReady: "Chưa Sẵn Sàng",
    startGame: "Bắt Đầu",
    chooseGameMode: "Chọn Chế Độ Chơi",
    gameMode: "Chế Độ Chơi",
    quizPacks: "Gói Câu Hỏi",
    copyLink: "Sao Chép Liên Kết",
    shareRoom: "Chia Sẻ Phòng",
    showQrCode: "Hiện Mã QR",
    settings: "Cài Đặt",
    timePerQuestion: "Thời Gian Mỗi Câu",
    numberOfRounds: "Số Vòng",
    showCorrectAnswer: "Hiện Đáp Án Đúng",
    allowedPowerCards: "Thẻ Sức Mạnh Được Cho Phép",
    addCustomPack: "Thêm Gói Tùy Chỉnh",
    showAnswersDesc: "Người chơi sẽ thấy đáp án đúng sau mỗi câu hỏi",
    hideAnswersDesc: "Người chơi sẽ không thấy đáp án đúng trong suốt trò chơi",
    powerCards: "Thẻ Sức Mạnh",
    powerCardsDesc: "Chọn thẻ sức mạnh được phép sử dụng trong trò chơi",
    
  },
};