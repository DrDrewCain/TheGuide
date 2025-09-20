'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AuthModal } from '@/components/auth/auth-modal'
import { GuestPrompt, AnimatedCard, Button } from '@theguide/ui'
import { useState as useGuestState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, TrendingUp, Shield, Brain } from 'lucide-react'

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [guestPrompt, setGuestPrompt] = useGuestState('')
  const [isAnalyzing, setIsAnalyzing] = useGuestState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push('/dashboard')
      } else {
        setCheckingAuth(false)
      }
    }
    checkUser()
  }, [router, supabase])

  const handleAuthSuccess = () => {
    router.push('/dashboard')
  }

  const handleGuestPrompt = async (prompt: string) => {
    setGuestPrompt(prompt)
    setIsAnalyzing(true)

    // Store prompt in sessionStorage for guest mode
    sessionStorage.setItem('guestPrompt', prompt)

    // Navigate to a guest analysis page
    setTimeout(() => {
      router.push('/guest-analysis')
    }, 1000)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 overflow-x-hidden">
      <div className="container-responsive py-20 md:py-24">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-block">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <div className="w-20 h-20 mx-auto gradient-accent rounded-3xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-black text-slate-900">T</span>
                </div>
              </motion.div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Make Life Decisions with{' '}
              <span className="gradient-text-accent">Confidence</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              AI-powered Monte-Carlo Simulations that analyze thousands of scenarios to help you make informed
              decisions about your career, relocation, education, and more.
            </p>
          </motion.div>

          {/* Guest Prompt Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-20"
          >
            <GuestPrompt
              onSubmit={handleGuestPrompt}
              isLoading={isAnalyzing}
              className="max-w-3xl mx-auto"
            />
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
          >
            {[
              { value: '10K+', label: 'Simulations per decision', icon: <Brain className="w-5 h-5" /> },
              { value: '$500K+', label: 'Average lifetime impact', icon: <TrendingUp className="w-5 h-5" /> },
              { value: '73%', label: 'Better ROI achieved', icon: <Sparkles className="w-5 h-5" /> },
              { value: '99.9%', label: 'Secure & private', icon: <Shield className="w-5 h-5" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="card p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="flex justify-center mb-3 text-slate-400">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
          >
            <Button
              variant="primary"
              size="xl"
              onClick={() => setShowAuthModal(true)}
              className="min-w-[200px]"
            >
              Start Free Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/how-it-works">
              <Button
                variant="secondary"
                size="xl"
                className="min-w-[200px]"
              >
                How It Works
              </Button>
            </Link>
          </motion.div>

          {/* How It Works Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="py-20 border-t border-slate-200"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-900 mb-16">
              How TheGuide Works
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  number: '1',
                  title: 'Describe Your Decision',
                  description: 'Tell us what you\'re considering in plain English - no forms or surveys',
                  color: 'from-orange-100 to-orange-200',
                  shadowColor: 'shadow-orange-200'
                },
                {
                  number: '2',
                  title: 'AI Runs Simulations',
                  description: '10,000+ Monte Carlo simulations using real market data and trends',
                  color: 'from-purple-100 to-purple-200',
                  shadowColor: 'shadow-purple-200'
                },
                {
                  number: '3',
                  title: 'Get Clear Insights',
                  description: 'Receive personalized recommendations with confidence scores',
                  color: 'from-green-100 to-green-200',
                  shadowColor: 'shadow-green-200'
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="text-center group"
                >
                  <div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center shadow-lg ${step.shadowColor} group-hover:shadow-xl transition-all duration-300`}>
                    <span className="text-3xl font-bold text-slate-900">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </main>
  )
}