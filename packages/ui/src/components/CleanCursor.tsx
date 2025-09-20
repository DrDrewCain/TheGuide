import * as React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export interface CleanCursorProps {
  children: React.ReactNode;
  className?: string;
}

export function CleanCursor({ children, className }: CleanCursorProps) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const [isPointer, setIsPointer] = React.useState(false);

  const springConfig = { damping: 25, stiffness: 350 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  React.useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // Check if hovering over interactive elements (selector-based; avoids layout thrash)
      const target = e.target;
      // Ensure target is an Element before calling closest
      const interactiveEl = target instanceof Element
        ? target.closest(
            'button, a, input, textarea, [role="button"], [data-cursor-style="pointer"]'
          )
        : null;
      const isInteractive = Boolean(interactiveEl);

      setIsPointer(isInteractive);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Custom cursor dot */}
      <motion.div
        className="fixed pointer-events-none z-[9999] hidden lg:block"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
        }}
      >
        <motion.div
          className="relative"
          animate={{
            scale: isPointer ? 0.75 : 1,
          }}
          transition={{ type: "spring", mass: 0.3 }}
        >
          {/* Main dot */}
          <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white" />

          {/* Pointer state ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-slate-900 dark:border-white"
            animate={{
              scale: isPointer ? 2.5 : 0,
              opacity: isPointer ? 0.3 : 0,
            }}
            transition={{ type: "spring", mass: 0.5 }}
          />
        </motion.div>
      </motion.div>

      {/* Trailing cursor effect */}
      <motion.div
        className="fixed pointer-events-none z-[9998] hidden lg:block"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
        }}
      >
        <motion.div
          className="w-8 h-8 rounded-full border border-slate-400 dark:border-slate-600"
          animate={{
            scale: isPointer ? 1.8 : 1,
            opacity: isPointer ? 0.5 : 0.3,
          }}
          transition={{
            type: "spring",
            mass: 0.6,
            damping: 15,
            stiffness: 150
          }}
        />
      </motion.div>

      {/* Content wrapper - hide default cursor on desktop */}
      <div className={`${className || ''} lg:cursor-none`}>
        {children}
      </div>
    </>
  );
}