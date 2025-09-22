"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaShare,
  FaDownload,
  FaQuestionCircle,
  FaList,
  FaStore,
  FaSave,
  FaTimes,
  FaCheck,
  FaImage,
  FaGamepad,
  FaTrophy,
  FaRocket,
  FaStar,
  FaBolt,
  FaCrown,
  FaFire,
} from "react-icons/fa";

// Types
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  imageUrl?: string;
}

interface QuizPack {
  id: number;
  name: string;
  description: string;
  category: string;
  author: string;
  questionCount: number;
  questions: QuizQuestion[];
}

// Constants
const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
};

const TOAST_STYLES = {
  success: {
    background: "linear-gradient(45deg, #4ecdc4, #44a08d)",
    color: "white",
  },
  error: {
    background: "linear-gradient(45deg, #ff6b6b, #ff8e53)",
    color: "white",
  },
  info: {
    background: "linear-gradient(45deg, #667eea, #764ba2)",
    color: "white",
  },
};

// Custom Hook for Toast Notifications
const useToast = () => {
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    // Create a simple toast notification
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-bold transform transition-all duration-300 ${
      type === "success"
        ? "bg-green-500"
        : type === "error"
        ? "bg-red-500"
        : "bg-blue-500"
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  return { showToast };
};

// Custom Hook for Quiz Management
const useQuizManager = () => {
  const [quizPacks, setQuizPacks] = useState<QuizPack[]>([]);
  const [shopPacks, setShopPacks] = useState<QuizPack[]>([]);
  const { showToast } = useToast();

  const createQuizPack = (packData: Partial<QuizPack>): boolean => {
    if (!packData.name?.trim()) {
      showToast("Please enter quiz name", "error");
      return false;
    }

    const newPack: QuizPack = {
      id: Date.now(),
      name: packData.name || "New Quiz",
      description: packData.description || "",
      category: packData.category || "General",
      author: "user",
      questionCount: 0,
      questions: [],
    };

    setQuizPacks((prev) => [...prev, newPack]);
    showToast("Quiz created successfully!");
    return true;
  };

  const updateQuizPack = (updatedPack: QuizPack): boolean => {
    if (!updatedPack.name.trim()) {
      showToast("Please enter quiz name", "error");
      return false;
    }

    setQuizPacks((prev) =>
      prev.map((pack) => (pack.id === updatedPack.id ? updatedPack : pack))
    );
    showToast("Quiz updated successfully!");
    return true;
  };

  const deleteQuizPack = (id: number): boolean => {
    if (
      !window.confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      return false;
    }

    setQuizPacks((prev) => prev.filter((pack) => pack.id !== id));
    showToast("Quiz deleted successfully!");
    return true;
  };

  const shareToShop = (quizPack: QuizPack): boolean => {
    if (quizPack.questions.length === 0) {
      showToast("Quiz must have at least one question to share", "error");
      return false;
    }

    setShopPacks((prev) => [...prev, { ...quizPack, id: Date.now() }]);
    showToast("Quiz shared to shop!", "info");
    return true;
  };

  const downloadFromShop = (quizPack: QuizPack): void => {
    const newPack = { ...quizPack, id: Date.now() };
    setQuizPacks((prev) => [...prev, newPack]);
    showToast("Quiz downloaded to your collection!");
  };

  return {
    quizPacks,
    shopPacks,
    createQuizPack,
    updateQuizPack,
    deleteQuizPack,
    shareToShop,
    downloadFromShop,
  };
};

// Custom Hook for Question Management
const useQuestionManager = (
  selectedQuizPack: QuizPack | null,
  onQuizUpdate: (pack: QuizPack) => void
) => {
  const { showToast } = useToast();

  const validateQuestion = (question: QuizQuestion): boolean => {
    if (!question.question.trim()) {
      showToast("Please enter a question", "error");
      return false;
    }

    if (question.options.some((opt) => !opt.trim())) {
      showToast("Please fill all options", "error");
      return false;
    }

    if (!question.explanation?.trim()) {
      showToast("Please add an explanation", "error");
      return false;
    }

    return true;
  };

  const addQuestion = (question: QuizQuestion): boolean => {
    if (!selectedQuizPack || !validateQuestion(question)) return false;

    const newQuestion: QuizQuestion = {
      ...question,
      id: Date.now(),
    };

    const updatedPack = {
      ...selectedQuizPack,
      questions: [...selectedQuizPack.questions, newQuestion],
      questionCount: selectedQuizPack.questions.length + 1,
    };

    onQuizUpdate(updatedPack);
    showToast("Question added successfully!");
    return true;
  };

  const updateQuestion = (question: QuizQuestion): boolean => {
    if (!selectedQuizPack || !validateQuestion(question)) return false;

    const updatedQuestions = selectedQuizPack.questions.map((q) =>
      q.id === question.id ? question : q
    );

    const updatedPack = {
      ...selectedQuizPack,
      questions: updatedQuestions,
    };

    onQuizUpdate(updatedPack);
    showToast("Question updated successfully!");
    return true;
  };

  const deleteQuestion = (questionId: number): boolean => {
    if (!selectedQuizPack) return false;

    if (!window.confirm("Are you sure you want to delete this question?")) {
      return false;
    }

    const updatedQuestions = selectedQuizPack.questions.filter(
      (q) => q.id !== questionId
    );
    const updatedPack = {
      ...selectedQuizPack,
      questions: updatedQuestions,
      questionCount: updatedQuestions.length,
    };

    onQuizUpdate(updatedPack);
    showToast("Question deleted successfully!");
    return true;
  };

  return { addQuestion, updateQuestion, deleteQuestion };
};

// Components
const AnimatedIcon = ({
  icon: Icon,
  className = "",
  animate = true,
}: {
  icon: any;
  className?: string;
  animate?: boolean;
}) => (
  <motion.div
    animate={animate ? { rotate: 360 } : {}}
    transition={
      animate ? { duration: 20, repeat: Infinity, ease: "linear" } : {}
    }
    className={className}
  >
    <Icon />
  </motion.div>
);

const GameButton = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "success" | "danger";
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/25",
    secondary:
      "bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/25",
    success:
      "bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/25",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 shadow-red-500/25",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`${
        variants[variant]
      } text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const QuizCard = ({
  pack,
  isSelected,
  onSelect,
  onDelete,
  index,
}: {
  pack: QuizPack;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  index: number;
}) => (
  <motion.div
    initial={ANIMATION_VARIANTS.slideIn.initial}
    animate={ANIMATION_VARIANTS.slideIn.animate}
    exit={ANIMATION_VARIANTS.slideIn.exit}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    className={`relative p-5 border rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
      isSelected
        ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/50 shadow-xl shadow-cyan-500/10"
        : "bg-slate-700/30 border-slate-600/50 hover:bg-slate-600/30 hover:border-purple-400/50 hover:shadow-lg"
    }`}
    onClick={onSelect}
    whileHover={{ y: -2 }}
  >
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-bold text-white text-lg">{pack.name}</h3>
      <div className="flex items-center space-x-2">
        <motion.span
          className="bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full"
          whileHover={{ scale: 1.1 }}
        >
          {pack.questionCount} Q
        </motion.span>
        <motion.button
          whileHover={{ scale: 1.2, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="text-red-400 hover:text-red-300 p-1"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <FaTrash />
        </motion.button>
      </div>
    </div>
    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
      {pack.description}
    </p>
    <div className="flex justify-between items-center">
      <motion.span
        className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 font-medium"
        whileHover={{ scale: 1.05 }}
      >
        {pack.category}
      </motion.span>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center text-cyan-400 text-xs font-bold"
        >
          <FaBolt className="mr-1" />
          ACTIVE
        </motion.div>
      )}
    </div>
  </motion.div>
);

const QuestionForm = ({
  question,
  onSave,
  onCancel,
  onContinue,
}: {
  question: QuizQuestion;
  onSave: (question: QuizQuestion) => void;
  onCancel: () => void;
  onContinue?: () => void;
}) => {
  const [formData, setFormData] = useState<QuizQuestion>(question);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={ANIMATION_VARIANTS.scaleIn.initial}
      animate={ANIMATION_VARIANTS.scaleIn.animate}
      exit={ANIMATION_VARIANTS.scaleIn.exit}
      className="bg-slate-700/40 backdrop-blur-xl p-8 rounded-2xl border border-slate-600/50 mb-8 shadow-2xl"
    >
      <h4 className="font-black text-white mb-6 text-2xl flex items-center">
        <AnimatedIcon icon={FaBolt} className="mr-3 text-yellow-400" />
        {question.id ? "MODIFY CHALLENGE" : "FORGE NEW CHALLENGE"}
      </h4>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-gray-300 mb-3 font-bold text-sm flex items-center">
            <FaQuestionCircle className="mr-2 text-cyan-400" />
            CHALLENGE QUESTION
          </label>
          <motion.input
            type="text"
            className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-gray-400 font-medium text-lg"
            value={formData.question}
            onChange={(e) =>
              setFormData({ ...formData, question: e.target.value })
            }
            placeholder="Enter your epic question..."
            required
            whileFocus={{ scale: 1.02 }}
          />
        </div>

        <div>
          <label className="text-gray-300 mb-3 font-bold text-sm flex items-center">
            <FaImage className="mr-2 text-purple-400" />
            IMAGE URL (Optional)
          </label>
          <motion.input
            type="text"
            className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-gray-400 font-medium"
            value={formData.imageUrl || ""}
            onChange={(e) =>
              setFormData({ ...formData, imageUrl: e.target.value })
            }
            placeholder="https://example.com/image.jpg"
            whileFocus={{ scale: 1.02 }}
          />
        </div>

        <div>
          <label className="text-gray-300 mb-3 font-bold text-sm flex items-center">
            <FaList className="mr-2 text-green-400" />
            BATTLE OPTIONS
          </label>
          <div className="space-y-3">
            {formData.options.map((option: string, index: number) => (
              <motion.div
                key={index}
                className="flex items-center space-x-4"
                whileHover={{ x: 5 }}
              >
                <motion.input
                  type="radio"
                  name="correctAnswer"
                  checked={formData.correctAnswer === index}
                  onChange={() =>
                    setFormData({ ...formData, correctAnswer: index })
                  }
                  className="w-5 h-5 text-green-500 focus:ring-green-400"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                />
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {String.fromCharCode(65 + index)}
                </div>
                <motion.input
                  type="text"
                  className="flex-1 p-4 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-gray-400 font-medium"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}...`}
                  required
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-gray-300 mb-3 font-bold text-sm flex items-center">
            <FaStar className="mr-2 text-yellow-400" />
            VICTORY EXPLANATION
          </label>
          <motion.textarea
            className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white placeholder-gray-400 font-medium resize-none"
            value={formData.explanation || ""}
            onChange={(e) =>
              setFormData({ ...formData, explanation: e.target.value })
            }
            placeholder="Explain why this answer conquers all..."
            required
            rows={4}
            whileFocus={{ scale: 1.02 }}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <GameButton onClick={onCancel} variant="secondary">
            <FaTimes className="mr-2" />
            RETREAT
          </GameButton>
          {onContinue && (
            <GameButton
              onClick={() => {
                onSave(formData);
                onContinue();
              }}
              variant="secondary"
            >
              <FaPlus className="mr-2" />
              FORGE & CONTINUE
            </GameButton>
          )}
          <GameButton type="submit" variant="success">
            <FaSave className="mr-2" />
            COMPLETE FORGE
          </GameButton>
        </div>
      </form>
    </motion.div>
  );
};

const QuizManager = () => {
  const {
    quizPacks,
    shopPacks,
    createQuizPack,
    updateQuizPack,
    deleteQuizPack,
    shareToShop,
    downloadFromShop,
  } = useQuizManager();

  const [selectedQuizPack, setSelectedQuizPack] = useState<QuizPack | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("my-quizzes");
  const [newQuizPack, setNewQuizPack] = useState<Partial<QuizPack>>({
    name: "",
    description: "",
    category: "",
    questions: [],
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { addQuestion, updateQuestion, deleteQuestion } = useQuestionManager(
    selectedQuizPack,
    (updatedPack) => {
      updateQuizPack(updatedPack);
      setSelectedQuizPack(updatedPack);
    }
  );

  const handleCreateQuiz = () => {
    const success = createQuizPack(newQuizPack);
    if (success) {
      const createdPack = quizPacks[quizPacks.length - 1];
      if (createdPack) {
        setSelectedQuizPack(createdPack);
        setIsEditing(true);
      }
      setNewQuizPack({
        name: "",
        description: "",
        category: "",
        questions: [],
      });
      setShowCreateForm(false);
    }
  };

  const handleUpdateQuiz = () => {
    if (selectedQuizPack) {
      const success = updateQuizPack(selectedQuizPack);
      if (success) {
        setIsEditing(false);
      }
    }
  };

  const handleDeleteQuiz = (id: number) => {
    const success = deleteQuizPack(id);
    if (success && selectedQuizPack?.id === id) {
      setSelectedQuizPack(null);
    }
  };

  const getEmptyQuestionTemplate = (): QuizQuestion => ({
    id: 0,
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    imageUrl: "",
  });

  return (
    <div className="min-h-screen  relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center mb-8 p-4 md:p-8">
        <motion.div
          className="flex items-center mb-4 lg:mb-0"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4 rounded-2xl shadow-2xl mr-4"
            whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <FaCrown className="text-white text-3xl" />
          </motion.div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              QUIZ MASTER
            </h1>
            <p className="text-gray-400 text-sm font-semibold tracking-wider">
              LEVEL UP YOUR KNOWLEDGE
            </p>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="relative bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-2 flex shadow-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <GameButton
            className={`relative flex items-center px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeTab === "my-quizzes"
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25"
                : "bg-transparent text-gray-300 hover:text-white hover:bg-slate-700/50"
            }`}
            onClick={() => setActiveTab("my-quizzes")}
          >
            <FaGamepad className="mr-2" />
            MY QUIZZES
          </GameButton>
          <GameButton
            className={`relative flex items-center px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
              activeTab === "shop"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-transparent text-gray-300 hover:text-white hover:bg-slate-700/50"
            }`}
            onClick={() => setActiveTab("shop")}
          >
            <FaStore className="mr-2" />
            QUIZ STORE
          </GameButton>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {activeTab === "my-quizzes" ? (
            <motion.div
              key="my-quizzes"
              initial={ANIMATION_VARIANTS.fadeIn.initial}
              animate={ANIMATION_VARIANTS.fadeIn.animate}
              exit={ANIMATION_VARIANTS.fadeIn.exit}
              transition={{ duration: 0.4 }}
              className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col xl:flex-row h-full">
                {/* Sidebar - Quiz List */}
                <div className="w-full xl:w-1/3 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-6 border-r border-slate-700/50">
                  <div className="mb-6">
                    {showCreateForm ? (
                      <motion.div
                        initial={ANIMATION_VARIANTS.scaleIn.initial}
                        animate={ANIMATION_VARIANTS.scaleIn.animate}
                        className="space-y-4 bg-slate-700/30 backdrop-blur-lg p-6 rounded-2xl border border-slate-600/50"
                      >
                        <motion.input
                          type="text"
                          placeholder="Enter quiz name..."
                          className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-gray-400 font-medium"
                          value={newQuizPack.name}
                          onChange={(e) =>
                            setNewQuizPack({
                              ...newQuizPack,
                              name: e.target.value,
                            })
                          }
                          whileFocus={{ scale: 1.02 }}
                        />
                        <motion.input
                          type="text"
                          placeholder="Description..."
                          className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-gray-400 font-medium"
                          value={newQuizPack.description}
                          onChange={(e) =>
                            setNewQuizPack({
                              ...newQuizPack,
                              description: e.target.value,
                            })
                          }
                          whileFocus={{ scale: 1.02 }}
                        />
                        <motion.input
                          type="text"
                          placeholder="Category..."
                          className="w-full p-4 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-gray-400 font-medium"
                          value={newQuizPack.category}
                          onChange={(e) =>
                            setNewQuizPack({
                              ...newQuizPack,
                              category: e.target.value,
                            })
                          }
                          whileFocus={{ scale: 1.02 }}
                        />
                        <div className="flex space-x-3">
                          <GameButton
                            variant="success"
                            onClick={handleCreateQuiz}
                            className="flex-1"
                          >
                            CREATE
                          </GameButton>
                          <GameButton
                            onClick={() => setShowCreateForm(false)}
                            className="flex-1 bg-slate-600 text-white"
                          >
                            CANCEL
                          </GameButton>
                        </div>
                      </motion.div>
                    ) : (
                      <GameButton
                        className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center shadow-2xl shadow-purple-500/25 relative overflow-hidden"
                        onClick={() => setShowCreateForm(true)}
                      >
                        <FaRocket className="mr-3 text-xl" />
                        CREATE NEW QUEST
                      </GameButton>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-white mb-6 flex items-center">
                    <FaTrophy className="mr-3 text-yellow-400" />
                    YOUR ARSENAL
                  </h2>

                  {quizPacks.length === 0 ? (
                    <motion.div
                      className="text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <AnimatedIcon
                        icon={FaQuestionCircle}
                        className="text-6xl text-purple-400 mx-auto mb-6"
                      />
                      <p className="text-gray-400 mb-6 text-lg">
                        No quests available. Create your first challenge!
                      </p>
                      <GameButton
                        onClick={() => setShowCreateForm(true)}
                        variant="primary"
                      >
                        START YOUR JOURNEY
                      </GameButton>
                    </motion.div>
                  ) : (
                    <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                      <AnimatePresence>
                        {quizPacks.map((pack, index) => (
                          <QuizCard
                            key={pack.id}
                            pack={pack}
                            isSelected={selectedQuizPack?.id === pack.id}
                            onSelect={() => setSelectedQuizPack(pack)}
                            onDelete={() => handleDeleteQuiz(pack.id)}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Main Content - Quiz Details */}
                <div className="w-full xl:w-2/3 p-6 bg-slate-800/20">
                  {selectedQuizPack ? (
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
                        <h2 className="text-3xl font-black text-white">
                          {isEditing ? (
                            <motion.input
                              type="text"
                              className="border-b-2 border-cyan-400 focus:outline-none bg-transparent font-black text-3xl text-white w-full"
                              value={selectedQuizPack.name}
                              onChange={(e) =>
                                setSelectedQuizPack({
                                  ...selectedQuizPack,
                                  name: e.target.value,
                                })
                              }
                              whileFocus={{ scale: 1.02 }}
                            />
                          ) : (
                            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                              {selectedQuizPack.name}
                            </span>
                          )}
                        </h2>
                        <div className="flex space-x-3 flex-wrap">
                          {isEditing ? (
                            <>
                              <GameButton
                                onClick={handleUpdateQuiz}
                                variant="success"
                              >
                                <FaSave className="mr-2" />
                                SAVE
                              </GameButton>
                              <GameButton onClick={() => setIsEditing(false)}>
                                <FaTimes className="mr-2" />
                                CANCEL
                              </GameButton>
                            </>
                          ) : (
                            <>
                              <GameButton
                                onClick={() => setIsEditing(true)}
                                variant="primary"
                              >
                                <FaEdit className="mr-2" />
                                EDIT
                              </GameButton>
                              <GameButton
                                onClick={() => shareToShop(selectedQuizPack)}
                                variant="secondary"
                              >
                                <FaShare className="mr-2" />
                                SHARE
                              </GameButton>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <motion.div
                          className="space-y-4 mb-8"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div>
                            <label className="text-gray-300 mb-2 font-bold text-sm block">
                              DESCRIPTION
                            </label>
                            <motion.input
                              type="text"
                              className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white font-medium"
                              value={selectedQuizPack.description}
                              onChange={(e) =>
                                setSelectedQuizPack({
                                  ...selectedQuizPack,
                                  description: e.target.value,
                                })
                              }
                              whileFocus={{ scale: 1.02 }}
                            />
                          </div>
                          <div>
                            <label className="text-gray-300 mb-2 font-bold text-sm block">
                              CATEGORY
                            </label>
                            <motion.input
                              type="text"
                              className="w-full p-4 bg-slate-700/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white font-medium"
                              value={selectedQuizPack.category}
                              onChange={(e) =>
                                setSelectedQuizPack({
                                  ...selectedQuizPack,
                                  category: e.target.value,
                                })
                              }
                              whileFocus={{ scale: 1.02 }}
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <div className="mb-8">
                          <p className="text-gray-300 text-lg mb-4">
                            {selectedQuizPack.description}
                          </p>
                          <motion.span
                            className="inline-block bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-4 py-2 rounded-full border border-purple-500/30 font-bold text-sm"
                            whileHover={{ scale: 1.05 }}
                          >
                            {selectedQuizPack.category}
                          </motion.span>
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black text-white flex items-center">
                          <FaFire className="mr-3 text-orange-400" />
                          BATTLE QUESTIONS
                        </h3>
                        {isEditing && (
                          <GameButton
                            onClick={() => {
                              setIsAddingQuestion(true);
                              setEditingQuestion(getEmptyQuestionTemplate());
                            }}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500"
                          >
                            <FaPlus className="mr-2" />
                            ADD CHALLENGE
                          </GameButton>
                        )}
                      </div>

                      {/* Question Form */}
                      {(isAddingQuestion || editingQuestion) && (
                        <QuestionForm
                          question={
                            editingQuestion || getEmptyQuestionTemplate()
                          }
                          onSave={(question) => {
                            if (editingQuestion && editingQuestion.id !== 0) {
                              updateQuestion(question);
                            } else {
                              addQuestion(question);
                            }
                            setIsAddingQuestion(false);
                            setEditingQuestion(null);
                          }}
                          onCancel={() => {
                            setIsAddingQuestion(false);
                            setEditingQuestion(null);
                          }}
                          onContinue={() => {
                            setEditingQuestion(getEmptyQuestionTemplate());
                          }}
                        />
                      )}

                      {/* Questions List */}
                      <div className="space-y-6 max-h-[calc(100vh-500px)] overflow-y-auto pr-2">
                        <AnimatePresence>
                          {selectedQuizPack.questions.map((question, index) => (
                            <motion.div
                              key={question.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="relative bg-slate-700/30 backdrop-blur-lg border border-slate-600/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                  <motion.div
                                    className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    whileHover={{ scale: 1.1 }}
                                  >
                                    {index + 1}
                                  </motion.div>
                                  <h4 className="font-bold text-white text-lg">
                                    {question.question}
                                  </h4>
                                </div>
                                {isEditing && (
                                  <div className="flex space-x-3">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="text-blue-400 hover:text-blue-300 p-2"
                                      onClick={() =>
                                        setEditingQuestion(question)
                                      }
                                    >
                                      <FaEdit className="text-lg" />
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="text-red-400 hover:text-red-300 p-2"
                                      onClick={() =>
                                        deleteQuestion(question.id)
                                      }
                                    >
                                      <FaTrash className="text-lg" />
                                    </motion.button>
                                  </div>
                                )}
                              </div>

                              {question.imageUrl && (
                                <div className="mb-4">
                                  <motion.img
                                    src={question.imageUrl}
                                    alt="Question illustration"
                                    className="w-full h-48 object-cover rounded-xl shadow-lg"
                                    whileHover={{ scale: 1.02 }}
                                  />
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                {question.options.map(
                                  (option: string, optIndex: number) => (
                                    <motion.div
                                      key={optIndex}
                                      className={`p-4 rounded-xl border flex items-center font-medium transition-all duration-300 ${
                                        optIndex === question.correctAnswer
                                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-300"
                                          : "bg-slate-600/30 border-slate-500/50 text-gray-300"
                                      }`}
                                      whileHover={{ scale: 1.02 }}
                                    >
                                      {optIndex === question.correctAnswer && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="mr-3"
                                        >
                                          <FaCheck className="text-green-400" />
                                        </motion.div>
                                      )}
                                      <span className="w-6 h-6 bg-slate-500/50 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                        {String.fromCharCode(65 + optIndex)}
                                      </span>
                                      {option}
                                    </motion.div>
                                  )
                                )}
                              </div>

                              <motion.div
                                className="bg-slate-600/30 p-4 rounded-xl border border-slate-500/50"
                                whileHover={{ scale: 1.01 }}
                              >
                                <div className="flex items-center mb-2">
                                  <FaStar className="text-yellow-400 mr-2" />
                                  <span className="font-bold text-yellow-400 text-sm">
                                    EXPLANATION
                                  </span>
                                </div>
                                <p className="text-gray-300 leading-relaxed">
                                  {question.explanation}
                                </p>
                              </motion.div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {selectedQuizPack.questions.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 bg-slate-700/20 rounded-2xl border border-slate-600/30 backdrop-blur-lg"
                          >
                            <AnimatedIcon
                              icon={FaQuestionCircle}
                              className="text-6xl mx-auto mb-6 text-purple-400"
                            />
                            <p className="text-gray-400 text-xl font-medium mb-6">
                              No challenges in this quest yet
                            </p>
                            {isEditing && (
                              <GameButton
                                onClick={() => {
                                  setIsAddingQuestion(true);
                                  setEditingQuestion(
                                    getEmptyQuestionTemplate()
                                  );
                                }}
                                variant="secondary"
                                className="text-lg"
                              >
                                CREATE FIRST CHALLENGE
                              </GameButton>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      className="text-center py-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="text-purple-400 mb-8"
                      >
                        <FaGamepad className="h-24 w-24 mx-auto" />
                      </motion.div>
                      <h3 className="text-3xl font-black text-white mb-4">
                        CHOOSE YOUR QUEST
                      </h3>
                      <p className="text-gray-400 text-lg">
                        {quizPacks.length === 0
                          ? "Begin your journey by creating your first quiz!"
                          : "Select a quest from your arsenal to continue"}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="shop"
              initial={ANIMATION_VARIANTS.fadeIn.initial}
              animate={ANIMATION_VARIANTS.fadeIn.animate}
              exit={ANIMATION_VARIANTS.fadeIn.exit}
              transition={{ duration: 0.4 }}
              className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-8"
            >
              <div className="flex items-center mb-8">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mr-4"
                >
                  <FaStore className="text-4xl text-purple-400" />
                </motion.div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  QUIZ MARKETPLACE
                </h2>
              </div>

              {shopPacks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {shopPacks.map((pack, index) => (
                    <motion.div
                      key={pack.id}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="relative bg-gradient-to-br from-slate-700/30 to-slate-800/30 backdrop-blur-lg border border-slate-600/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      {pack.questions[0]?.imageUrl && (
                        <div className="h-48 overflow-hidden relative">
                          <motion.img
                            src={pack.questions[0].imageUrl}
                            alt={pack.name}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-black text-white text-xl">
                            {pack.name}
                          </h3>
                          <motion.span
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-slate-900 text-xs font-black px-3 py-1 rounded-full"
                            whileHover={{ scale: 1.1 }}
                          >
                            {pack.questionCount} Q
                          </motion.span>
                        </div>
                        <p className="text-gray-300 mb-6 line-clamp-2">
                          {pack.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <motion.span
                            className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30 font-bold"
                            whileHover={{ scale: 1.05 }}
                          >
                            {pack.category}
                          </motion.span>
                          <GameButton
                            onClick={() => downloadFromShop(pack)}
                            variant="success"
                          >
                            <FaDownload className="mr-2" />
                            ACQUIRE
                          </GameButton>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <FaStore className="text-8xl text-purple-400 mx-auto mb-6" />
                  </motion.div>
                  <h3 className="text-3xl font-black text-white mb-4">
                    MARKETPLACE EMPTY
                  </h3>
                  <p className="text-gray-400 text-lg">
                    No quests available for download yet. Share your creations
                    to populate the marketplace!
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizManager;
