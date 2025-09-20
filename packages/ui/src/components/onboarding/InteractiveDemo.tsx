import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Play, CheckCircle } from 'lucide-react';

export interface InteractiveDemoProps {
  onComplete?: () => void;
  className?: string;
}

export function InteractiveDemo({ onComplete, className }: InteractiveDemoProps) {
  const [stage, setStage] = React.useState<'intro' | 'input' | 'simulating' | 'results'>('intro');
  const [simulationProgress, setSimulationProgress] = React.useState(0);

  const demoDecision = {
    title: "Should I move to Austin for a tech job?",
    currentSalary: 95000,
    offeredSalary: 120000,
    currentCity: "Chicago",
    targetCity: "Austin"
  };

  const startDemo = () => {
    setStage('input');
  };

  const runSimulation = () => {
    setStage('simulating');

    // Simulate progress
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setStage('results');
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  const completeDemo = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            <div className="bg-blue-100 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Let's Try a Real Example
              </h3>
              <p className="text-gray-700 mb-6">
                Watch how TheGuide analyzes a common career decision
              </p>
              <Button onClick={startDemo} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Start Demo
              </Button>
            </div>
          </motion.div>
        )}

        {stage === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Demo Decision:</h4>
              <p className="text-lg text-gray-800 mb-6">{demoDecision.title}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Current</div>
                  <div className="font-semibold">{demoDecision.currentCity}</div>
                  <div className="text-green-600">${demoDecision.currentSalary.toLocaleString()}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Offer</div>
                  <div className="font-semibold">{demoDecision.targetCity}</div>
                  <div className="text-green-600">${demoDecision.offeredSalary.toLocaleString()}</div>
                </div>
              </div>

              <Button onClick={runSimulation} className="w-full" size="lg">
                Run Simulation
              </Button>
            </div>
          </motion.div>
        )}

        {stage === 'simulating' && (
          <motion.div
            key="simulating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-4"
          >
            <div className="inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
              />
            </div>
            <p className="text-lg font-medium">Running 10,000 simulations...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${simulationProgress}%` }}
              />
            </div>
          </motion.div>
        )}

        {stage === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <h4 className="text-xl font-bold text-gray-900">Simulation Complete!</h4>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Recommendation</span>
                    <span className="text-green-600 font-bold">Take the Austin job</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Confidence Score</span>
                    <span className="text-blue-600 font-bold">82%</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="font-medium mb-2">Key Insights:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 5-year earnings increase: $385,000</li>
                    <li>• Cost of living: 15% lower in Austin</li>
                    <li>• Career growth: 2x more senior roles</li>
                    <li>• Quality of life: Better weather, tech community</li>
                  </ul>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-sm text-gray-600 mt-6"
              >
                That's how easy it is! Now try your own decision.
              </motion.p>

              <Button onClick={completeDemo} className="w-full mt-4" size="lg">
                Try My Own Decision
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}