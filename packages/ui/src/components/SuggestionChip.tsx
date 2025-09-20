import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export interface SuggestionChipProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function SuggestionChip({
  children,
  className,
  icon,
  onClick,
  disabled
}: SuggestionChipProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-gray-100 hover:bg-gray-200 text-gray-700',
        'transition-colors duration-200 text-sm font-medium',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </motion.button>
  );
}