import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  hover = true,
  onClick
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={cn(
        'bg-white rounded-xl shadow-lg p-6 transition-shadow duration-300',
        hover && 'hover:shadow-xl cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}