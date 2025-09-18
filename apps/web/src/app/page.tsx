'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple demo auth - accept any email/password
    if (email && password) {
      localStorage.setItem('user', JSON.stringify({ id: 'demo-user', email }));
      router.push('/dashboard');
    }

    setIsLoading(false);
  };

  if (showLogin) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Demo: Use any email and password
            </p>
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              Back to home
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Make Life Decisions with Confidence
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            AI-powered simulations that analyze thousands of scenarios to help you make informed decisions about your career, relocation, education, and more.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Career Changes</h3>
              <p className="text-gray-600 mb-4">Should you take that job offer? Switch careers? We simulate your income trajectory, job satisfaction, and long-term growth.</p>
              <div className="text-sm text-primary-600 font-medium">Avg. impact: $500K+ lifetime</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Relocation Decisions</h3>
              <p className="text-gray-600 mb-4">Analyze cost of living, job markets, quality of life, and community fit before making the big move.</p>
              <div className="text-sm text-primary-600 font-medium">Avg. savings: $50K+</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Education Investments</h3>
              <p className="text-gray-600 mb-4">MBA or continued work? Bootcamp or degree? We calculate ROI based on your specific situation.</p>
              <div className="text-sm text-primary-600 font-medium">Better ROI in 73% of cases</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Major Purchases</h3>
              <p className="text-gray-600 mb-4">Buy or rent? Now or wait? Our simulations factor in market trends and your financial trajectory.</p>
              <div className="text-sm text-primary-600 font-medium">Avg. savings: $100K+</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowLogin(true)}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Start Free Analysis
            </button>
            <Link href="/how-it-works" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border border-primary-200">
              How It Works
            </Link>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why TheGuide?</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 mt-0.5"></div>
                <div className="ml-3">
                  <h3 className="font-semibold">1000+ Scenario Simulations</h3>
                  <p className="text-gray-600">Our AI runs thousands of Monte Carlo simulations factoring in economic conditions, market trends, and personal circumstances.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 mt-0.5"></div>
                <div className="ml-3">
                  <h3 className="font-semibold">Real-Time Data Integration</h3>
                  <p className="text-gray-600">Connected to job markets, cost of living databases, economic indicators, and housing markets for accurate predictions.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 mt-0.5"></div>
                <div className="ml-3">
                  <h3 className="font-semibold">Personalized to You</h3>
                  <p className="text-gray-600">Connect your financial accounts, career history, and goals for hyper-personalized analysis.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 mt-0.5"></div>
                <div className="ml-3">
                  <h3 className="font-semibold">Risk & Uncertainty Analysis</h3>
                  <p className="text-gray-600">See probability distributions, not just averages. Understand best-case, worst-case, and most likely outcomes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}