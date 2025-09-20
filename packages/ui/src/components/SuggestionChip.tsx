import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

/**
 * Props for the SuggestionChip component
 */
export interface SuggestionChipProps {
  /** The content to be displayed inside the chip */
  children: React.ReactNode;
  /** Additional CSS classes to apply to the chip */
  className?: string;
  /** Optional icon to display before the content */
  icon?: React.ReactNode;
  /** Click handler for the chip */
  onClick?: () => void;
  /** Whether the chip is disabled */
  disabled?: boolean;
}

/**
 * A clickable chip component for displaying suggestions or options
 *
 * @example
 * ```tsx
 * <SuggestionChip icon="🎯" onClick={() => console.log('clicked')}>
 *   Career Change
 * </SuggestionChip>
 * ```
 *
 * @param props - The component props
 * @returns A styled chip component with hover and click animations
 */
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="text-lg" aria-hidden="true">{icon}</span>}
      {children}
    </motion.button>
  );
}