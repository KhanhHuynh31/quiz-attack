"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiSearch,
  FiFilter,
  FiBookOpen,
  FiUser,
  FiHash,
  FiSave,
  FiX,
  FiImage,
  FiAward,
  FiHeart,
  FiChevronDown,
  FiCheck,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { Header } from "@/components/home/Header";
import { useI18n } from "@/hooks/useI18n";
import AuthModal from "@/components/users/AuthModal";
import { loadFromLocalStorage, saveToLocalStorage } from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Background from "@/components/Background";
import { FaHome } from "react-icons/fa";
import { LanguageSelector } from "@/components/Selector/LanguageSelector";

interface QuizPack {
  id: number;
  name: string;
  description: string;
  question_count: number;
  category: string;
  author: string;
  id_author?: string;
}

interface QuizQuestion {
  id: number;
  quiz_pack_id: number;
  question: string;
  options: string[];
  image_url?: string;
  correct_answer: number;
  explanation?: string;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  author: string;
}

type AuthorFilter = "all" | "official" | "community" | "liked";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  avatarConfig?: any;
  auth?: boolean;
}

const LOCAL_STORAGE_KEYS = {
  LIKED_PACKS: "liked_quiz_packs",
};

const QuizPacksCRUD: React.FC = () => {
  const { t } = useI18n();
  const router = useRouter();
  const [quizPacks, setQuizPacks] = useState<QuizPack[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorFilter>("all");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingPack, setEditingPack] = useState<QuizPack | null>(null);
  const [viewingQuestions, setViewingQuestions] = useState<number | null>(null);
  const [likedPacks, setLikedPacks] = useState<Set<number>>(new Set());
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [showCategoryInput, setShowCategoryInput] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [showQuestionForm, setShowQuestionForm] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    category: "",
    author: "",
  });

  const [questionFormData, setQuestionFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    explanation: "",
    image_url: "",
  });

  // Authentication state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Lấy danh mục từ database
  const categories = [...new Set(quizPacks.map((pack) => pack.category))];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 20,
        duration: 0.8,
      },
    },
    hover: {
      y: -10,
      scale: 1.03,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
      },
    },
  };

  // Check if user is admin
  const isAdmin = authUser?.auth === true;

  // Load liked packs from localStorage
useEffect(() => {
  const savedLikesArray = loadFromLocalStorage<number[]>(LOCAL_STORAGE_KEYS.LIKED_PACKS, []);
  setLikedPacks(new Set(Array.isArray(savedLikesArray) ? savedLikesArray : []));
}, []);

  // Save liked packs to localStorage
  const saveLikedPacks = (newLiked: Set<number>) => {
    setLikedPacks(newLiked);
    saveToLocalStorage(LOCAL_STORAGE_KEYS.LIKED_PACKS, Array.from(newLiked));
  };

  // Authentication effect
  useEffect(() => {
    let subscriptionCleanup: (() => void) | null = null;

    const checkAuthStatus = async () => {
      setIsCheckingAuth(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileData) {
            setAuthUser(profileData as AuthUser);
          } else {
            await supabase.auth.signOut();
            setAuthUser(null);
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsCheckingAuth(false);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setAuthUser(null);
        } else if (event === "SIGNED_IN" && session?.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profileData) {
            setAuthUser(profileData as AuthUser);
          } else {
            await supabase.auth.signOut();
            setAuthUser(null);
          }
        }
      });

      subscriptionCleanup = () => subscription.unsubscribe();
    };

    checkAuthStatus();

    return () => subscriptionCleanup?.();
  }, []);

  const handleAuthSuccess = (user: AuthUser) => {
    setAuthUser(user);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      setAuthUser(null);
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Count questions for a quiz pack
  const countQuestions = async (packId: number): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("id", { count: "exact" })
        .eq("quiz_pack_id", packId);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error("Error counting questions:", error);
      return 0;
    }
  };

  // Update question count for a quiz pack
  const updateQuestionCount = async (packId: number): Promise<void> => {
    try {
      const questionCount = await countQuestions(packId);
      const { error } = await supabase
        .from("quiz_packs")
        .update({ question_count: questionCount })
        .eq("id", packId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating question count:", error);
    }
  };

  // Fetch quiz packs and update question counts
  const fetchQuizPacks = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("quiz_packs")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      // Update question counts for all packs
      const updatedPacks = await Promise.all(
        (data || []).map(async (pack) => {
          const questionCount = await countQuestions(pack.id);
          if (questionCount !== pack.question_count) {
            await updateQuestionCount(pack.id);
            return { ...pack, question_count: questionCount };
          }
          return pack;
        })
      );

      setQuizPacks(updatedPacks);
    } catch (error) {
      toast.error("Không thể tải quiz packs");
      console.error("Error fetching quiz packs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch questions for a specific pack
  const fetchQuestions = async (packId: number): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_pack_id", packId)
        .order("id", { ascending: true });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      toast.error("Không thể tải câu hỏi");
      console.error("Error fetching questions:", error);
    }
  };

  // Create or update quiz pack
  const saveQuizPack = async (): Promise<void> => {
    if (!authUser) {
      toast.error("Vui lòng đăng nhập để tạo quiz pack");
      openAuthModal();
      return;
    }

    try {
      const packData = {
        name: formData.name,
        description: formData.description,
        question_count: 0,
        category: formData.category,
        author: isAdmin ? "official" : "community",
        id_author: authUser.id,
      };

      let result;
      if (editingPack) {
        // For editing, only update if admin or own pack
        if (!isAdmin && editingPack.id_author !== authUser.id) {
          toast.error("Bạn không có quyền chỉnh sửa quiz pack này");
          return;
        }
        result = await supabase
          .from("quiz_packs")
          .update(packData)
          .eq("id", editingPack.id);
      } else {
        result = await supabase.from("quiz_packs").insert([packData]);
      }

      if (result.error) throw result.error;

      toast.success(
        editingPack ? "Đã cập nhật quiz pack!" : "Đã tạo quiz pack mới!"
      );
      resetForm();
      fetchQuizPacks();
    } catch (error) {
      toast.error("Không thể lưu quiz pack");
      console.error("Error saving quiz pack:", error);
    }
  };

  // Delete quiz pack
  const deleteQuizPack = async (id: number, author: string, id_author?: string): Promise<void> => {
    if (!isAdmin && id_author !== authUser?.id) {
      toast.error("Bạn không có quyền xóa quiz pack này");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xóa quiz pack này?")) {
      return;
    }

    try {
      // First delete all questions in the pack
      await supabase.from("quiz_questions").delete().eq("quiz_pack_id", id);

      // Then delete the pack
      const { error } = await supabase.from("quiz_packs").delete().eq("id", id);

      if (error) throw error;

      toast.success("Đã xóa quiz pack!");
      fetchQuizPacks();
    } catch (error) {
      toast.error("Không thể xóa quiz pack");
      console.error("Error deleting quiz pack:", error);
    }
  };

  // Reset form
  const resetForm = (): void => {
    setFormData({
      name: "",
      description: "",
      category: "",
      author: authUser?.name || "",
    });
    setCategoryInput("");
    setShowCategoryInput(false);
    setEditingPack(null);
    setShowCreateForm(false);
  };

  // Open form for editing
  const openEditForm = (pack: QuizPack): void => {
    if (!isAdmin && pack.id_author !== authUser?.id) {
      toast.error("Bạn không có quyền chỉnh sửa quiz pack này");
      return;
    }
    setEditingPack(pack);
    setFormData({
      name: pack.name,
      description: pack.description,
      category: pack.category,
      author: pack.author,
    });
    setCategoryInput(pack.category);
    setShowCreateForm(true);
  };

  // Toggle questions view
  const toggleQuestions = async (packId: number): Promise<void> => {
    if (viewingQuestions === packId) {
      setViewingQuestions(null);
      setQuestions([]);
      setShowQuestionForm(false);
      setEditingQuestion(null);
    } else {
      setViewingQuestions(packId);
      await fetchQuestions(packId);
    }
  };

  // Toggle like
  const toggleLike = (packId: number): void => {
    const newLiked = new Set(likedPacks);
    if (newLiked.has(packId)) {
      newLiked.delete(packId);
    } else {
      newLiked.add(packId);
    }
    saveLikedPacks(newLiked);
  };

  // Handle category selection
  const handleCategorySelect = (category: string): void => {
    if (category === "new") {
      setShowCategoryInput(true);
      setCategoryInput("");
      setFormData({ ...formData, category: "" });
    } else {
      setFormData({ ...formData, category });
      setCategoryInput(category);
      setShowCategoryInput(false);
    }
  };

  // Handle custom category input
  const handleCategoryInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    setCategoryInput(value);
    setFormData({ ...formData, category: value });
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    saveQuizPack();
  };

  // Reset question form
  const resetQuestionForm = (): void => {
    setQuestionFormData({
      question: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      explanation: "",
      image_url: "",
    });
    setEditingQuestion(null);
  };

  // Handle question input change
  const handleQuestionInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setQuestionFormData({ ...questionFormData, [name]: value });
  };

  // Handle option change
  const handleOptionChange = (index: number, value: string): void => {
    const newOptions = [...questionFormData.options];
    newOptions[index] = value;
    setQuestionFormData({ ...questionFormData, options: newOptions });
  };

  // Save question
  const saveQuestion = async (): Promise<void> => {
    if (!viewingQuestions) return;

    try {
      const questionData = {
        quiz_pack_id: viewingQuestions,
        question: questionFormData.question,
        options: questionFormData.options,
        correct_answer: questionFormData.correct_answer,
        explanation: questionFormData.explanation || null,
        image_url: questionFormData.image_url || null,
      };

      let result;
      if (editingQuestion) {
        result = await supabase
          .from("quiz_questions")
          .update(questionData)
          .eq("id", editingQuestion.id);
      } else {
        result = await supabase.from("quiz_questions").insert([questionData]);
      }

      if (result.error) throw result.error;

      toast.success(
        editingQuestion ? "Đã cập nhật câu hỏi!" : "Đã thêm câu hỏi mới!"
      );
      resetQuestionForm();
      fetchQuestions(viewingQuestions);
      updateQuestionCount(viewingQuestions);
    } catch (error) {
      toast.error("Không thể lưu câu hỏi");
      console.error("Error saving question:", error);
    }
  };

  // Delete question
  const deleteQuestion = async (id: number): Promise<void> => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Đã xóa câu hỏi!");
      if (viewingQuestions) {
        fetchQuestions(viewingQuestions);
        updateQuestionCount(viewingQuestions);
      }
    } catch (error) {
      toast.error("Không thể xóa câu hỏi");
      console.error("Error deleting question:", error);
    }
  };

  // Edit question
  const editQuestion = (question: QuizQuestion): void => {
    setEditingQuestion(question);
    setQuestionFormData({
      question: question.question,
      options: [...question.options],
      correct_answer: question.correct_answer,
      explanation: question.explanation || "",
      image_url: question.image_url || "",
    });
    setShowQuestionForm(true);
  };

  useEffect(() => {
    fetchQuizPacks();
  }, []);

  // Filter quiz packs
  const filteredPacks = quizPacks.filter((pack) => {
    const matchesSearch =
      pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pack.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || pack.category === selectedCategory;

    let matchesAuthor = true;
    if (selectedAuthor === "official") {
      matchesAuthor = pack.author === "official";
    } else if (selectedAuthor === "community") {
      matchesAuthor = pack.author !== "official";
    } else if (selectedAuthor === "liked") {
      matchesAuthor = likedPacks.has(pack.id);
    }

    return matchesSearch && matchesCategory && matchesAuthor;
  });

  if (loading || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <FiBookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Header />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onAuthSuccess={handleAuthSuccess}
      />

      <div className="relative z-10 p-4 md:p-8">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              color: "#f1f5f9",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            },
          }}
        />

        <div className="max-w-7xl mx-auto">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12 flex flex-col lg:flex-row gap-6 items-center justify-between"
          >
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm quiz..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-12 pr-10 py-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="all" className="bg-gray-800">
                    Tất cả danh mục
                  </option>
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="bg-gray-800"
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Author Filter */}
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <select
                  value={selectedAuthor}
                  onChange={(e) =>
                    setSelectedAuthor(e.target.value as AuthorFilter)
                  }
                  className="pl-12 pr-10 py-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 appearance-none cursor-pointer min-w-[160px]"
                >
                  <option value="all" className="bg-gray-800">
                    Tất cả tác giả
                  </option>
                  <option value="official" className="bg-gray-800">
                    Chính thức
                  </option>
                  <option value="community" className="bg-gray-800">
                    Cộng đồng
                  </option>
                  <option value="liked" className="bg-gray-800">
                    Yêu thích
                  </option>
                </select>
              </div>
            </div>

            {/* Add Button - Check auth */}
            <motion.button
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!authUser) {
                  openAuthModal();
                  return;
                }
                resetForm();
                setShowCreateForm(true);
              }}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-2xl"
            >
              <FiPlus className="w-5 h-5" />
              Tạo Quiz Mới
            </motion.button>
          </motion.div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/10 border border-white/20 rounded-3xl p-8 mb-12"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {editingPack ? "Chỉnh sửa Quiz Pack" : "Tạo Quiz Pack Mới"}
                  </h2>
                  <p className="text-white/70">
                    {editingPack
                      ? "Cập nhật thông tin quiz pack"
                      : "Tạo một bộ câu hỏi mới thú vị"}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => resetForm()}
                  className="p-3 text-white/70 hover:text-white rounded-2xl hover:bg-white/10 transition-all duration-300"
                >
                  <FiX className="w-6 h-6" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white/90 font-semibold mb-3">
                    Tên Quiz Pack
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                    placeholder="VD: Kiến thức lịch sử Việt Nam"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/90 font-semibold mb-3">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 resize-none transition-all duration-300"
                    rows={4}
                    placeholder="Mô tả ngắn gọn về nội dung quiz pack của bạn..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-white/90 font-semibold mb-3">
                      Danh mục
                    </label>
                    {!showCategoryInput ? (
                      <div className="relative">
                        <select
                          value={formData.category || ""}
                          onChange={(e) => handleCategorySelect(e.target.value)}
                          className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 appearance-none cursor-pointer"
                          required
                        >
                          <option value="" className="bg-gray-800">
                            Chọn danh mục
                          </option>
                          {categories.map((category) => (
                            <option
                              key={category}
                              value={category}
                              className="bg-gray-800"
                            >
                              {category}
                            </option>
                          ))}
                          <option value="new" className="bg-gray-800 font-bold">
                            + Tạo danh mục mới
                          </option>
                        </select>
                        <FiChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={categoryInput}
                          onChange={handleCategoryInputChange}
                          className="flex-1 px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                          placeholder="Nhập tên danh mục mới"
                          autoFocus
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowCategoryInput(false)}
                          className="px-4 py-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all duration-300"
                        >
                          <FiX className="w-5 h-5" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Author - Readonly if editing, default to user name if creating */}
                  <div>
                    <label className="block text-white/90 font-semibold mb-3">
                      Tác giả
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      readOnly
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white cursor-not-allowed opacity-70"
                      placeholder="Tên của bạn"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-xl"
                  >
                    <FiSave className="w-5 h-5" />
                    {editingPack ? "Cập nhật" : "Tạo mới"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => resetForm()}
                    className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all duration-300"
                  >
                    Hủy
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Quiz Packs Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {filteredPacks.map((pack) => (
              <motion.div
                key={pack.id}
                variants={cardVariants}
                whileHover="hover"
                className="group relative bg-white/10 border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
              >
                {/* Card Header with Gradient */}
                <div className="h-18 bg-gradient-to-br from-blue-800 to-cyan-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
                      {pack.category}
                    </span>
                    {pack.author === "official" && (
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-white text-xs font-bold">
                        OFFICIAL
                      </span>
                    )}
                  </div>
                  <div className="absolute top-4 right-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleLike(pack.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        likedPacks.has(pack.id)
                          ? "bg-red-500 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      <FiHeart
                        className={`w-5 h-5 ${
                          likedPacks.has(pack.id) ? "fill-current" : ""
                        }`}
                      />
                    </motion.button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Title and Author */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-pink-300 group-hover:to-purple-300 group-hover:bg-clip-text transition-all duration-300">
                      {pack.name}
                    </h3>
                    <div className="flex items-center justify-between gap-2 text-white/70">
                      <div className="flex items-center gap-1 text-white/80">
                        <FiUser className="w-4 h-4" />
                        <span className="text-sm">
                          {pack.author === "official"
                            ? "Chính thức"
                            : pack.author || "Cộng đồng"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-white/80">
                        <FiHash className="w-4 h-4" />
                        <span>{pack.question_count} câu</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-white/80 text-sm line-clamp-2 mb-6">
                    {pack.description}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mb-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleQuestions(pack.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-xl hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 border border-blue-500/30"
                    >
                      <FiEye className="w-4 h-4" />
                      {viewingQuestions === pack.id ? "Ẩn" : "Xem"}
                    </motion.button>

                    {(isAdmin || pack.id_author === authUser?.id) && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openEditForm(pack)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 rounded-xl hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 border border-green-500/30"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => deleteQuizPack(pack.id, pack.author, pack.id_author)}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 rounded-xl hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 border border-red-500/30"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {filteredPacks.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <FiBookOpen className="w-20 h-20 text-white/40 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-3xl font-bold text-white/80 mb-4">
                Không tìm thấy quiz pack nào
              </h3>
              <p className="text-white/60 text-lg">
                Thử điều chỉnh bộ lọc hoặc tạo quiz pack mới
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Questions Side Panel */}
      <AnimatePresence>
        {viewingQuestions !== null && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-4xl bg-gradient-to-b from-indigo-900 to-purple-900 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">
                  Câu hỏi trong quiz
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setViewingQuestions(null);
                    setShowQuestionForm(false);
                    setEditingQuestion(null);
                  }}
                  className="p-3 text-white/70 hover:text-white rounded-2xl hover:bg-white/10 transition-all duration-300"
                >
                  <FiX className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Question Form - Only for non-official or admin */}
              {(quizPacks.find((p) => p.id === viewingQuestions)?.author !==
                "official" || isAdmin) && (
                <div className="mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">
                      {editingQuestion
                        ? "Chỉnh sửa câu hỏi"
                        : "Thêm câu hỏi mới"}
                    </h3>
                    {editingQuestion && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          resetQuestionForm();
                          setShowQuestionForm(!showQuestionForm);
                        }}
                        className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300"
                      >
                        {showQuestionForm ? "Hủy" : "Thêm mới"}
                      </motion.button>
                    )}
                  </div>

                  {(showQuestionForm || editingQuestion) && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white/90 font-semibold mb-2">
                          Câu hỏi
                        </label>
                        <input
                          type="text"
                          name="question"
                          value={questionFormData.question}
                          onChange={handleQuestionInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                          placeholder="Nhập câu hỏi..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-white/90 font-semibold mb-2">
                          Hình ảnh (tùy chọn)
                        </label>
                        <input
                          type="text"
                          name="image_url"
                          value={questionFormData.image_url}
                          onChange={handleQuestionInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                          placeholder="URL hình ảnh..."
                        />
                      </div>

                      <div>
                        <label className="block text-white/90 font-semibold mb-2">
                          Các lựa chọn
                        </label>
                        {questionFormData.options.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 mb-2"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setQuestionFormData({
                                  ...questionFormData,
                                  correct_answer: index,
                                })
                              }
                              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                questionFormData.correct_answer === index
                                  ? "bg-green-500"
                                  : "bg-white/20"
                              }`}
                            >
                              {questionFormData.correct_answer === index && (
                                <FiCheck className="w-4 h-4 text-white" />
                              )}
                            </button>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                handleOptionChange(index, e.target.value)
                              }
                              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                              placeholder={`Lựa chọn ${index + 1}...`}
                              required
                            />
                          </div>
                        ))}
                        <p className="text-white/60 text-sm mt-2">
                          Nhấn vào nút tròn để chọn đáp án đúng
                        </p>
                      </div>

                      <div>
                        <label className="block text-white/90 font-semibold mb-2">
                          Giải thích (tùy chọn)
                        </label>
                        <textarea
                          name="explanation"
                          value={questionFormData.explanation}
                          onChange={handleQuestionInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 resize-none transition-all duration-300"
                          rows={3}
                          placeholder="Giải thích cho đáp án đúng..."
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={saveQuestion}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
                        >
                          <FiSave className="w-4 h-4" />
                          {editingQuestion ? "Cập nhật" : "Thêm câu hỏi"}
                        </motion.button>

                        {editingQuestion && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              resetQuestionForm();
                              setShowQuestionForm(false);
                            }}
                            className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all duration-300"
                          >
                            Hủy
                          </motion.button>
                        )}
                      </div>
                    </div>
                  )}

                  {!showQuestionForm && !editingQuestion && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowQuestionForm(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 border border-purple-500/30"
                    >
                      <FiPlus className="w-5 h-5" />
                      Thêm câu hỏi mới
                    </motion.button>
                  )}
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {questions.length > 0 ? (
                  questions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium text-lg mb-3">
                              {question.question}
                            </p>

                            {/* Question Image */}
                            {question.image_url && (
                              <div className="mb-4">
                                <img
                                  src={question.image_url}
                                  alt="Question"
                                  className="w-full h-48 object-cover rounded-xl border border-white/20"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Question Actions - Only for non-official or admin */}
                        {(quizPacks.find((p) => p.id === viewingQuestions)?.author !== "official" || isAdmin) && (
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => editQuestion(question)}
                              className="p-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all duration-300 border border-green-500/30"
                            >
                              <FiEdit3 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => deleteQuestion(question.id)}
                              className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-300 border border-red-500/30"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 gap-3 ml-14">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                              optIndex === question.correct_answer
                                ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300"
                                : "bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                optIndex === question.correct_answer
                                  ? "bg-green-500 text-white"
                                  : "bg-white/20 text-white/80"
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </div>
                            <span className="text-base flex-1">{option}</span>
                            {optIndex === question.correct_answer && (
                              <FiAward className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="mt-4 ml-14 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <FiBookOpen className="w-5 h-5 text-blue-400" />
                            <span className="text-blue-400 text-base font-medium">
                              Giải thích
                            </span>
                          </div>
                          <p className="text-white/80 text-base">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FiImage className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">Chưa có câu hỏi nào</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Floating animation */
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        /* Gradient animation */
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Select dropdown arrow */
        select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 12px center;
          background-repeat: no-repeat;
          background-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default QuizPacksCRUD;