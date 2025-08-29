// components/LanguageSelector.tsx
"use client";
import React from "react";
import { FaGlobe } from "react-icons/fa";
import { useI18n } from "@/hooks/useI18n";
import { LanguageCode } from "@/i18n";

interface LanguageSelectorProps {
  className?: string;
  variant?: "default" | "mobile";
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  variant = "default",
}) => {
  const { language, changeLanguage } = useI18n();
  
  const isMobile = variant === "mobile";
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(e.target.value as LanguageCode);
  };

  return (
    <div className={`
      flex items-center gap-2 text-white ring-1 ring-white/10 
      ${isMobile 
        ? "w-full justify-center p-3 rounded-2xl bg-white/10" 
        : "rounded-xl bg-white/5 px-3 py-2 text-sm"
      } 
      ${className}
    `}>
      {!isMobile && <FaGlobe />}
      <select
        className="bg-transparent outline-none text-white [&>option]:bg-[#2B2D42] [&>option]:text-white cursor-pointer"
        value={language}
        onChange={handleLanguageChange}
      >
        <option value="en">EN</option>
        <option value="vi">VI</option>
      </select>
    </div>
  );
};