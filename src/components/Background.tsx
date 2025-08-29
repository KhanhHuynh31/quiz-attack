'use client';

import { useRef, useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';

// Tách các animation keyframes ra file CSS riêng hoặc sử dụng CSS-in-JS tối ưu hơn
const styles = `
  @keyframes float {
    0% { transform: translateY(0) translateX(0); }
    25% { transform: translateY(-20px) translateX(10px); }
    50% { transform: translateY(-35px) translateX(-10px); }
    75% { transform: translateY(-15px) translateX(-15px); }
    100% { transform: translateY(0) translateX(0); }
  }
  @keyframes sweep {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes sweep-reverse {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.5; }
  }
  .animate-float {
    animation: float infinite ease-in-out;
  }
  .animate-sweep {
    animation: sweep 15s infinite linear;
  }
  .animate-sweep-reverse {
    animation: sweep-reverse 20s infinite linear;
  }
  .animate-twinkle {
    animation: twinkle 8s infinite ease-in-out;
  }
`;

// Định nghĩa kiểu cho particle
interface Particle {
  id: number;
  size: number;
  duration: number;
  color: string;
  left: string;
  top: string;
  delay: string;
}

// Tạo component Particles riêng để tránh re-render không cần thiết
const Particles = memo(() => {
  const particlesRef = useRef<Particle[]>([]);
  
  // Khởi tạo particles chỉ một lần
  if (particlesRef.current.length === 0) {
    particlesRef.current = [...Array(50)].map((_, i) => {
      const size = Math.random() * 30 + 5;
      const duration = Math.random() * 10 + 10;
      const colors = ['#ff6b35', '#06d6a0', '#118ab2', '#ef476f'];
      
      return {
        id: i,
        size,
        duration,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`
      };
    });
  }

  return (
    <div className="absolute inset-0 animate-pulse-slow">
      {particlesRef.current.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full opacity-20 animate-float"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: particle.left,
            top: particle.top,
            backgroundColor: particle.color,
            animationDuration: `${particle.duration}s`,
            animationDelay: particle.delay,
          }}
        />
      ))}
    </div>
  );
});

Particles.displayName = 'Particles';

const BackgroundContent = () => {
  const styleElementRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Thêm styles vào DOM chỉ một lần
    if (!styleElementRef.current) {
      const styleElement = document.createElement('style');
      styleElement.innerHTML = styles;
      document.head.appendChild(styleElement);
      styleElementRef.current = styleElement;
    }
    
    // Cleanup function
    return () => {
      if (styleElementRef.current) {
        document.head.removeChild(styleElementRef.current);
        styleElementRef.current = null;
      }
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient nền cơ bản */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800" />
      
      {/* Gradient di chuyển */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent animate-sweep" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-sweep-reverse" />
      
      {/* Các điểm sáng lớn */}
      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl animate-pulse-slower" />
      <div className="absolute top-1/3 left-1/2 h-64 w-64 rounded-full bg-cyan-500/15 blur-2xl animate-pulse-medium" />
      
      {/* Hiệu ứng ánh sáng lấp lánh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] animate-twinkle" />
      
      {/* Particles */}
      <Particles />
    </div>
  );
};

// Component Background chính sử dụng Portal
const Background = () => {
  const [isMounted, setIsMounted] = useState(false);
  const portalRootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Tạo một div mới cho portal nếu chưa tồn tại
    if (!portalRootRef.current) {
      const portalRoot = document.createElement('div');
      portalRoot.id = 'background-portal';
      portalRoot.style.position = 'fixed';
      portalRoot.style.top = '0';
      portalRoot.style.left = '0';
      portalRoot.style.width = '100%';
      portalRoot.style.height = '100%';
      portalRoot.style.zIndex = '-10';
      portalRoot.style.pointerEvents = 'none';
      document.body.appendChild(portalRoot);
      portalRootRef.current = portalRoot;
    }

    return () => {
      // Dọn dẹp khi component unmount
      if (portalRootRef.current) {
        document.body.removeChild(portalRootRef.current);
        portalRootRef.current = null;
      }
    };
  }, []);

  // Nếu chưa mount hoặc không có portal root, không render gì
  if (!isMounted || !portalRootRef.current) {
    return null;
  }

  // Sử dụng portal để render background ra ngoài component tree
  return createPortal(<BackgroundContent />, portalRootRef.current);
};

export default memo(Background);