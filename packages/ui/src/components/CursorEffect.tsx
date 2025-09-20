'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../lib/utils';

export interface CursorEffectProps {
  children: React.ReactNode;
  className?: string;
  cursorClassName?: string;
  showDefault?: boolean;
}

export function CursorEffect({
  children,
  className,
  cursorClassName,
  showDefault = false
}: CursorEffectProps) {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const [isHovering, setIsHovering] = React.useState(false);

  React.useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, []);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const cursorVariants = {
    default: {
      scale: 1,
      backgroundColor: 'rgba(180, 227, 0, 0.5)',
    },
    hover: {
      scale: 1.5,
      backgroundColor: 'rgba(180, 227, 0, 0.3)',
    },
    click: {
      scale: 0.8,
      backgroundColor: 'rgba(180, 227, 0, 0.7)',
    }
  };

  return (
    <>
      {/* Custom Cursor */}
      <motion.div
        className={cn(
          "fixed w-8 h-8 rounded-full pointer-events-none z-[9999] mix-blend-difference",
          cursorClassName,
          !showDefault && "lg:block hidden"
        )}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        variants={cursorVariants}
        animate={isHovering ? 'hover' : 'default'}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 28
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            background: 'radial-gradient(circle, rgba(180, 227, 0, 0.3) 0%, transparent 70%)',
          }}
        />
      </motion.div>

      {/* Cursor Trail Effect */}
      {isHovering && (
        <motion.div
          className="fixed w-6 h-6 rounded-full pointer-events-none z-[9998] bg-[#b4e300] opacity-20"
          style={{
            x: cursorX,
            y: cursorY,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatDelay: 0.1
          }}
        />
      )}

      {/* Content with hover detection */}
      <div
        className={cn(
          !showDefault && "lg:cursor-none",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </>
  );
}