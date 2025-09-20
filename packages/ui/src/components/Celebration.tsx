import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle } from 'lucide-react';

export interface CelebrationProps {
  show: boolean;
  message?: string;
  duration?: number;
  onComplete?: () => void;
}

export function Celebration({
  show,
  message = "Great job!",
  duration = 3000,
  onComplete
}: CelebrationProps) {
  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <motion.div
            initial={{ y: 50 }}
            animate={{ y: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md mx-4"
          >
            <motion.div
              className="relative w-20 h-20 mx-auto mb-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 1,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-br from-[#b4e300] to-green-400 rounded-full"
              />
              <CheckCircle className="absolute inset-0 m-auto w-10 h-10 text-white" />

              {/* Sparkle animations */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ rotate: i * 60 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.1,
                    repeat: 2
                  }}
                >
                  <Sparkles className="w-4 h-4 text-[#b4e300] translate-y-8" />
                </motion.div>
              ))}
            </motion.div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {message}
            </h3>
            <p className="text-slate-600">
              You're making great progress!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Minimal celebration for smaller achievements
export function MiniCelebration({ trigger, children }: { trigger: boolean; children?: React.ReactNode }) {
  const [showSparkles, setShowSparkles] = React.useState(false);

  React.useEffect(() => {
    if (trigger) {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="relative inline-block">
      {children}
      <AnimatePresence>
        {showSparkles && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -inset-2 pointer-events-none"
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: `${25 + (i % 2) * 50}%`,
                  left: `${25 + Math.floor(i / 2) * 50}%`
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1
                }}
              >
                <Sparkles className="w-4 h-4 text-[#b4e300]" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}