import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ArrowRight } from 'lucide-react';

/**
 * Props for the DashboardCard component
 */
export interface DashboardCardProps {
  /** Card title displayed in the header */
  title: string;
  /** Optional description text */
  description?: string;
  /** Icon element or emoji string */
  icon?: React.ReactNode;
  /** Custom action element for the header */
  action?: React.ReactNode;
  /** Click handler for the entire card */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children?: React.ReactNode;
  /** Visual style variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  /** Whether to show arrow indicator on hover (only when clickable) */
  showArrow?: boolean;
}

/**
 * Variant styles mapping for different card appearances
 */
const variantStyles = {
  default: 'bg-white border-slate-200',
  primary: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
  secondary: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200',
  success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
  warning: 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200'
};

/**
 * Interactive dashboard card component with hover effects
 *
 * Features:
 * - Multiple color variants with gradient backgrounds
 * - Click interactions with scale animations
 * - Icon and action slots in the header
 * - Automatic arrow indicator for clickable cards
 *
 * @example
 * ```tsx
 * <DashboardCard
 *   title="Active Decisions"
 *   description="Track your ongoing analysis"
 *   icon="🎯"
 *   variant="primary"
 *   onClick={() => router.push('/decisions')}
 * />
 * ```
 *
 * @param props - The component props
 * @returns An animated dashboard card
 */
export function DashboardCard({
  title,
  description,
  icon,
  action,
  onClick,
  className,
  children,
  variant = 'default',
  showArrow = true
}: DashboardCardProps) {
  const isClickable = !!onClick;

  return (
    <motion.div
      whileHover={isClickable ? { scale: 1.02, y: -4 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          // Prevent double-activating if inner control handled it
          if (!(e.target as HTMLElement).closest('button, a, [role="button"]')) {
            e.preventDefault();
            onClick();
          }
        }
      } : undefined}
      className={cn(
        'relative rounded-xl border shadow-sm transition-all duration-200',
        variantStyles[variant],
        isClickable && 'cursor-pointer hover:shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-slate-600">
              {typeof icon === 'string' ? (
                <span className="text-2xl">{icon}</span>
              ) : (
                icon
              )}
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
        {isClickable && showArrow && !action && (
          <motion.div
            initial={{ x: 0 }}
            whileHover={{ x: 3 }}
            className="flex-shrink-0"
          >
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center" aria-hidden="true">
              <ArrowRight className="w-4 h-4 text-slate-600" aria-hidden="true" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {description && (
          <p className="text-slate-600 mb-4">{description}</p>
        )}
        {children}
      </div>
    </motion.div>
  );
}