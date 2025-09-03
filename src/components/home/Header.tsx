// components/Header.tsx
"use client";
import React from "react";
import { LanguageSelector } from "@/components/Selector/LanguageSelector";
import { useI18n } from "@/hooks/useI18n";
import { motion } from "framer-motion";
import Image from "next/image";
import logo from "@/app/favicon.ico";
export const Header: React.FC = () => {
  const { t } = useI18n();

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ y: [5, 0, 5] }} // bắt đầu ở dưới, đi lên giữa, rồi xuống lại
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Image src={logo} alt="Quiz Attack Logo" width={50} height={50} />
        </motion.div>
        <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-[#EAEAEA] bg-clip-text text-transparent">
          {t.title}
        </div>
      </div>
      <nav className=" items-center gap-3 text-[#EAEAEA] flex">
        <button className="rounded-xl px-3 py-2 text-sm hover:text-white transition-colors">
          {t.discord}
        </button>
        <LanguageSelector />
      </nav>
    </header>
  );
};
