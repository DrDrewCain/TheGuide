import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { ArrowRight, Sparkles } from 'lucide-react';

export interface GuestPromptProps {
  className?: string;
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  defaultValue?: string;
}

export function GuestPrompt({
  className,
  onSubmit,
  isLoading = false,
  placeholder = "e.g., Should I accept a job offer in Austin with a 20% pay increase?",
  defaultValue = ""
}: GuestPromptProps) {
  const [prompt, setPrompt] = React.useState(defaultValue);
  const [isFocused, setIsFocused] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt);
    }
  };

  const suggestions = [
    "Should I take a job offer with 30% more pay but longer hours?",
    "Is it worth moving to Seattle for a tech job?",
    "Should I go back to school for an MBA or keep working?",
    "Buy a house now or wait for market conditions to improve?"
  ];

  React.useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [prompt]);

  React.useEffect(() => {
    // Update prompt when defaultValue changes
    setPrompt(defaultValue);
  }, [defaultValue]);

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      <motion.form
        onSubmit={handleSubmit}
        className={cn(
          'relative bg-white rounded-2xl shadow-xl transition-all duration-300',
          isFocused && 'shadow-2xl ring-2 ring-blue-500'
        )}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-start space-x-4">
            <motion.div
              className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              animate={{ rotate: isFocused ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>

            <div className="flex-1">
              <label htmlFor="decision-prompt" className="block text-lg font-semibold text-gray-900 mb-2">
                What decision are you facing?
              </label>
              <textarea
                ref={textareaRef}
                id="decision-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="w-full resize-none text-gray-700 placeholder-gray-400 focus:outline-none text-lg leading-relaxed"
                rows={1}
                disabled={isLoading}
              />
            </div>
          </div>

          <AnimatePresence>
            {isFocused && !prompt && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 ml-14"
              >
                <p className="text-sm text-gray-500 mb-3">Try one of these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setPrompt(suggestion);
                        textareaRef.current?.focus();
                      }}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 md:px-8 pb-6 md:pb-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              No sign-up required • Free analysis
            </p>
            <Button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Analyzing...</span>
                </>
              ) : (
                <>
                  Analyze <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.form>

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-gray-600">
          <span className="font-semibold">10,000+ simulations</span> • Real market data •
          <span className="text-blue-600 font-semibold ml-1">AI-powered insights</span>
        </p>
      </motion.div>
    </div>
  );
}