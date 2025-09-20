'use client'

import type { Decision, DecisionOption, DecisionType, UserProfile } from '@theguide/models'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import CustomDecisionForm from '@/components/CustomDecisionForm'
import DecisionPresets, { type DecisionPreset } from '@/components/DecisionPresets'
import SimulationResults from '@/components/simulation/SimulationResults'
import { useSimulation } from '@/hooks/useSimulation'

export default function DashboardPage() {
  const [showPresets, setShowPresets] = useState(true)
  const [selectedDecisionType, setSelectedDecisionType] = useState<DecisionType | ''>('')
  const [showResults, setShowResults] = useState(false)
  // Remove unused state variables
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({})
  const [prefilledData, setPrefilledData] = useState<any>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const simulation = useSimulation({
    onComplete: () => setShowResults(true),
    onError: error => {
      console.error('Simulation error:', error)
      alert('Simulation failed. Please try again.')
    },
  })

  const decisionTypes: {
    value: DecisionType | 'custom'
    label: string
    description: string
    icon?: string
    category?: string
  }[] = [
      // New Graduate / Early Career
      {
        value: 'career',
        label: 'First Job Offer',
        description: 'Choosing between multiple entry-level positions',
        icon: '🎯',
        category: 'New Graduate',
      },
      {
        value: 'education',
        label: 'Graduate School vs Work',
        description: 'Continue education or start earning?',
        icon: '🎓',
        category: 'New Graduate',
      },
      {
        value: 'relocation',
        label: 'Move for First Job',
        description: 'Relocate for career opportunity vs stay near family',
        icon: '✈️',
        category: 'New Graduate',
      },
      {
        value: 'housing',
        label: 'First Apartment',
        description: 'Live alone, with roommates, or stay with parents?',
        icon: '🏢',
        category: 'New Graduate',
      },

      // Early Career (2-5 years)
      {
        value: 'career',
        label: 'Job Switch Early Career',
        description: 'Leave for 20% raise or stay for growth?',
        icon: '💼',
        category: 'Early Career',
      },
      {
        value: 'education',
        label: 'Professional Certification',
        description: 'Invest in certifications vs on-job learning',
        icon: '📜',
        category: 'Early Career',
      },
      {
        value: 'investment',
        label: 'First Investment Strategy',
        description: 'Start investing vs pay off student loans',
        icon: '💰',
        category: 'Early Career',
      },
      {
        value: 'career',
        label: 'Startup vs Corporate',
        description: 'Join risky startup or stable company?',
        icon: '🚀',
        category: 'Early Career',
      },

      // Mid Career (5-15 years)
      {
        value: 'career',
        label: 'Management Track',
        description: 'Move to management or stay technical?',
        icon: '👔',
        category: 'Mid Career',
      },
      {
        value: 'education',
        label: 'MBA Decision',
        description: 'Full-time, part-time, or executive MBA?',
        icon: '🏛️',
        category: 'Mid Career',
      },
      {
        value: 'business',
        label: 'Side Business',
        description: 'Start side hustle while keeping day job',
        icon: '💡',
        category: 'Mid Career',
      },
      {
        value: 'housing',
        label: 'Buy First Home',
        description: 'Enter housing market or continue renting?',
        icon: '🏠',
        category: 'Mid Career',
      },

      // Family Life
      {
        value: 'family',
        label: 'Starting a Family',
        description: 'Financial planning for first child',
        icon: '👶',
        category: 'Family',
      },
      {
        value: 'career',
        label: 'Career Break for Kids',
        description: 'Take time off or continue working?',
        icon: '👨‍👩‍👧',
        category: 'Family',
      },
      {
        value: 'housing',
        label: 'Upgrade for Family',
        description: 'Move to suburbs for better schools?',
        icon: '🏡',
        category: 'Family',
      },
      {
        value: 'education',
        label: 'Private vs Public School',
        description: 'Education investment for children',
        icon: '🎒',
        category: 'Family',
      },
      {
        value: 'family',
        label: 'Second Child',
        description: 'Financial impact of growing family',
        icon: '👨‍👩‍👧‍👦',
        category: 'Family',
      },

      // Senior/Leadership
      {
        value: 'career',
        label: 'C-Suite Opportunity',
        description: 'Executive role at smaller company?',
        icon: '🏆',
        category: 'Senior',
      },
      {
        value: 'business',
        label: 'Start Own Company',
        description: 'Leave corporate to be entrepreneur',
        icon: '🚁',
        category: 'Senior',
      },
      {
        value: 'investment',
        label: 'Angel Investing',
        description: 'Diversify into startup investments',
        icon: '👼',
        category: 'Senior',
      },
      {
        value: 'career',
        label: 'Board Positions',
        description: 'Join boards vs focus on main role',
        icon: '🪑',
        category: 'Senior',
      },

      // Life Transitions
      {
        value: 'family',
        label: 'Caring for Parents',
        description: 'Financial planning for elderly parents',
        icon: '👵',
        category: 'Life Transitions',
      },
      {
        value: 'career',
        label: 'Sabbatical',
        description: 'Take a year off to travel or reset',
        icon: '🌴',
        category: 'Life Transitions',
      },
      {
        value: 'education',
        label: 'Career Change Education',
        description: 'Bootcamp or degree for career pivot',
        icon: '🔄',
        category: 'Life Transitions',
      },
      {
        value: 'relocation',
        label: 'International Move',
        description: 'Work abroad opportunity',
        icon: '🌍',
        category: 'Life Transitions',
      },
      {
        value: 'retirement',
        label: 'Early Retirement',
        description: 'FIRE movement - retire in 40s/50s?',
        icon: '🏖️',
        category: 'Life Transitions',
      },

      // Special Situations
      {
        value: 'career',
        label: 'Equity vs Salary',
        description: 'High equity startup vs high salary',
        icon: '📊',
        category: 'Special',
      },
      {
        value: 'investment',
        label: 'Inheritance Planning',
        description: 'How to invest windfall wisely',
        icon: '💎',
        category: 'Special',
      },
      {
        value: 'family',
        label: 'Divorce Financial Planning',
        description: 'Navigate financial separation',
        icon: '⚖️',
        category: 'Special',
      },
      {
        value: 'custom',
        label: 'Custom Decision',
        description: 'Describe your unique situation for AI analysis',
        icon: '✨',
        category: 'Special',
      },
    ]

  const handlePresetSelection = (preset: DecisionPreset) => {
    setSelectedDecisionType(preset.type as DecisionType)
    setPrefilledData(preset.defaultValues)
    setShowPresets(false)
  }

  const handleSkipPresets = () => {
    setShowPresets(false)
  }

  // Show loading overlay when simulation is running
  console.log(
    '🎨 Dashboard render - isRunning:',
    simulation.isRunning,
    'hasResult:',
    !!simulation.result,
    'progress:',
    simulation.progress
  )
  if (simulation.isRunning && !simulation.result) {
    return (
      <main
        className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4"
        key={`loading-${simulation.progress?.percentage || 0}`}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-blue-100 rounded-full animate-pulse" />
              </div>
              <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin relative z-10" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">Running Your Simulation</h2>
              <p className="text-lg text-gray-700 font-medium">
                {simulation.progress?.message || 'Generating Monte Carlo scenarios...'}
              </p>
              <p className="text-sm text-gray-500">
                Analyzing thousands of potential outcomes based on your specific situation
              </p>
            </div>

            {simulation.progress && (
              <div className="space-y-2">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${simulation.progress?.percentage || 0}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {simulation.progress?.percentage || 0}% complete
                </p>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <p className="text-xs text-gray-500">This typically takes 10-30 seconds</p>
              <div className="flex justify-center space-x-1">
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {showResults && simulation.result ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Simulation Results</h1>
            <SimulationResults
              result={simulation.result}
              quickEstimate={simulation.quickEstimate}
              sensitivity={simulation.sensitivity}
              onBack={() => {
                setShowResults(false)
                setShowPresets(true)
                simulation.reset()
                setSelectedDecisionType('')
                setPrefilledData({})
              }}
            />
          </>
        ) : showPresets ? (
          <>
            <h1 className="text-5xl font-bold text-center mb-4">Life Decision Simulator</h1>
            <p className="text-xl text-gray-600 text-center mb-12">
              Simulate major life decisions with AI-powered Monte Carlo analysis
            </p>
            <DecisionPresets onSelectPreset={handlePresetSelection} onSkip={handleSkipPresets} />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Life Decision Simulator</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">What decision are you facing?</h2>

              {/* Categories as tabs */}
              <div className="mb-4 overflow-x-auto">
                <div className="flex space-x-2 min-w-max pb-2">
                  {[
                    'All',
                    'New Graduate',
                    'Early Career',
                    'Mid Career',
                    'Family',
                    'Senior',
                    'Life Transitions',
                    'Special',
                  ].map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable decision grid */}
              <div className="max-h-96 overflow-y-auto pr-2">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {decisionTypes
                    .filter(
                      type => selectedCategory === 'All' || type.category === selectedCategory
                    )
                    .map((type, index) => (
                      <button
                        key={`${type.value}-${index}`}
                        onClick={() => setSelectedDecisionType(type.value as any)}
                        className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-[1.02] ${selectedDecisionType === type.value
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="text-2xl mb-2">{type.icon}</div>
                          {type.category && (
                            <span className="text-xs text-gray-500">{type.category}</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm">{type.label}</h3>
                        <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                      </button>
                    ))}
                </div>
              </div>

              <button
                onClick={() => setShowPresets(true)}
                className="mt-6 text-sm text-blue-600 hover:text-blue-700"
              >
                ← Back to preset scenarios
              </button>
            </div>

            {selectedDecisionType === '' ? (
              <CustomDecisionForm
                onAnalysis={analysis => {
                  // Convert AI analysis to decision and run simulation
                  const decision: Decision = {
                    id: Date.now().toString(),
                    userId: 'current-user',
                    type: analysis.type as DecisionType,
                    title: analysis.title,
                    description: analysis.description,
                    status: 'draft' as const,
                    options: [],
                    constraints: [],
                    timeline: {
                      createdAt: new Date(),
                      decisionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                      implementationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                    },
                  }

                  const option: DecisionOption = {
                    id: Date.now().toString(),
                    title: analysis.options[0].title,
                    description: analysis.options[0].description,
                    parameters: analysis.parameters,
                    pros: analysis.options[0].pros,
                    cons: analysis.options[0].cons,
                    estimatedImpact: {
                      financial: { immediate: 0, year1: 0, year5: 0, year10: 0 },
                      career: { growthPotential: 5, skillDevelopment: 5, networkExpansion: 5 },
                      lifestyle: { workLifeBalance: 0, stress: 0, fulfillment: 0 },
                      family: { timeWithFamily: 0, familyStability: 0 },
                    },
                    requirements: [],
                  }

                  simulation.runSimulation(decision, option, userProfile)
                }}
                onBack={() => setSelectedDecisionType('')}
              />
            ) : selectedDecisionType ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Tell us about your situation</h2>
                <DecisionForm
                  decisionType={selectedDecisionType}
                  simulation={simulation}
                  prefilledData={prefilledData}
                  onDecisionReady={(_decision, _option, profile) => {
                    // Decision and option will be used for simulation
                    setUserProfile(profile)
                  }}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  )
}

interface DecisionFormProps {
  decisionType: DecisionType
  simulation: ReturnType<typeof useSimulation>
  prefilledData?: any
  onDecisionReady: (
    decision: Decision,
    option: DecisionOption,
    profile: Partial<UserProfile>
  ) => void
}

interface FormErrors {
  title?: string
  description?: string
  age?: string
  salary?: string
  expenses?: string
  city?: string
  options?: string[]
  general?: string
}

function DecisionForm({
  decisionType,
  simulation,
  prefilledData,
  onDecisionReady,
}: DecisionFormProps) {
  const [title, setTitle] = useState(prefilledData?.decisionTitle || '')
  const [description, setDescription] = useState(prefilledData?.decisionDescription || '')
  const [options, setOptions] = useState<Partial<DecisionOption>[]>([
    {
      title: prefilledData?.option1Title || '',
      description: prefilledData?.option1Description || '',
      pros: [],
      cons: [],
    },
    {
      title: prefilledData?.option2Title || '',
      description: prefilledData?.option2Description || '',
      pros: [],
      cons: [],
    },
  ])
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    demographics: {
      age: prefilledData?.age || 30,
      location: {
        city: prefilledData?.location || 'San Francisco',
        state: 'CA',
        country: 'US',
        zipCode: '',
        coordinates: { lat: 0, lng: 0 },
      },
      education: { level: 'bachelors', field: '', institution: '', graduationYear: 2020, debt: 0 },
      maritalStatus: 'single',
      dependents: prefilledData?.dependents || 0,
      healthStatus: 'good',
    },
    career: {
      currentRole: prefilledData?.role || '',
      industry: prefilledData?.industry || '',
      company: '',
      companySize: 'medium',
      yearsExperience: prefilledData?.experience || 5,
      skills: [],
      salary: prefilledData?.income || 100000,
      compensation: {
        base: prefilledData?.income || 100000,
        bonus: 0,
        equity: 0,
        benefits: 0,
      },
      workStyle: 'office',
      careerTrajectory: 'growing',
    },
    financial: {
      assets: {
        cash: prefilledData?.savings || 0,
        investments: 0,
        retirement: 0,
        realEstate: 0,
        other: 0,
      },
      liabilities: {
        creditCards: 0,
        studentLoans: 0,
        mortgage: 0,
        other: 0,
      },
      monthlyExpenses: {
        housing: 2000,
        transportation: 500,
        food: 800,
        utilities: 200,
        entertainment: 400,
        healthcare: 300,
        other: 800,
      },
      savingsRate: 20,
      creditScore: 750,
      riskTolerance: 'moderate',
    },
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const addOption = () => {
    setOptions([...options, { title: '', description: '', pros: [], cons: [] }])
  }

  const updateOption = (index: number, field: keyof DecisionOption, value: any) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)

    // Clear option-specific errors when user types
    if (errors.options?.[index]) {
      const newOptionErrors = [...(errors.options || [])]
      newOptionErrors[index] = ''
      setErrors({ ...errors, options: newOptionErrors })
    }
  }

  const updateProfile = (path: string, value: any) => {
    const keys = path.split('.')
    const newProfile = { ...profile }
    let current: any = newProfile

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setProfile(newProfile)

    // Clear field-specific errors when user types
    const errorKey = keys[keys.length - 1]
    if (errors[errorKey as keyof FormErrors]) {
      setErrors({ ...errors, [errorKey]: undefined })
    }
  }

  const markTouched = (field: string) => {
    setTouched(new Set(Array.from(touched).concat(field)))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    // Title validation
    if (!title.trim()) {
      newErrors.title = 'Decision title is required'
      isValid = false
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
      isValid = false
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description = 'Description is required'
      isValid = false
    } else if (description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
      isValid = false
    }

    // Profile validation
    const age = profile.demographics?.age
    if (!age || age < 18 || age > 100) {
      newErrors.age = 'Age must be between 18 and 100'
      isValid = false
    }

    const salary = profile.career?.salary
    if (!salary || salary < 0 || salary > 10000000) {
      newErrors.salary = 'Please enter a valid salary'
      isValid = false
    }

    const expenses = profile.financial?.monthlyExpenses
    if (expenses) {
      const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0)
      if (totalExpenses > salary! / 12) {
        newErrors.expenses = 'Total monthly expenses cannot exceed monthly income'
        isValid = false
      }
    }

    if (!profile.demographics?.location?.city?.trim()) {
      newErrors.city = 'City is required'
      isValid = false
    }

    // Options validation
    const validOptions = options.filter(o => o.title?.trim())
    const optionErrors: string[] = []

    if (validOptions.length < 2) {
      newErrors.general = 'Please provide at least 2 options to compare'
      isValid = false
    }

    options.forEach((option, index) => {
      if (index < 2 && !option.title?.trim()) {
        optionErrors[index] = 'Option title is required'
        isValid = false
      }
    })

    if (optionErrors.length > 0) {
      newErrors.options = optionErrors
    }

    setErrors(newErrors)
    return isValid
  }

  const getDecisionSpecificFields = () => {
    switch (decisionType) {
      case 'career':
        return (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Salary <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="10000000"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${touched.has('salary') && errors.salary
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                  }`}
                placeholder="120000"
                value={profile.career?.salary || ''}
                onChange={e => {
                  const value = Number(e.target.value)
                  if (value >= 0) updateProfile('career.salary', value)
                }}
                onBlur={() => markTouched('salary')}
              />
              {touched.has('salary') && errors.salary && (
                <p className="text-red-500 text-sm mt-1">{errors.salary}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="5"
                value={profile.career?.yearsExperience || ''}
                onChange={e => {
                  const value = Number(e.target.value)
                  if (value >= 0 && value <= 50) updateProfile('career.yearsExperience', value)
                }}
              />
            </div>
          </div>
        )
      case 'relocation':
        return (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current City</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination City
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Austin, TX"
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched to show validation errors
    setTouched(
      new Set(['title', 'description', 'age', 'salary', 'expenses', 'city', 'option0', 'option1'])
    )

    // Validate form
    if (!validateForm()) {
      return
    }

    // Create decision
    const decision: Decision = {
      id: Date.now().toString(),
      userId: 'current-user',
      type: decisionType,
      title,
      description,
      status: 'draft' as const,
      options: [],
      constraints: [],
      timeline: {
        createdAt: new Date(),
        decisionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        implementationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
    }

    // Use first valid option for simulation
    const validOption = options.find(o => o.title)
    const option: DecisionOption = {
      id: Date.now().toString(),
      title: validOption?.title || '',
      description: validOption?.description || '',
      parameters: {},
      pros: validOption?.pros || [],
      cons: validOption?.cons || [],
      estimatedImpact: {
        financial: {
          immediate: 0,
          year1: 0,
          year5: 0,
          year10: 0,
        },
        career: {
          growthPotential: 5,
          skillDevelopment: 5,
          networkExpansion: 5,
        },
        lifestyle: {
          workLifeBalance: 0,
          stress: 0,
          fulfillment: 0,
        },
        family: {
          timeWithFamily: 0,
          familyStability: 0,
        },
      },
      requirements: [],
    }

    // Run simulation
    onDecisionReady(decision, option, profile)

    // Add a small delay to ensure state updates are visible
    setTimeout(() => {
      simulation.runSimulation(decision, option, profile)
    }, 100)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Decision Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            if (errors.title) setErrors({ ...errors, title: undefined })
          }}
          onBlur={() => markTouched('title')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${touched.has('title') && errors.title
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
            }`}
          placeholder="e.g., Move to Austin for Tech Job"
        />
        {touched.has('title') && errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={e => {
            setDescription(e.target.value)
            if (errors.description) setErrors({ ...errors, description: undefined })
          }}
          onBlur={() => markTouched('description')}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${touched.has('description') && errors.description
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-primary-500'
            }`}
          rows={3}
          placeholder="Describe your situation and what you're considering..."
        />
        {touched.has('description') && errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      {getDecisionSpecificFields()}

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">Your Profile</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="18"
              max="100"
              value={profile.demographics?.age || ''}
              onChange={e => {
                const value = Number(e.target.value)
                if (value >= 0) updateProfile('demographics.age', value)
              }}
              onBlur={() => markTouched('age')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${touched.has('age') && errors.age
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-primary-500'
                }`}
              placeholder="30"
            />
            {touched.has('age') && errors.age && (
              <p className="text-red-500 text-sm mt-1">{errors.age}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Expenses <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="1000000"
              value={
                profile.financial?.monthlyExpenses
                  ? Object.values(profile.financial.monthlyExpenses).reduce(
                    (sum, val) => sum + val,
                    0
                  )
                  : ''
              }
              onChange={e => {
                const total = Number(e.target.value)
                // Distribute proportionally based on typical budget
                updateProfile('financial.monthlyExpenses', {
                  housing: Math.round(total * 0.4),
                  transportation: Math.round(total * 0.1),
                  food: Math.round(total * 0.16),
                  utilities: Math.round(total * 0.04),
                  entertainment: Math.round(total * 0.08),
                  healthcare: Math.round(total * 0.06),
                  other: Math.round(total * 0.16),
                })
              }}
              onBlur={() => markTouched('expenses')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${touched.has('expenses') && errors.expenses
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-primary-500'
                }`}
              placeholder="5000"
            />
            {touched.has('expenses') && errors.expenses && (
              <p className="text-red-500 text-sm mt-1">{errors.expenses}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.demographics?.location?.city || ''}
              onChange={e => {
                updateProfile('demographics.location.city', e.target.value)
                if (errors.city) setErrors({ ...errors, city: undefined })
              }}
              onBlur={() => markTouched('city')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${touched.has('city') && errors.city
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-primary-500'
                }`}
              placeholder="San Francisco"
            />
            {touched.has('city') && errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Options You're Considering</h3>
        {options.map((option, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Option {index + 1} Title {index < 2 && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={option.title}
                onChange={e => updateOption(index, 'title', e.target.value)}
                onBlur={() => markTouched(`option${index}`)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${touched.has(`option${index}`) && errors.options?.[index]
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-primary-500'
                  }`}
                placeholder="e.g., Accept the offer"
              />
              {touched.has(`option${index}`) && errors.options?.[index] && (
                <p className="text-red-500 text-sm mt-1">{errors.options[index]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={option.description}
                onChange={e => updateOption(index, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
                placeholder="Describe this option..."
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          + Add Another Option
        </button>
      </div>

      <button
        type="submit"
        disabled={simulation.isRunning}
        className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
      >
        {simulation.isRunning ? (
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="animate-pulse">
              {simulation.progress
                ? `${simulation.progress.message} (${simulation.progress.percentage}%)`
                : 'Starting simulation...'}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span>Run Simulation</span>
            <ArrowRight className="h-5 w-5" />
          </div>
        )}
      </button>
    </form>
  )
}
