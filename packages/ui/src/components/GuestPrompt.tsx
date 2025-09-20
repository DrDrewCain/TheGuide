import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { Send } from 'lucide-react';

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
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-slate-900 mb-2">
            What decision are you facing?
          </h2>
          <p className="text-slate-600">
            Get AI-powered insights based on 10,000+ simulations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="decision-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder={placeholder}
              className={cn(
                'w-full px-6 py-5 resize-none text-lg placeholder-slate-400 focus:outline-none leading-relaxed',
                'bg-slate-50 rounded-2xl transition-all duration-200',
                'hover:bg-slate-100/70',
                isFocused && 'bg-white shadow-lg ring-2 ring-slate-200',
                isLoading && 'opacity-70'
              )}
              rows={1}
              disabled={isLoading}
            />

            <div className="absolute right-3 bottom-3">
              <Button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                size="sm"
                className={cn(
                  'rounded-xl h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white transition-all duration-200',
                  prompt.trim() && !isLoading
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2 pointer-events-none'
                )}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Analyze
                    <Send className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isFocused && !prompt && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-3 w-full"
              >
                <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-1">
                  <div className="p-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suggested prompts</p>
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setPrompt(suggestion);
                        textareaRef.current?.focus();
                      }}
                      className="w-full text-left text-sm px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-150 border-t border-slate-100"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            No sign-up required
          </span>
          <span className="text-slate-300">•</span>
          <span>Free analysis</span>
          <span className="text-slate-300">•</span>
          <span>Press Enter to submit</span>
        </div>

        <motion.div
          className="mt-16 grid grid-cols-3 gap-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="py-3 px-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-semibold text-slate-900">10K+</div>
            <div className="text-xs text-slate-600 mt-1">Simulations</div>
          </div>
          <div className="py-3 px-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-semibold text-slate-900">87%</div>
            <div className="text-xs text-slate-600 mt-1">Accuracy</div>
          </div>
          <div className="py-3 px-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-semibold text-slate-900">2-3s</div>
            <div className="text-xs text-slate-600 mt-1">Analysis Time</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}