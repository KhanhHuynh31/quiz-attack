"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar, { genConfig, AvatarFullConfig } from "react-nice-avatar";
import {
  FaRandom,
  FaTimes,
  FaEye,
  FaSmile,
  FaPalette,
  FaGlasses,
  FaTshirt,
  FaHatCowboy,
} from "react-icons/fa";

// Avatar customization options with labels
export const avatarOptions = {
  sex: [
    { value: "man", label: "Male" },
    { value: "woman", label: "Female" },
  ],
  faceColor: [
    { value: "#F9C9B6", label: "Light" },
    { value: "#AC6651", label: "Tan" },
    { value: "#FFD6C8", label: "Pink" },
    { value: "#FFBCAD", label: "Rosy" },
    { value: "#FF9E83", label: "Peach" },
  ],
  earSize: [
    { value: "small", label: "Small" },
    { value: "big", label: "Large" },
  ],
  eyeStyle: [
    { value: "circle", label: "Round" },
    { value: "oval", label: "Oval" },
    { value: "smile", label: "Smiling" },
    { value: "shadow", label: "Shadowed" },
  ],
  noseStyle: [
    { value: "short", label: "Short" },
    { value: "long", label: "Long" },
    { value: "round", label: "Round" },
  ],
  mouthStyle: [
    { value: "laugh", label: "Laughing" },
    { value: "smile", label: "Smiling" },
    { value: "peace", label: "Peaceful" },
  ],
  shirtStyle: [
    { value: "hoody", label: "Hoodie" },
    { value: "short", label: "T-Shirt" },
    { value: "polo", label: "Polo" },
  ],
  glassesStyle: [
    { value: "none", label: "None" },
    { value: "round", label: "Round" },
    { value: "square", label: "Square" },
  ],
  hairColor: [
    { value: "#000", label: "Black" },
    { value: "#654321", label: "Brown" },
    { value: "#FFC0CB", label: "Pink" },
    { value: "#FFD700", label: "Blonde" },
    { value: "#00FF00", label: "Green" },
    { value: "#FFFFFF", label: "White" },
  ],
  hairStyle: [
    { value: "normal", label: "Normal" },
    { value: "thick", label: "Thick" },
    { value: "mohawk", label: "Mohawk" },
    { value: "womanLong", label: "womanLong" },
    { value: "womanShort", label: "womanShort" },
  ],
  hatStyle: [
    { value: "none", label: "None" },
    { value: "beanie", label: "Beanie" },
    { value: "turban", label: "Turban" },
  ],
  hatColor: [
    { value: "#000", label: "Black" },
    { value: "#654321", label: "Brown" },
    { value: "#FF0000", label: "Red" },
    { value: "#00FF00", label: "Green" },
    { value: "#0000FF", label: "Blue" },
  ],
  eyeBrowStyle: [
    { value: "up", label: "Up" },
    { value: "upWoman", label: "Arched" },
    { value: "down", label: "Down" },
  ],
  shirtColor: [
    { value: "#FC909F", label: "Pink" },
    { value: "#728EFF", label: "Blue" },
    { value: "#FFD6CC", label: "Peach" },
    { value: "#FFBCAD", label: "Coral" },
    { value: "#FF9E83", label: "Orange" },
  ],
  bgColor: [
    { value: "#F4D150", label: "Yellow" },
    { value: "#9287FF", label: "Purple" },
    { value: "#6BD9E9", label: "Teal" },
    { value: "#FC909F", label: "Pink" },
    { value: "#FFD6CC", label: "Peach" },
  ],
};

// Option categories for organized display
export const optionCategories = [
  {
    id: "face",
    label: "Face",
    icon: FaSmile,
    options: [
      "faceColor",
      "eyeStyle",
      "eyeBrowStyle",
      "noseStyle",
      "mouthStyle",
    ],
  },
  {
    id: "hair",
    label: "Hair",
    icon: FaPalette,
    options: ["hairStyle", "hairColor"],
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: FaGlasses,
    options: ["glassesStyle", "hatStyle", "hatColor"],
  },
  {
    id: "clothing",
    label: "Clothing",
    icon: FaTshirt,
    options: ["shirtStyle", "shirtColor"],
  },
  {
    id: "background",
    label: "Background",
    icon: FaHatCowboy,
    options: ["bgColor"],
  },
];

interface AvatarCustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarConfig: AvatarFullConfig;
  setAvatarConfig: React.Dispatch<React.SetStateAction<AvatarFullConfig>>;
}

const AvatarCustomModal: React.FC<AvatarCustomModalProps> = ({
  isOpen,
  onClose,
  avatarConfig,
  setAvatarConfig,
}) => {
  const [activeCategory, setActiveCategory] = useState("face");

  const generateRandomAvatar = () => {
    setAvatarConfig(genConfig());
  };

  const updateAvatarConfig = (key: string, value: any) => {
    setAvatarConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
            >
              <FaTimes className="text-xl" />
            </button>

            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Customize Your Avatar
            </h3>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Avatar Preview */}
              <div className="flex flex-col items-center lg:w-1/3">
                <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-full border-4 border-white/20 overflow-hidden mb-4 relative">
                  <Avatar className="w-full h-full" {...avatarConfig} />
                  {/* Camera icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full">
                    <FaEye className="text-white text-2xl" />
                  </div>
                </div>

                <div className="flex gap-3 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generateRandomAvatar}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-medium text-sm"
                  >
                    <FaRandom />
                    Random
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="bg-[#FF6B35] hover:bg-[#FF7A47] text-white py-3 px-6 rounded-xl font-medium w-full"
                >
                  Confirm Avatar
                </motion.button>
              </div>

              {/* Customization Options */}
              <div className="flex-1">
                {/* Category Selection */}
                <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
                  {optionCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex items-center gap-2 py-2 px-4 rounded-lg whitespace-nowrap ${
                        activeCategory === category.id
                          ? "bg-[#FF6B35] text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      <category.icon />
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-2">
                  {optionCategories
                    .find((cat) => cat.id === activeCategory)
                    ?.options.map((optionKey) => (
                      <div key={optionKey} className="space-y-2">
                        <label className="text-sm font-medium text-white capitalize">
                          {optionKey.replace(/([A-Z])/g, " $1")}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {avatarOptions[
                            optionKey as keyof typeof avatarOptions
                          ].map((option: any) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                updateAvatarConfig(optionKey, option.value)
                              }
                              className={`flex items-center justify-center text-xs p-2 rounded ${
                                avatarConfig[
                                  optionKey as keyof AvatarFullConfig
                                ] === option.value
                                  ? "bg-[#FF6B35] text-white"
                                  : option.value.startsWith("#")
                                  ? "hover:ring-2 hover:ring-white"
                                  : "bg-white/10 text-white/70 hover:bg-white/20"
                              }`}
                              style={
                                option.value.startsWith("#")
                                  ? {
                                      backgroundColor: option.value,
                                      width: "32px",
                                      height: "32px",
                                    }
                                  : { minWidth: "60px" }
                              }
                              title={option.label}
                            >
                              {option.value.startsWith("#") ? "" : option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AvatarCustomModal;
