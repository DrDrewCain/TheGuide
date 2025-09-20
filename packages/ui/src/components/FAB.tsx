import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Plus, X } from 'lucide-react';

export interface FABProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
  children?: React.ReactNode;
}

export function FAB({
  onClick,
  icon = <Plus className="w-6 h-6" />,
  label,
  position = 'bottom-right',
  className,
  children
}: FABProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const handleClick = () => {
    if (children) {
      setIsExpanded(!isExpanded);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className={cn('fixed z-50', positionClasses[position])}>
        <AnimatePresence mode="wait">
          {isExpanded && children && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 mb-2"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className={cn(
            'flex items-center gap-2 px-4 py-4 rounded-full shadow-lg',
            'bg-gradient-to-r from-[#b4e300] to-green-400',
            'text-slate-900 hover:shadow-xl transition-shadow',
            'focus:outline-none focus:ring-4 focus:ring-[#b4e300]/30',
            className
          )}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded && children ? <X className="w-6 h-6" /> : icon}
          </motion.div>
          {label && (
            <span className="font-medium pr-1">{label}</span>
          )}
        </motion.button>
      </div>
    </>
  );
}

export interface FABMenuProps {
  items: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }>;
}

export function FABMenu({ items }: FABMenuProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={item.onClick}
          className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow whitespace-nowrap"
        >
          <span className="text-slate-600">{item.icon}</span>
          <span className="text-sm font-medium text-slate-900">{item.label}</span>
        </motion.button>
      ))}
    </div>
  );
}