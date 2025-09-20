'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, AnimatedCard } from '@theguide/ui';
import { ArrowLeft, Sparkles, TrendingUp, Shield, BarChart3 } from 'lucide-react';

export default function GuestAnalysisPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Get the prompt from sessionStorage
    const guestPrompt = sessionStorage.getItem('guestPrompt');
    if (!guestPrompt) {
      router.push('/');
      return;
    }
    setPrompt(guestPrompt);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsSimulating(false);
            setShowResults(true);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, [router]);

  const mockResults = {
    options: [
      {
        title: "Accept the Job Offer",
        confidence: 78,
        financialImpact: "+$450,000",
        riskLevel: "Medium",
        keyFactors: [
          "20% salary increase compounds over time",
          "Austin tech market growing 15% annually",
          "Cost of living 12% lower than current location",
          "Strong career advancement opportunities"
        ]
      },
      {
        title: "Stay in Current Position",
        confidence: 65,
        financialImpact: "+$320,000",
        riskLevel: "Low",
        keyFactors: [
          "Stable income and benefits",
          "Established professional network",
          "No relocation costs or stress",
          "Potential for internal promotion"
        ]
      }
    ],
    insights: [
      "The Austin job market shows 3x more senior positions in your field",
      "Your skills are in high demand - 89% match with top-paying roles",
      "Relocation timing is optimal - housing prices expected to rise 8% next year",
      "Career trajectory analysis shows 2 years faster path to senior roles in Austin"
    ]
  };

  const handleSignUp = () => {
    sessionStorage.setItem('pendingAnalysis', JSON.stringify({ prompt, results: mockResults }));
    router.push('/auth');
  };

  if (isSimulating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 mx-auto mb-8 gradient-accent rounded-3xl flex items-center justify-center shadow-xl"
          >
            <Sparkles className="w-12 h-12 text-slate-900 animate-pulse" />
          </motion.div>

          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Running Your Simulation
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
            Analyzing thousands of scenarios based on real market data...
          </p>

          <div className="w-64 mx-auto mb-4">
            <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full gradient-accent"
                initial={{ width: 0 }}
                animate={{ width: `${simulationProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            {Math.round(simulationProgress)}% complete
          </p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                Your Decision Analysis
              </h1>
              <p className="text-xl text-slate-600">
                "{prompt}"
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {mockResults.options.map((option, index) => (
                <AnimatedCard key={index} delay={index * 0.2} className="relative">
                  <div className="absolute top-4 right-4">
                    <div className="text-2xl font-bold text-slate-900">
                      {option.confidence}%
                    </div>
                    <div className="text-xs text-gray-500">confidence</div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-4 pr-20">
                    {option.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="flex items-center text-green-600 mb-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Financial Impact</span>
                      </div>
                      <p className="text-xl font-bold">{option.financialImpact}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-orange-600 mb-1">
                        <Shield className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Risk Level</span>
                      </div>
                      <p className="text-xl font-bold">{option.riskLevel}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Key Factors:</h4>
                    <ul className="space-y-2">
                      {option.keyFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-[#b4e300] rounded-full mt-1.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-slate-600">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedCard>
              ))}
            </div>

            <AnimatedCard delay={0.4} className="mb-12">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-6 w-6 text-[#b4e300] mr-2" />
                <h3 className="text-xl font-bold text-slate-900">AI Insights</h3>
              </div>
              <ul className="space-y-3">
                {mockResults.insights.map((insight, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start"
                  >
                    <Sparkles className="h-5 w-5 text-[#b4e300] mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{insight}</span>
                  </motion.li>
                ))}
              </ul>
            </AnimatedCard>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-slate-900 rounded-3xl p-10 text-center shadow-xl"
            >
              <h3 className="text-3xl font-bold mb-4 text-white">
                Want the Full Analysis?
              </h3>
              <p className="text-lg mb-8 text-slate-300 max-w-2xl mx-auto">
                Sign up to unlock detailed simulations, sensitivity analysis, personalized recommendations,
                and track multiple decisions over time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSignUp}
                >
                  Create Free Account
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push('/')}
                >
                  Try Another Decision
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}