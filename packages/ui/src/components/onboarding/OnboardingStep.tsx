import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface OnboardingStepProps {
  children: React.ReactNode;
  className?: string;
}

export function OnboardingStep({ children, className }: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn('flex flex-col', className)}
    >
      {children}
    </motion.div>
  );
}