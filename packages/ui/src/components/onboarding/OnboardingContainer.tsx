import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { OnboardingProgress } from './OnboardingProgress';

export interface OnboardingContainerProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  showProgress?: boolean;
  className?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingContainer({
  currentStep,
  totalSteps,
  children,
  showProgress = true,
  className,
  onComplete,
  onSkip,
}: OnboardingContainerProps) {
  React.useEffect(() => {
    if (currentStep > totalSteps && onComplete) {
      onComplete();
    }
  }, [currentStep, totalSteps, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('min-h-screen py-12 px-4', className)}
    >
      <div className="max-w-5xl mx-auto">
        {onSkip && currentStep <= totalSteps && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end mb-6"
          >
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors px-4 py-2 rounded-lg hover:bg-white/50 backdrop-blur-sm"
            >
              Skip onboarding →
            </button>
          </motion.div>
        )}

        {showProgress && currentStep <= totalSteps && (
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            className="mb-16"
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              duration: 0.5
            }}
            className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 md:p-12 backdrop-blur-xl"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}