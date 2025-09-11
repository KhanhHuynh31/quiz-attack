// components/LanguageSelector.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Flag from "react-world-flags";
import { useI18n } from "@/hooks/useI18n";
import { LanguageCode } from "@/i18n/translations";

interface LanguageSelectorProps {
  className?: string;
  variant?: "default" | "mobile";
}

interface LanguageOption {
  code: LanguageCode;
  label: string;
  countryCode: string; 
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "default",
}) => {
  const { language, changeLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<LanguageOption | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMobile = variant === "mobile";

  const languages: LanguageOption[] = [
    { code: "en", label: "English", countryCode: "US" },
    { code: "vi", label: "Tiếng Việt", countryCode: "VN" },
  ];

  useEffect(() => {
    const currentLanguage = languages.find((lang) => lang.code === language);
    if (currentLanguage) {
      setSelectedOption(currentLanguage);
    }
  }, [language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: LanguageOption) => {
    changeLanguage(option.code);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Animation variants
  const buttonVariants = {
    idle: { 
      scale: 1,
      boxShadow: "0 4px 20px rgba(59, 130, 246, 0.1)",
    },
    hover: { 
      scale: 1.02,
      boxShadow: "0 8px 30px rgba(59, 130, 246, 0.2)",
      backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    tap: { 
      scale: 0.98,
    }
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 300,
        duration: 0.2,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -8,
      transition: {
        duration: 0.15,
        ease: "easeInOut" as const
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.03,
        type: "spring" as const,
        damping: 25,
        stiffness: 400,
      }
    }),
    hover: {
      x: 2,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 400,
      }
    }
  };

  const chevronVariants = {
    closed: { rotate: 0 },
    open: { 
      rotate: 180,
      transition: {
        type: "spring" as const,
        damping: 15,
        stiffness: 300,
      }
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Main Button */}
      <motion.button
        type="button"
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        className={`
          relative overflow-hidden backdrop-blur-md border border-white/20
          flex items-center justify-center gap-2 text-white
          ${
            isMobile
              ? "w-full p-4 rounded-2xl"
              : "rounded-xl px-4 py-3 text-sm min-w-[60px]"
          }
          bg-gradient-to-r from-slate-800/40 via-slate-700/40 to-slate-800/40
          hover:from-slate-700/50 hover:via-slate-600/50 hover:to-slate-700/50
          focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50
        `}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* Subtle animated background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative flex items-center gap-2">
          {selectedOption && (
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" as const, damping: 20, stiffness: 300 }}
            >
              <motion.div
                className={`${isMobile ? "w-8 h-6" : "w-6 h-4"} rounded-sm overflow-hidden shadow-md`}
                whileHover={{ 
                  scale: 1.1,
                  y: -2,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                }}
                transition={{ 
                  type: "spring" as const, 
                  damping: 15, 
                  stiffness: 400
                }}
              >
                <Flag 
                  code={selectedOption.countryCode} 
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover" 
                  }} 
                />
              </motion.div>
            </motion.div>
          )}

          <motion.div
            variants={chevronVariants}
            animate={isOpen ? "open" : "closed"}
            className="ml-1"
          >
            <FaChevronDown
              className="text-white/60"
              size={isMobile ? 14 : 12}
            />
          </motion.div>
        </div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              absolute right-0 z-50 mt-3 origin-top-right
              rounded-xl backdrop-blur-xl bg-slate-800/90 
              border border-white/10 shadow-xl
              ${isMobile ? "w-full" : "w-48"}
            `}
            style={{
              transformStyle: "preserve-3d",
            }}
            role="listbox"
          >
            {/* Subtle gradient border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-[1px]">
              <div className="h-full w-full rounded-xl bg-slate-800/95 backdrop-blur-xl" />
            </div>

            <div className="relative p-2 space-y-2">
              {languages.map((option, index) => (
                <motion.li
                  key={option.code}
                  custom={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className={`
                    list-none flex cursor-pointer items-center gap-3 
                    px-3 py-2.5 rounded-lg transition-all duration-200
                    ${selectedOption?.code === option.code 
                      ? "bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-400/20" 
                      : "hover:bg-white/5"
                    }
                  `}
                  onClick={() => handleOptionClick(option)}
                  role="option"
                  aria-selected={selectedOption?.code === option.code}
                >
                  <motion.div
                    className="w-6 h-4 rounded-sm overflow-hidden shadow-sm"
                    whileHover={{ 
                      scale: 1.1,
                      y: -1
                    }}
                    transition={{ 
                      type: "spring" as const, 
                      damping: 12, 
                      stiffness: 400
                    }}
                  >
                    <Flag 
                      code={option.countryCode} 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover" 
                      }} 
                    />
                  </motion.div>
                  
                  <span className="flex-1 text-white font-medium text-sm">
                    {option.label}
                  </span>
                  
                  {selectedOption?.code === option.code && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        type: "spring" as const, 
                        damping: 15, 
                        stiffness: 400,
                        delay: 0.1 
                      }}
                      className="relative"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
                      <motion.div
                        className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                        animate={{
                          scale: [1, 1.8, 1],
                          opacity: [0.7, 0, 0.7],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  )}
                </motion.li>
              ))}
            </div>

            {/* Gentle floating elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {[...Array(2)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 h-0.5 bg-blue-300/40 rounded-full"
                  animate={{
                    x: [0, 60, 0],
                    y: [0, -30, 0],
                    opacity: [0, 0.6, 0],
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    delay: i * 1.5,
                    ease: "easeInOut",
                  }}
                  style={{
                    left: `${30 + i * 40}%`,
                    top: `${60}%`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};