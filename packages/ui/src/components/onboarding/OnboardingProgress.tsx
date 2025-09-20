import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function OnboardingProgress({ currentStep, totalSteps, className }: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      {/* Progress Info */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Progress</h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            Step {currentStep} <span className="text-slate-400 font-normal">of {totalSteps}</span>
          </p>
        </div>
        <div className="text-right">
          <motion.div
            className="text-3xl font-bold"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            key={progress}
          >
            <span className="gradient-text-accent">{Math.round(progress)}%</span>
          </motion.div>
          <p className="text-sm text-slate-500 mt-1">Complete</p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full" />

        {/* Progress Track */}
        <motion.div
          className="absolute top-1/2 left-0 h-1 gradient-accent rounded-full -translate-y-1/2 shadow-sm"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                className="relative"
              >
                {/* Step Circle */}
                <motion.div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all duration-300',
                    'border-2 shadow-sm',
                    isCompleted && 'bg-green-500 border-green-500 text-white shadow-green-200',
                    isCurrent && 'bg-white border-[#b4e300] text-slate-900 shadow-lg scale-110',
                    isUpcoming && 'bg-white border-slate-300 text-slate-400'
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Check className="w-6 h-6" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <span className={cn('text-sm', isCurrent && 'font-bold')}>
                      {stepNumber}
                    </span>
                  )}
                </motion.div>

                {/* Step Label (optional) */}
                {isCurrent && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  >
                    <span className="text-xs font-medium text-slate-600">Current Step</span>
                  </motion.div>
                )}

                {/* Pulse Animation for Current Step */}
                {isCurrent && (
                  <>
                    <motion.div
                      className="absolute inset-0 w-12 h-12 rounded-full bg-[#b4e300] opacity-30"
                      animate={{
                        scale: [1, 1.5, 1.5],
                        opacity: [0.3, 0, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 w-12 h-12 rounded-full bg-[#b4e300] opacity-20"
                      animate={{
                        scale: [1, 1.3, 1.3],
                        opacity: [0.2, 0, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.5,
                      }}
                    />
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress Description */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-slate-500">
          {currentStep === totalSteps
            ? "You're all done! 🎉"
            : `${totalSteps - currentStep} steps remaining to complete onboarding`}
        </p>
      </motion.div>
    </div>
  );
}