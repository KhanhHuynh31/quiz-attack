"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

type Particle = {
  id: number;
  left: string;
  top: string;
  duration: number;
  delay: number;
};

const generateParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 2,
  }));

const Background: React.FC = React.memo(() => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(generateParticles(20));
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#1a1b3a] via-[#2d1b69] to-[#0f0f23]"
        animate={{
          background: [
            "linear-gradient(225deg, #1a1b3a 0%, #2d1b69 50%, #0f0f23 100%)",
            "linear-gradient(225deg, #2d1b69 0%, #1a1b3a 50%, #0f0f23 100%)",
            "linear-gradient(225deg, #1a1b3a 0%, #2d1b69 50%, #0f0f23 100%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
          style={{ left: p.left, top: p.top }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.3) 2px, transparent 0)`,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
});

export default Background;
