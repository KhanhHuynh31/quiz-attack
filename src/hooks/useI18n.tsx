// hooks/useI18n.tsx
"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { translations } from "@/i18n";
import { LanguageCode, TranslationData } from "@/i18n/translations";

interface I18nContextType {
  language: LanguageCode;
  changeLanguage: (lang: LanguageCode) => void;
  t: TranslationData;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>("en");

  useEffect(() => {
    // Get saved language or detect browser language
    const saved = localStorage.getItem("quiz-attack-lang") as LanguageCode | null;
    const browserLang = navigator.language.split("-")[0];
    const defaultLang = saved || (browserLang === "vi" ? "vi" : "en");
    setLanguage(defaultLang);
  }, []);

  const changeLanguage = useCallback((lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem("quiz-attack-lang", lang);
  }, []);

  const t: TranslationData = translations[language] || translations.en;

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};