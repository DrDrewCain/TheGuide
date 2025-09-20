'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  OnboardingContainer,
  OnboardingStep,
  AnimatedCard,
  SuggestionChip,
  InteractiveDemo,
  useToast,
  Celebration
} from '@theguide/ui';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, Briefcase, DollarSign, Home, Search } from 'lucide-react';

// Removed POSTGRES_ERROR_CODES as we're now using upsert which handles both insert and update cases

/**
 * Total number of steps in the onboarding flow
 */
const TOTAL_STEPS = 5;

/**
 * Onboarding page component for new user setup
 *
 * This component guides new users through a 5-step onboarding process:
 * 1. Welcome and introduction
 * 2. Interactive demo of TheGuide's capabilities
 * 3. Primary concern selection
 * 4. Decision type preferences
 * 5. Template selection or custom start
 *
 * Features:
 * - Progressive disclosure with animated transitions
 * - User preference collection and persistence
 * - Skip functionality for experienced users
 * - Automatic profile creation/update on completion
 *
 * @returns The onboarding flow component
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [userPreferences, setUserPreferences] = useState({
    primaryConcern: '',
    decisionType: ''
  });

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
      }
    };

    checkAuth();

    // Check for auth success cookie and show toast
    const showAuthSuccess = document.cookie
      .split('; ')
      .find(row => row.startsWith('show_auth_success='));

    if (showAuthSuccess) {
      // Remove the cookie
      document.cookie = 'show_auth_success=; Max-Age=0; path=/;';

      // Show success toast
      addToast({
        title: 'Welcome to TheGuide!',
        description: 'Your email has been confirmed. Let\'s get started!',
        type: 'success',
        duration: 5000
      });
    }
  }, [router, addToast]);

  /**
   * Handles navigation to the next step or completes onboarding
   */
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      // Show celebration for completing interactive demo (step 3)
      if (currentStep === 3) {
        setCelebrationMessage("Amazing! You completed the demo!");
        setShowCelebration(true);
      }
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  /**
   * Handles navigation to the previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Skips the onboarding flow and marks it as skipped
   */
  const handleSkip = () => {
    completeOnboarding(true); // Pass true for skipped
  };

  /**
   * Completes the onboarding process and updates user profile
   *
   * This function:
   * 1. Updates the user profile with onboarding completion status
   * 2. Creates a new profile if one doesn't exist
   * 3. Clears the onboarding cookie
   * 4. Redirects to the dashboard
   *
   * @param skipped - Whether the user skipped the onboarding
   */
  const completeOnboarding = async (skipped = false) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Use upsert to handle both update and insert cases
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_skipped: skipped,
          preferences: userPreferences,
          onboarding_version: 1,
          dependents: 0,
          financial_data: {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error updating onboarding status:', error);
      }
    }

    // Clear the onboarding cookie to force refresh
    document.cookie = 'onboarding_completed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    router.push('/dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return <HowItWorksStep onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <DemoStep onNext={handleNext} onBack={handleBack} />;
      case 4:
        return (
          <PersonalizationStep
            onNext={handleNext}
            onBack={handleBack}
            preferences={userPreferences}
            setPreferences={setUserPreferences}
          />
        );
      case 5:
        return <FirstDecisionStep onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <>
      <OnboardingContainer
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onSkip={handleSkip}
        onComplete={completeOnboarding}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50"
      >
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </OnboardingContainer>

      <Celebration
        show={showCelebration}
        message={celebrationMessage}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <OnboardingStep className="text-center space-y-8 max-w-4xl mx-auto px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="w-28 h-28 mx-auto gradient-accent rounded-3xl flex items-center justify-center shadow-xl"
      >
        <span className="text-5xl text-slate-900 font-black">T</span>
      </motion.div>

      <div className="space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900">
          Welcome to TheGuide
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Make life's biggest decisions with confidence using AI-powered simulations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
        <AnimatedCard
          delay={0.1}
          hover={true}
          className="card card-hover p-8 text-center space-y-3"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🎯</span>
          </div>
          <h3 className="font-semibold text-lg text-slate-900">Career Decisions</h3>
          <p className="text-sm text-slate-600">Should I take this job offer?</p>
        </AnimatedCard>

        <AnimatedCard
          delay={0.2}
          hover={true}
          className="card card-hover p-8 text-center space-y-3"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🏠</span>
          </div>
          <h3 className="font-semibold text-lg text-slate-900">Life Changes</h3>
          <p className="text-sm text-slate-600">Is now the time to relocate?</p>
        </AnimatedCard>

        <AnimatedCard
          delay={0.3}
          hover={true}
          className="card card-hover p-8 text-center space-y-3"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🎓</span>
          </div>
          <h3 className="font-semibold text-lg text-slate-900">Education</h3>
          <p className="text-sm text-slate-600">Should I go back to school?</p>
        </AnimatedCard>
      </div>

      <Button variant="primary" size="lg" onClick={onNext} className="mt-8">
        Get Started
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </OnboardingStep>
  );
}

function HowItWorksStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const steps = [
    {
      number: "1",
      title: "Describe Your Decision",
      description: "Tell us what you're deciding in plain English",
      icon: "✍️",
      color: "from-orange-100 to-orange-200"
    },
    {
      number: "2",
      title: "We Simulate Your Future",
      description: "Our AI runs thousands of scenarios based on real data",
      icon: "🔮",
      color: "from-purple-100 to-purple-200"
    },
    {
      number: "3",
      title: "See Your Best Path",
      description: "Get clear recommendations with confidence scores",
      icon: "📊",
      color: "from-green-100 to-green-200"
    }
  ];

  return (
    <OnboardingStep className="space-y-10 max-w-3xl mx-auto px-4">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
          How TheGuide Works
        </h2>
        <p className="text-lg md:text-xl text-slate-600">
          Three simple steps to confident decisions
        </p>
      </div>

      <div className="space-y-6 mt-12">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
            className="flex items-start space-x-6 group hover:translate-x-2 transition-transform duration-300"
          >
            <div className={`flex-shrink-0 w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
              <span className="text-3xl">{step.icon}</span>
            </div>
            <div className="flex-1 pt-2">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="ghost" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" size="lg" onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </OnboardingStep>
  );
}

function PersonalizationStep({
  onNext,
  onBack,
  preferences,
  setPreferences
}: {
  onNext: () => void;
  onBack: () => void;
  preferences: any;
  setPreferences: (prefs: any) => void;
}) {
  const concerns = [
    { label: "Financial Security", value: "money", icon: <DollarSign className="h-4 w-4" /> },
    { label: "Career Growth", value: "growth", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Work-Life Balance", value: "balance", icon: <Home className="h-4 w-4" /> },
    { label: "Just Exploring", value: "exploring", icon: <Search className="h-4 w-4" /> }
  ];

  const decisionTypes = [
    { label: "Career decision", value: "career", icon: "💼" },
    { label: "Financial choice", value: "financial", icon: "💰" },
    { label: "Life change", value: "life", icon: "🏠" },
    { label: "Just exploring", value: "exploring", icon: "🔍" }
  ];

  return (
    <OnboardingStep className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Let's Personalize Your Experience
        </h2>
        <p className="text-lg text-gray-600">
          Help us understand what matters most to you
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What brings you here today?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {decisionTypes.map((type) => (
              <SuggestionChip
                key={type.value}
                icon={type.icon}
                onClick={() => setPreferences({ ...preferences, decisionType: type.value })}
                className={preferences.decisionType === type.value ? 'bg-blue-100/50 hover:bg-blue-100/70 ring-1 ring-blue-200/50' : ''}
              >
                {type.label}
              </SuggestionChip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What's your biggest concern?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {concerns.map((concern) => (
              <SuggestionChip
                key={concern.value}
                icon={concern.icon}
                onClick={() => setPreferences({ ...preferences, primaryConcern: concern.value })}
                className={preferences.primaryConcern === concern.value ? 'bg-blue-100/50 hover:bg-blue-100/70 ring-1 ring-blue-200/50' : ''}
              >
                {concern.label}
              </SuggestionChip>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </OnboardingStep>
  );
}

function DemoStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <OnboardingStep className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          See TheGuide in Action
        </h2>
        <p className="text-lg text-gray-600">
          Watch how we analyze a real career decision in seconds
        </p>
      </div>

      <InteractiveDemo onComplete={onNext} />

      <div className="flex justify-center pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </OnboardingStep>
  );
}

/**
 * Final step of onboarding - template selection or custom start
 *
 * Allows users to choose from predefined decision templates or start
 * with a blank slate. Completes the onboarding process on selection.
 *
 * @param props - Component props
 * @param props.onBack - Callback to go to previous step
 */
function FirstDecisionStep({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const suggestions = [
    { label: "Job offer I received", value: "job_change", icon: "💼" },
    { label: "Moving to new city", value: "relocation", icon: "🏙️" },
    { label: "Going back to school", value: "education", icon: "🎓" },
    { label: "Starting a business", value: "business", icon: "🚀" }
  ];

  const handleContinue = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Use upsert to handle both update and insert cases
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_skipped: false,
          onboarding_version: 1,
          dependents: 0,
          financial_data: {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error updating onboarding status:', error);
      }
    }

    // Clear the onboarding cookie to force refresh
    document.cookie = 'onboarding_completed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Navigate to dashboard with or without template
    if (selectedTemplate) {
      router.push(`/dashboard?template=${selectedTemplate}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <OnboardingStep className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to analyze your first decision?
        </h2>
        <p className="text-lg text-gray-600">
          Start with something you're actually thinking about
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Choose a template or describe your own:
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((suggestion) => (
            <SuggestionChip
              key={suggestion.value}
              icon={suggestion.icon}
              onClick={() => setSelectedTemplate(selectedTemplate === suggestion.value ? null : suggestion.value)}
              className={selectedTemplate === suggestion.value ? 'bg-blue-100/50 hover:bg-blue-100/70 ring-1 ring-blue-200/50' : ''}
            >
              {suggestion.label}
            </SuggestionChip>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center space-y-4 pt-8">
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          className="w-full md:w-auto"
        >
          {selectedTemplate ? 'Continue with selected template' : 'Start with a blank decision'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    </OnboardingStep>
  );
}