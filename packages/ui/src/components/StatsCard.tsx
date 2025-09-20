import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatsCardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  icon?: React.ReactNode;
  className?: string;
}

export function StatsCard({
  label,
  value,
  change,
  trend,
  icon,
  className
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : trend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              ) : null}
              <span className={cn(
                'text-sm font-medium',
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              )}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}