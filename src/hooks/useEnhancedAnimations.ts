import { Transition, Variants } from "framer-motion";
import { useState } from "react";

// Custom hook for enhanced animations
export const useEnhancedAnimations = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const staggerChildren: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      } as Transition,
    },
  };

  const slideInLeft: Variants = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 } as Transition,
    },
  };

  const slideInRight: Variants = {
    hidden: { x: 100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 } as Transition,
    },
  };

  const scaleIn: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 } as Transition,
    },
  };

  const fadeUp: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" } as Transition,
    },
  };

// Animation variants - sửa lỗi ease function
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

  return {
    staggerChildren,
    slideInLeft,
    slideInRight,
    scaleIn,
    fadeUp,
    containerVariants,
    isAnimating,
    setIsAnimating,
  };
};