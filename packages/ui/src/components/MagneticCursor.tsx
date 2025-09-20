'use client';

import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Props for the MagneticCursor component
 */
export interface MagneticCursorProps {
  /** The content to wrap with the magnetic cursor effect */
  children: React.ReactNode;
  /** Additional CSS classes to apply to the wrapper */
  className?: string;
}

/**
 * A premium cursor effect component that creates a magnetic, interactive cursor
 * with smooth spring animations and hover states
 *
 * Features:
 * - Magnetic attraction to interactive elements
 * - Smooth spring-based animations
 * - Multi-layered visual effects (core, ring, glow, trail)
 * - Custom cursor text on hover
 * - Performance optimized with RAF throttling
 *
 * @example
 * ```tsx
 * <MagneticCursor>
 *   <App />
 * </MagneticCursor>
 * ```
 *
 * @param props - The component props
 * @returns A wrapper component that adds magnetic cursor effects
 */
export function MagneticCursor({ children, className }: MagneticCursorProps) {
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorSize = useMotionValue(20);

  const springConfig = { damping: 35, stiffness: 400, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const cursorSizeSpring = useSpring(cursorSize, { damping: 35, stiffness: 300 });

  const [isPointer, setIsPointer] = React.useState(false);
  const [cursorText, setCursorText] = React.useState('');
  const [isVisible, setIsVisible] = React.useState(false);

  // Outer ring that lags behind
  const ringSpringConfig = { damping: 40, stiffness: 200, mass: 0.8 };
  const ringX = useSpring(cursorX, ringSpringConfig);
  const ringY = useSpring(cursorY, ringSpringConfig);

  // Subtle glow that follows with more lag
  const glowX = useTransform(ringX, (x) => x - 100);
  const glowY = useTransform(ringY, (y) => y - 100);

  React.useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      cursorX.set(x);
      cursorY.set(y);

      // Check if hovering over interactive elements
      const target = e.target as HTMLElement;

      // Check for custom cursor attributes
      const cursorStyle = target.getAttribute('data-cursor-style');
      const cursorTextAttr = target.getAttribute('data-cursor-text');

      if (cursorTextAttr) {
        setCursorText(cursorTextAttr);
      } else {
        setCursorText('');
      }

      // Determine if element is interactive (selector-based; avoids layout thrash)
      const interactiveEl = target.closest(
        'button, a, input, textarea, [role="button"], [data-cursor-style="pointer"], [data-cursor-text]'
      );
      const isInteractive = Boolean(interactiveEl) || cursorStyle === 'pointer';

      // Apply magnetic effect for buttons
      if (isInteractive) {
        const buttonElement = target.tagName === 'BUTTON' ? target : target.closest('button');
        if (buttonElement) {
          const rect = buttonElement.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const distX = x - centerX;
          const distY = y - centerY;
          const distance = Math.sqrt(distX * distX + distY * distY);

          if (distance < 100) {
            const magnetStrength = (100 - distance) / 100;
            const magnetX = centerX + distX * (1 - magnetStrength * 0.2);
            const magnetY = centerY + distY * (1 - magnetStrength * 0.2);
            cursorX.set(magnetX);
            cursorY.set(magnetY);
          }
        }
      }

      setIsPointer(isInteractive);
      cursorSize.set(isInteractive ? 8 : cursorStyle === 'large' ? 40 : 20);
    };

    const handlePointerOver = () => setIsVisible(true);
    const handlePointerOut = (e: PointerEvent) => {
      // relatedTarget === null => left the window
      if (!e.relatedTarget) setIsVisible(false);
    };

    let frameRequested = false;
    let lastEvent: MouseEvent | null = null;
    const rafMove = (e: MouseEvent) => {
      lastEvent = e;
      if (!frameRequested) {
        frameRequested = true;
        requestAnimationFrame(() => {
          if (lastEvent) moveCursor(lastEvent);
          frameRequested = false;
        });
      }
    };

    document.addEventListener('mousemove', rafMove, { passive: true });
    window.addEventListener('pointerover', handlePointerOver, { passive: true });
    window.addEventListener('pointerout', handlePointerOut, { passive: true });

    // Set initial visibility
    setIsVisible(true);

    return () => {
      document.removeEventListener('mousemove', rafMove);
      window.removeEventListener('pointerover', handlePointerOver);
      window.removeEventListener('pointerout', handlePointerOut);
    };
  }, [cursorX, cursorY, cursorSize]);

  return (
    <>
      {/* Ambient glow effect - very subtle */}
      <motion.div
        className="fixed w-[200px] h-[200px] pointer-events-none z-[9995] hidden lg:block"
        style={{
          left: glowX,
          top: glowY,
          opacity: isVisible ? 0.03 : 0,
        }}
        transition={{ opacity: { duration: 0.3 } }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(180, 227, 0, 0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </motion.div>

      {/* Outer ring - slow follow */}
      <motion.div
        className="fixed pointer-events-none z-[9997] hidden lg:block"
        style={{
          left: ringX,
          top: ringY,
          x: '-50%',
          y: '-50%',
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ opacity: { duration: 0.3 } }}
      >
        <motion.div
          className="rounded-full border border-slate-400/10 dark:border-slate-600/20"
          animate={{
            width: isPointer ? 48 : 40,
            height: isPointer ? 48 : 40,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </motion.div>

      {/* Main cursor dot */}
      <motion.div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] hidden lg:flex items-center justify-center"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ opacity: { duration: 0.3 } }}
      >
        <motion.div
          className="relative flex items-center justify-center"
          style={{
            width: cursorSizeSpring,
            height: cursorSizeSpring,
          }}
        >
          {/* Core dot */}
          <motion.div
            className="absolute inset-0 rounded-full bg-slate-800 dark:bg-slate-300"
            animate={{
              scale: isPointer ? 0.5 : 1,
            }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          />

          {/* Text label when hovering special elements */}
          {cursorText && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute left-full ml-4 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {cursorText}
            </motion.div>
          )}
        </motion.div>

        {/* Interactive state indicator */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-slate-700 dark:border-slate-400"
          animate={{
            scale: isPointer ? 2 : 0,
            opacity: isPointer ? 0.2 : 0,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        />
      </motion.div>

      {/* Trail effect for movement */}
      <motion.div
        className="fixed pointer-events-none z-[9996] hidden lg:block"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: '-50%',
          y: '-50%',
          opacity: isVisible ? 0.3 : 0,
        }}
      >
        <motion.div
          className="rounded-full bg-slate-400/20 dark:bg-slate-600/20"
          animate={{
            width: isPointer ? 24 : 16,
            height: isPointer ? 24 : 16,
            scale: [1, 1.5, 1],
          }}
          transition={{
            scale: {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      </motion.div>

      {/* Content wrapper - sophisticated cursor hiding */}
      <div className={`${className || ''} [&_*]:lg:!cursor-none`}>
        {children}
      </div>
    </>
  );
}