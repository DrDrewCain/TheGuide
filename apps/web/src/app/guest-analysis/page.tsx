'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, AnimatedCard, useToast } from '@theguide/ui';
import { ArrowLeft, Sparkles, TrendingUp, Shield, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { AuthModal } from '@/components/auth/auth-modal';

export default function GuestAnalysisPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  useEffect(() => {
    // Get the prompt from sessionStorage
    const guestPrompt = sessionStorage.getItem('guestPrompt');
    const savedSessionId = sessionStorage.getItem('guestSessionId');

    if (!guestPrompt || guestPrompt.length < 10) {
      console.error('Invalid or missing prompt:', guestPrompt);
      router.push('/');
      return;
    }

    setPrompt(guestPrompt);
    if (savedSessionId) {
      setSessionId(savedSessionId);
    }

    // Set session expiry (24 hours)
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    setSessionExpiry(expiry);

    // Perform the analysis
    analyzeDecision(guestPrompt, savedSessionId);
  }, [router]);

  const analyzeDecision = async (decisionPrompt: string, existingSessionId: string | null) => {
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const requestBody = {
        prompt: decisionPrompt,
        sessionId: existingSessionId
      };

      console.log('Sending request:', requestBody);

      const response = await fetch('/api/guest/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Analysis failed:', response.status, errorData);

        if (response.status === 429) {
          addToast({
            title: 'Rate limit reached',
            description: errorData.error,
            type: 'error'
          });
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (response.status === 400) {
          addToast({
            title: 'Invalid request',
            description: errorData.details ? JSON.stringify(errorData.details) : errorData.error,
            type: 'error'
          });
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();

      // Save session ID
      if (data.sessionId) {
        setSessionId(data.sessionId);
        sessionStorage.setItem('guestSessionId', data.sessionId);
      }

      setAnalysis(data.analysis);
      setRemainingRequests(data.remainingRequests);

      // Show results after a brief delay
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 500);
    } catch (error) {
      console.error('Analysis error:', error);
      addToast({
        title: 'Analysis failed',
        description: 'Unable to analyze your decision. Please try again.',
        type: 'error'
      });
      setTimeout(() => router.push('/'), 3000);
    }
  };

  const handleSaveAnalysis = () => {
    // Store current analysis in session for after signup
    sessionStorage.setItem('pendingAnalysis', JSON.stringify({
      prompt,
      analysis,
      sessionId
    }));
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    // After successful auth, redirect to dashboard with saved analysis
    router.push('/dashboard?imported=true');
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <Sparkles className="w-full h-full text-[#b4e300]" />
          </motion.div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Analyzing Your Decision
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Our AI is running 100 simulations of your future to find the best path forward...
          </p>

          <div className="w-64 mx-auto mb-4">
            <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full gradient-accent"
                initial={{ width: 0 }}
                animate={{ width: `${analysisProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            {Math.round(analysisProgress)}% complete
          </p>
        </div>
      </div>
    );
  }

  if (showResults && analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              <div className="flex items-center gap-4">
                {remainingRequests !== null && (
                  <div className="text-sm text-slate-600">
                    <Clock className="inline h-4 w-4 mr-1" />
                    {remainingRequests} analyses remaining
                  </div>
                )}
                {sessionExpiry && (
                  <div className="text-sm text-slate-600">
                    Session expires in 24h
                  </div>
                )}
              </div>
            </div>

            {/* Title and Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                {analysis.title}
              </h1>
              <p className="text-xl text-slate-600 mb-2">
                "{prompt}"
              </p>
              <p className="text-slate-600">
                {analysis.summary}
              </p>
            </motion.div>

            {/* Options Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {analysis.options.map((option: any, index: number) => (
                <AnimatedCard key={option.id} delay={index * 0.2} className="relative">
                  <div className="absolute top-4 right-4">
                    <div className="text-2xl font-bold text-slate-900">
                      {option.confidence}%
                    </div>
                    <div className="text-xs text-gray-500">confidence</div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-4 pr-20">
                    {option.title}
                  </h3>

                  <p className="text-slate-600 mb-4">{option.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="flex items-center text-green-600 mb-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Financial Impact</span>
                      </div>
                      <p className="text-lg font-bold">{option.financialImpact}</p>
                    </div>
                    <div>
                      <div className="flex items-center text-orange-600 mb-1">
                        <Shield className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Risk Level</span>
                      </div>
                      <p className="text-lg font-bold">{option.riskLevel}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">Pros:</h4>
                      <ul className="space-y-1">
                        {option.pros.map((pro: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-slate-600">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-red-700 mb-2">Cons:</h4>
                      <ul className="space-y-1">
                        {option.cons.map((con: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-slate-600">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>

            {/* AI Recommendation */}
            <AnimatedCard delay={0.4} className="mb-12">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-6 w-6 text-[#b4e300] mr-2" />
                <h3 className="text-xl font-bold text-slate-900">AI Recommendation</h3>
              </div>

              <div className="bg-gradient-to-r from-[#b4e300]/10 to-[#b4e300]/5 rounded-lg p-6 mb-4">
                <h4 className="font-bold text-lg text-slate-900 mb-2">
                  Recommended: {analysis.recommendation.primary}
                </h4>
                <p className="text-slate-700">{analysis.recommendation.reasoning}</p>
              </div>

              <h4 className="font-semibold text-slate-900 mb-2">Key Considerations:</h4>
              <ul className="space-y-2 mb-6">
                {analysis.recommendation.keyConsiderations.map((item: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>

              <h4 className="font-semibold text-slate-900 mb-2">Next Steps:</h4>
              <ol className="space-y-2">
                {analysis.nextSteps.map((step: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="font-bold text-[#b4e300] mr-2">{index + 1}.</span>
                    <span className="text-sm text-slate-600">{step}</span>
                  </li>
                ))}
              </ol>
            </AnimatedCard>

            {/* CTA Section */}
            <div className="text-center py-12 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Want to dive deeper into your analysis?
              </h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Sign up for free to save this analysis, run unlimited simulations with 10,000+ scenarios,
                and get personalized recommendations based on your unique profile.
              </p>
              <div className="flex justify-center gap-4">
                <Button size="lg" variant="primary" onClick={handleSaveAnalysis}>
                  Save Analysis & Sign Up
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/')}>
                  Try Another Decision
                </Button>
              </div>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return null;
}