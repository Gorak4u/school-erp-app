'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function Background() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const backgroundX = useSpring(mouseX);
  const backgroundY = useSpring(mouseY);

  useEffect(() => {
    setIsClient(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0">
      {/* Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      {/* Animated Gradient Orbs */}
      {isClient && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 40%)`,
          }}
        />
      )}
      
      {/* Floating Geometric Elements */}
      {[...Array(8)].map((_, i) => {
        const seed = i * 1234;
        const left = ((seed * 7.3) % 100);
        const top = ((seed * 11.7) % 100);
        const size = 100 + (seed % 200);
        const rotation = (seed % 360);
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
            }}
            animate={{
              rotate: [rotation, rotation + 360],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 15 + (seed % 10),
              repeat: Infinity,
              ease: "linear"
            }}
            aria-hidden="true"
          >
            <div className={`w-full h-full border border-blue-500/20 rounded-lg transform rotate-45`} />
          </motion.div>
        );
      })}

      {/* Grid Pattern */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-5" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
