'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DashboardCard,
  StatsCard,
  Button,
  GuestPrompt,
  FAB,
  FABMenu,
  TooltipProvider,
  SimpleTooltip,
  SkeletonDashboardCard,
  Skeleton
} from '@theguide/ui';
import {
  Brain,
  TrendingUp,
  Clock,
  Target,
  Plus,
  History,
  Sparkles,
  BarChart3,
  FileText,
  Settings,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  Lightbulb,
  FileQuestion
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/header';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showDecisionPrompt, setShowDecisionPrompt] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prefillPrompt, setPrefillPrompt] = useState('');

  const templatePrompts = {
    job_change: "I received a job offer from [Company] with a [X]% salary increase. Should I leave my current position at [Current Company]?",
    relocation: "I'm considering moving from [Current City] to [New City] for [reason]. Is this the right time to relocate?",
    education: "I'm thinking about going back to school for [degree/certification]. Should I pursue this education now or wait?",
    business: "I want to start a [type] business. Should I leave my job to pursue this full-time or start as a side project?"
  };

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
      }
    };

    checkUser();

    // Check for template parameter
    const template = searchParams.get('template');
    if (template && template in templatePrompts) {
      setShowDecisionPrompt(true);
      setPrefillPrompt(templatePrompts[template as keyof typeof templatePrompts]);
    }
  }, [router, searchParams]);

  const handleNewDecision = async (prompt: string) => {
    setIsAnalyzing(true);
    // Store in session for now
    sessionStorage.setItem('decisionPrompt', prompt);

    setTimeout(() => {
      router.push('/dashboard/analyze');
    }, 1000);
  };

  // Mock data - replace with real data from API
  const stats = {
    totalDecisions: 12,
    successRate: 87,
    avgConfidence: 82,
    timeSaved: '147 hrs'
  };

  const recentDecisions = [
    {
      id: 1,
      title: "Senior Engineer Role at Startup",
      date: "2 days ago",
      confidence: 85,
      status: "completed",
      recommendation: "Accept the offer"
    },
    {
      id: 2,
      title: "MBA vs Continue Working",
      date: "1 week ago",
      confidence: 72,
      status: "completed",
      recommendation: "Wait 2 years"
    },
    {
      id: 3,
      title: "Relocate to Austin",
      date: "2 weeks ago",
      confidence: 91,
      status: "completed",
      recommendation: "Make the move"
    }
  ];

  const insights = [
    "Your career decisions have 15% higher success rate when involving relocation",
    "Tuesday mornings are when you make your most confident decisions",
    "Financial decisions with 80%+ confidence have saved you $45K on average"
  ];

  return (
    <TooltipProvider>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Page Header */}
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="container-responsive py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Welcome back!</h1>
                <p className="text-slate-600 mt-1">Here's your decision-making overview</p>
              </div>
              <Button variant="primary" size="lg" onClick={() => setShowDecisionPrompt(!showDecisionPrompt)}>
                <Plus className="w-5 h-5 mr-2" />
                New Decision
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main id="main-content" className="container-responsive py-8">
          {/* Quick Decision Input */}
          {showDecisionPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className="card p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">What decision are you facing?</h3>
                <GuestPrompt
                  onSubmit={handleNewDecision}
                  isLoading={isAnalyzing}
                  placeholder="e.g., Should I accept a job offer from Google with a 30% pay increase but requiring relocation?"
                  defaultValue={prefillPrompt}
                />
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatsCard
                label="Total Decisions"
                value={stats.totalDecisions}
                change={2}
                trend="up"
                icon={<Brain className="w-6 h-6 text-slate-600" />}
                className="hover:shadow-lg transition-shadow"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatsCard
                label="Success Rate"
                value={`${stats.successRate}%`}
                change={5}
                trend="up"
                icon={<Target className="w-6 h-6 text-green-600" />}
                className="hover:shadow-lg transition-shadow"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatsCard
                label="Avg Confidence"
                value={`${stats.avgConfidence}%`}
                change={3}
                trend="up"
                icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
                className="hover:shadow-lg transition-shadow"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <StatsCard
                label="Time Saved"
                value={stats.timeSaved}
                icon={<Clock className="w-6 h-6 text-purple-600" />}
                className="hover:shadow-lg transition-shadow"
              />
            </motion.div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Decisions - 2/3 width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2"
            >
              <DashboardCard
                title="Recent Decisions"
                icon={<History className="w-5 h-5" />}
                action={
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                }
                className="h-full"
              >
                <div className="space-y-4">
                  {recentDecisions.map((decision, index) => (
                    <motion.div
                      key={decision.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="group p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                            {decision.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {decision.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              {decision.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-700">
                            Recommendation: <span className="text-green-600">{decision.recommendation}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">{decision.confidence}%</div>
                            <div className="text-xs text-slate-500">confidence</div>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </DashboardCard>
            </motion.div>

            {/* AI Insights - 1/3 width */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-6"
            >
              <DashboardCard
                title="AI Insights"
                icon={<Sparkles className="w-5 h-5 text-purple-600" />}
                className="glass"
              >
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100"
                    >
                      <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard
                title="Quick Actions"
                icon={<Settings className="w-5 h-5" />}
              >
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full justify-start" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Export Reports
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Preferences
                  </Button>
                </div>
              </DashboardCard>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <FAB>
        <FABMenu
          items={[
            {
              icon: <Plus className="w-5 h-5" />,
              label: 'New Decision',
              onClick: () => setShowDecisionPrompt(true)
            },
            {
              icon: <Lightbulb className="w-5 h-5" />,
              label: 'Quick Analysis',
              onClick: () => {
                setShowDecisionPrompt(true);
                setPrefillPrompt('');
              }
            },
            {
              icon: <FileQuestion className="w-5 h-5" />,
              label: 'Use Template',
              onClick: () => {
                // Show template selection
                setShowDecisionPrompt(true);
              }
            }
          ]}
        />
      </FAB>
    </TooltipProvider>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}