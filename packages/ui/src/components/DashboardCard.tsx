import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ArrowRight } from 'lucide-react';

export interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  showArrow?: boolean;
}

const variantStyles = {
  default: 'bg-white border-slate-200',
  primary: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
  secondary: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200',
  success: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
  warning: 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200'
};

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
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-slate-600" />
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