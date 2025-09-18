'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface CustomDecisionFormProps {
  onAnalysis: (analysis: {
    type: string;
    title: string;
    description: string;
    options: Array<{
      title: string;
      description: string;
      pros: string[];
      cons: string[];
    }>;
    parameters: any;
  }) => void;
  onBack: () => void;
}

export default function CustomDecisionForm({ onAnalysis, onBack }: CustomDecisionFormProps) {
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const examplePrompts = [
    "I'm 28 and considering leaving my $150k tech job to start a SaaS company. I have $80k saved.",
    "Should I do a full-time MBA at 32 with 2 kids, or continue working and do an executive MBA?",
    "Thinking about moving from NYC to Austin for better quality of life, but worried about career impact.",
    "Got a job offer with 40% more equity but 20% less salary. Current job is stable but limited growth.",
    "My parents need care. Should I move back home, hire help, or relocate them near me?"
  ];

  const handleAnalyze = async () => {
    if (description.length < 50) {
      setError('Please provide more details about your decision (at least 50 characters)');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Call API to analyze the decision using AI
      const response = await fetch('/api/analyze-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const analysis = await response.json();
      onAnalysis(analysis);
    } catch (err) {
      setError('Failed to analyze decision. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <CardTitle>Describe Your Decision</CardTitle>
        </div>
        <CardDescription>
          Tell us about your situation in your own words. Our AI will analyze it and create a personalized simulation.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What decision are you facing?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Describe your situation, the options you're considering, and what factors are important to you..."
          />
          <p className="text-sm text-gray-500 mt-2">
            {description.length}/500 characters (minimum 50)
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Example scenarios:</p>
          <div className="space-y-2">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setDescription(prompt)}
                className="w-full text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded transition"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || description.length < 50}
            className="flex-1"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Decision
              </>
            )}
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            disabled={isAnalyzing}
          >
            Back
          </Button>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">How it works:</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• AI analyzes your description to understand the decision context</li>
            <li>• Identifies key factors, risks, and opportunities</li>
            <li>• Generates realistic scenarios using Monte Carlo simulation</li>
            <li>• Provides personalized recommendations based on your situation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}