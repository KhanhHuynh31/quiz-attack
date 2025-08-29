"use client";
import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaEye,
  FaList,
  FaTh,
} from "react-icons/fa";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  image?: string;
}

interface QuestionPack {
  id: string;
  name: string;
  topic: string;
  questions: Question[];
}

interface QuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

const QuestionsModal: React.FC<QuestionsModalProps> = ({
  isOpen,
  onClose,
  t,
}) => {
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [editingPack, setEditingPack] = useState<QuestionPack | null>(null);
  const [newPackName, setNewPackName] = useState("");
  const [newPackTopic, setNewPackTopic] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPack, setSelectedPack] = useState<QuestionPack | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Default questions
  const defaultQuestions: Question[] = [
    {
      id: "1",
      text: "Thủ đô của Việt Nam là gì?",
      image:
        "https://images.unsplash.com/photo-1583417319070-4a69db38a482?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      options: ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Huế"],
      correctAnswer: 0,
    },
    {
      id: "2",
      text: "Planet nào lớn nhất trong hệ mặt trời?",
      image:
        "https://images.unsplash.com/photo-1630851240985-cc5227c4e08b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      options: ["Trái Đất", "Sao Mộc", "Sao Thổ", "Sao Hỏa"],
      correctAnswer: 1,
    },
    {
      id: "3",
      text: "Ai vẽ bức tranh Mona Lisa?",
      image:
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      options: [
        "Vincent van Gogh",
        "Pablo Picasso",
        "Leonardo da Vinci",
        "Michelangelo",
      ],
      correctAnswer: 2,
    },
  ];

  // Default packs with questions
  const defaultPacks: QuestionPack[] = [
    {
      id: "gen",
      name: "General Knowledge",
      topic: "General",
      questions: defaultQuestions,
    },
    { id: "game", name: "Video Games", topic: "Entertainment", questions: [] },
    {
      id: "anime",
      name: "Anime & Manga",
      topic: "Entertainment",
      questions: [],
    },
    { id: "tech", name: "Technology", topic: "Science", questions: [] },
    { id: "hist", name: "World History", topic: "History", questions: [] },
    { id: "geo", name: "Geography", topic: "Science", questions: [] },
  ];

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedPacks = localStorage.getItem("questionPacks");
    if (storedPacks) {
      setPacks(JSON.parse(storedPacks));
    } else {
      setPacks(defaultPacks);
      localStorage.setItem("questionPacks", JSON.stringify(defaultPacks));
    }
  }, []);

  // Save to localStorage whenever packs change
  useEffect(() => {
    if (packs.length > 0) {
      localStorage.setItem("questionPacks", JSON.stringify(packs));
    }
  }, [packs]);

  const handleAddPack = () => {
    if (newPackName.trim() && newPackTopic.trim()) {
      const newPack: QuestionPack = {
        id: Math.random().toString(36).substring(7),
        name: newPackName,
        topic: newPackTopic,
        questions: [],
      };
      const updatedPacks = [...packs, newPack];
      setPacks(updatedPacks);
      setNewPackName("");
      setNewPackTopic("");
      setShowAddForm(false);
      setSelectedPack(newPack); // Automatically navigate to the new pack
    }
  };

  const handleEditPack = (pack: QuestionPack) => {
    setEditingPack(pack);
    setNewPackName(pack.name);
    setNewPackTopic(pack.topic);
  };

  const handleSaveEdit = () => {
    if (editingPack && newPackName.trim() && newPackTopic.trim()) {
      const updatedPacks = packs.map((p) =>
        p.id === editingPack.id
          ? { ...p, name: newPackName, topic: newPackTopic }
          : p
      );
      setPacks(updatedPacks);
      setEditingPack(null);
      setNewPackName("");
      setNewPackTopic("");
    }
  };

  const handleDeletePack = (id: string) => {
    const updatedPacks = packs.filter((p) => p.id !== id);
    setPacks(updatedPacks);
    if (selectedPack && selectedPack.id === id) {
      setSelectedPack(null);
    }
  };

  const handleViewQuestions = (pack: QuestionPack) => {
    setSelectedPack(pack);
  };

  const handleBackToPacks = () => {
    setSelectedPack(null);
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const handleSaveQuestion = (question: Question) => {
    if (!selectedPack) return;

    let updatedQuestions: Question[];
    if (editingQuestion) {
      // Update existing question
      updatedQuestions = selectedPack.questions.map((q) =>
        q.id === question.id ? question : q
      );
    } else {
      // Add new question
      updatedQuestions = [...selectedPack.questions, question];
    }

    const updatedPacks = packs.map((p) =>
      p.id === selectedPack.id ? { ...p, questions: updatedQuestions } : p
    );

    setPacks(updatedPacks);
    setShowQuestionForm(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if (!selectedPack) return;

    const updatedQuestions = selectedPack.questions.filter((q) => q.id !== id);
    const updatedPacks = packs.map((p) =>
      p.id === selectedPack.id ? { ...p, questions: updatedQuestions } : p
    );

    setPacks(updatedPacks);
  };

  if (!isOpen) return null;

  // Question Form Component
  const QuestionForm = () => {
    const [text, setText] = useState(editingQuestion?.text || "");
    const [options, setOptions] = useState<string[]>(
      editingQuestion?.options || ["", "", "", ""]
    );
    const [correctAnswer, setCorrectAnswer] = useState(
      editingQuestion?.correctAnswer || 0
    );
    const [image, setImage] = useState(editingQuestion?.image || "");

    const handleOptionChange = (index: number, value: string) => {
      const newOptions = [...options];
      newOptions[index] = value;
      setOptions(newOptions);
    };

    const handleSubmit = () => {
      const newQuestion: Question = {
        id: editingQuestion?.id || Math.random().toString(36).substring(7),
        text,
        options,
        correctAnswer,
        image: image || undefined,
      };
      handleSaveQuestion(newQuestion);
    };

    return (
      <div className="mt-4 p-4 bg-white/5 rounded-xl">
        <h3 className="text-white text-lg font-semibold mb-4">
          {editingQuestion ? "Edit Question" : "Add New Question"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-white block mb-2">Question Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-white block mb-2">
              Image URL (optional)
            </label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-white"
            />
            {image && (
              <div className="mt-2 flex justify-center">
                <img
                  src={image}
                  alt="Preview"
                  className="max-h-40 rounded-lg object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <label className="text-white block mb-2">Options</label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="radio"
                  checked={correctAnswer === index}
                  onChange={() => setCorrectAnswer(index)}
                  className="mr-2"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-white"
                  placeholder={`Option ${index + 1}`}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-[#4CC9F0] px-4 py-2 text-white font-semibold"
            >
              Save Question
            </button>
            <button
              onClick={() => {
                setShowQuestionForm(false);
                setEditingQuestion(null);
              }}
              className="rounded-xl bg-[#EAEAEA] px-4 py-2 text-[#2B2D42] font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Questions List View
  const QuestionsListView = () => {
    if (!selectedPack) return null;

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white text-xl font-semibold">
              {selectedPack.name}
            </h3>
            <p className="text-white/70">
              {selectedPack.topic} • {selectedPack.questions.length} questions
            </p>
          </div>
          <div className="flex gap-2 mr-6">
            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2 text-white font-semibold"
            >
              <FaPlus /> Add Question
            </button>
            <button
              onClick={handleBackToPacks}
              className="rounded-xl bg-[#EAEAEA] px-4 py-2 text-[#2B2D42] font-semibold"
            >
              Back to Packs
            </button>
          </div>
        </div>

        {showQuestionForm ? (
          <QuestionForm />
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {selectedPack.questions.map((question) => (
              <div
                key={question.id}
                className="p-3 rounded-xl border border-white/10 bg-white/5"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 items-center justify-center">
                    <div className="flex items-center gap-2 justify-between">
                      <h4 className="text-white font-medium">
                        {question.text}
                      </h4>
                      <div>
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="text-[#EAEAEA] hover:text-[#4CC9F0] transition-colors p-2"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-[#EAEAEA] hover:text-[#FF6B35] transition-colors p-2"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    {question.image && (
                      <div className="mt-2 flex justify-center">
                        <img
                          src={question.image}
                          alt="Question"
                          className="max-h-[400] rounded-lg object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg ${
                        index === question.correctAnswer
                          ? "bg-green-500/20 text-green-300"
                          : "bg-white/5 text-white"
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {selectedPack.questions.length === 0 && (
              <div className="text-center text-white py-8 bg-white/5 rounded-xl">
                <p className="mb-2">No questions in this pack yet.</p>
                <button
                  onClick={handleAddQuestion}
                  className="text-[#4CC9F0] hover:underline"
                >
                  Add your first question
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Pack Item Component
  const PackItem = ({ pack }: { pack: QuestionPack }) => (
    <div
      className={`p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors ${
        viewMode === "grid"
          ? "flex flex-col"
          : "flex items-center justify-between"
      }`}
    >
      {viewMode === "grid" ? (
        <>
          <div className="flex-1 mb-3">
            <h3 className="text-white font-semibold text-lg">{pack.name}</h3>
            <p className="text-white/70 text-sm">{pack.topic}</p>
          </div>
          <div className="flex justify-between items-center mt-auto">
            <span className="text-white/70 text-sm">
              {pack.questions.length} questions
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleViewQuestions(pack)}
                className="text-[#EAEAEA] hover:text-[#4CC9F0] transition-colors p-2"
                title="View Questions"
              >
                <FaEye />
              </button>
              <button
                onClick={() => handleEditPack(pack)}
                className="text-[#EAEAEA] hover:text-[#4CC9F0] transition-colors p-2"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDeletePack(pack.id)}
                className="text-[#EAEAEA] hover:text-[#FF6B35] transition-colors p-2"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1">
            <h3 className="text-white font-semibold">{pack.name}</h3>
            <p className="text-white/70 text-sm">
              {pack.topic} • {pack.questions.length} questions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewQuestions(pack)}
              className="text-[#EAEAEA] hover:text-[#4CC9F0] transition-colors p-2"
              title="View Questions"
            >
              <FaEye />
            </button>
            <button
              onClick={() => handleEditPack(pack)}
              className="text-[#EAEAEA] hover:text-[#4CC9F0] transition-colors p-2"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDeletePack(pack.id)}
              className="text-[#EAEAEA] hover:text-[#FF6B35] transition-colors p-2"
            >
              <FaTrash />
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Packs List View
  const PacksListView = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Manage Question Packs</h2>
        <div className="flex gap-2 mr-8">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${
              viewMode === "list"
                ? "bg-[#4CC9F0] text-white"
                : "bg-white/10 text-white/70"
            }`}
            title="List View"
          >
            <FaList />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${
              viewMode === "grid"
                ? "bg-[#4CC9F0] text-white"
                : "bg-white/10 text-white/70"
            }`}
            title="Grid View"
          >
            <FaTh />
          </button>
        </div>
      </div>

      <div className="mb-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2 text-white font-semibold"
          >
            <FaPlus /> Add New Pack
          </button>
        ) : (
          <div className="p-4 bg-white/5 rounded-xl mb-4">
            <h3 className="text-white text-lg font-semibold mb-3">
              Add New Question Pack
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-white block mb-1">Pack Name</label>
                <input
                  type="text"
                  value={newPackName}
                  onChange={(e) => setNewPackName(e.target.value)}
                  placeholder="Enter pack name"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <label className="text-white block mb-1">Topic</label>
                <input
                  type="text"
                  value={newPackTopic}
                  onChange={(e) => setNewPackTopic(e.target.value)}
                  placeholder="Enter topic"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-white placeholder:text-white/50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddPack}
                  className="rounded-xl bg-[#4CC9F0] px-4 py-2 text-white font-semibold"
                >
                  Add Pack
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl bg-[#EAEAEA] px-4 py-2 text-[#2B2D42] font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className={`${
          viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-3"
        } max-h-96 overflow-y-auto pr-2`}
      >
        {packs.map((pack) =>
          editingPack?.id === pack.id ? (
            <div key={pack.id} className="p-4 bg-white/5 rounded-xl">
              <h4 className="text-white font-semibold mb-3">Edit Pack</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-white block mb-1">Pack Name</label>
                  <input
                    type="text"
                    value={newPackName}
                    onChange={(e) => setNewPackName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-white"
                  />
                </div>
                <div>
                  <label className="text-white block mb-1">Topic</label>
                  <input
                    type="text"
                    value={newPackTopic}
                    onChange={(e) => setNewPackTopic(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveEdit}
                    className="rounded-xl bg-[#4CC9F0] px-3 py-1 text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingPack(null)}
                    className="rounded-xl bg-[#EAEAEA] px-3 py-1 text-[#2B2D42]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <PackItem key={pack.id} pack={pack} />
          )
        )}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-[#2B2D42] rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#EAEAEA] hover:text-white transition-colors z-10"
        >
          <FaTimes size={24} />
        </button>

        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedPack ? <QuestionsListView /> : <PacksListView />}
        </div>
      </div>
    </div>
  );
};

export default QuestionsModal;
