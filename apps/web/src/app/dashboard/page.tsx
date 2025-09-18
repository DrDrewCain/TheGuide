'use client';

import { useState } from 'react';
import { DecisionType, Decision, DecisionOption, UserProfile } from '@theguide/models';
import { useSimulation } from '@/hooks/useSimulation';
import SimulationResults from '@/components/simulation/SimulationResults';

export default function DashboardPage() {
  const [selectedDecisionType, setSelectedDecisionType] = useState<DecisionType | ''>('');
  const [showResults, setShowResults] = useState(false);
  const [currentDecision, setCurrentDecision] = useState<Decision | null>(null);
  const [selectedOption, setSelectedOption] = useState<DecisionOption | null>(null);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});

  const simulation = useSimulation({
    onComplete: () => setShowResults(true),
    onError: (error) => {
      console.error('Simulation error:', error);
      alert('Simulation failed. Please try again.');
    }
  });

  const decisionTypes: { value: DecisionType; label: string; description: string }[] = [
    {
      value: 'career',
      label: 'Career Change',
      description: 'Switching careers or industries'
    },
    {
      value: 'career',
      label: 'Job Offer',
      description: 'Evaluating a new job opportunity'
    },
    {
      value: 'relocation',
      label: 'Relocation',
      description: 'Moving to a new city or state'
    },
    {
      value: 'education',
      label: 'Education',
      description: 'Pursuing further education or training'
    },
    {
      value: 'housing',
      label: 'Home Purchase',
      description: 'Buying vs renting, timing the market'
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Life Decision Simulator</h1>

        {showResults && simulation.result ? (
          <SimulationResults
            result={simulation.result}
            quickEstimate={simulation.quickEstimate}
            sensitivity={simulation.sensitivity}
            onBack={() => {
              setShowResults(false);
              simulation.reset();
            }}
          />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">What decision are you facing?</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decisionTypes.map((type, index) => (
                  <button
                    key={`${type.value}-${index}`}
                    onClick={() => setSelectedDecisionType(type.value)}
                    className={`p-4 rounded-lg border-2 text-left transition ${selectedDecisionType === type.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                      }`}
                  >
                    <h3 className="font-semibold text-gray-900">{type.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedDecisionType && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Tell us about your situation</h2>
                <DecisionForm
                  decisionType={selectedDecisionType}
                  simulation={simulation}
                  onDecisionReady={(decision, option, profile) => {
                    setCurrentDecision(decision);
                    setSelectedOption(option);
                    setUserProfile(profile);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

interface DecisionFormProps {
  decisionType: DecisionType;
  simulation: ReturnType<typeof useSimulation>;
  onDecisionReady: (decision: Decision, option: DecisionOption, profile: Partial<UserProfile>) => void;
}

function DecisionForm({ decisionType, simulation, onDecisionReady }: DecisionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<Partial<DecisionOption>[]>([
    { title: '', description: '', pros: [], cons: [] },
    { title: '', description: '', pros: [], cons: [] }
  ]);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    demographics: { age: 30 },
    career: { salary: 100000 },
    financial: { monthlyExpenses: 5000 },
    location: { city: 'San Francisco', state: 'CA', country: 'US' }
  });

  const addOption = () => {
    setOptions([...options, { title: '', description: '', pros: [], cons: [] }]);
  };

  const updateOption = (index: number, field: keyof DecisionOption, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const updateProfile = (path: string, value: any) => {
    const keys = path.split('.');
    const newProfile = { ...profile };
    let current: any = newProfile;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setProfile(newProfile);
  };

  const getDecisionSpecificFields = () => {
    switch (decisionType) {
      case 'career':
        return (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Salary
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="120000"
                  value={profile.career?.salary || ''}
                  onChange={(e) => updateProfile('career.salary', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="5"
                  value={profile.career?.experience || ''}
                  onChange={(e) => updateProfile('career.experience', Number(e.target.value))}
                />
              </div>
            </div>
          </>
        );
      case 'relocation':
        return (
          <>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current City
                </label>
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
          </>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!title || !description || options.filter(o => o.title).length < 2) {
      alert('Please fill in all required fields and at least 2 options');
      return;
    }

    // Create decision
    const decision: Decision = {
      id: Date.now().toString(),
      userId: 'current-user',
      type: decisionType,
      title,
      description,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Use first valid option for simulation
    const validOption = options.find(o => o.title) as DecisionOption;
    const option: DecisionOption = {
      id: Date.now().toString(),
      decisionId: decision.id,
      title: validOption.title!,
      description: validOption.description || '',
      pros: validOption.pros || [],
      cons: validOption.cons || [],
      metadata: {}
    };

    // Run simulation
    onDecisionReady(decision, option, profile);
    simulation.runSimulation(decision, option, profile);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Decision Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="e.g., Move to Austin for Tech Job"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="Describe your situation and what you're considering..."
        />
      </div>

      {getDecisionSpecificFields()}

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">Your Profile</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={profile.demographics?.age || ''}
              onChange={(e) => updateProfile('demographics.age', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses</label>
            <input
              type="number"
              value={profile.financial?.monthlyExpenses || ''}
              onChange={(e) => updateProfile('financial.monthlyExpenses', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={profile.location?.city || ''}
              onChange={(e) => updateProfile('location.city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="San Francisco"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Options You're Considering</h3>
        {options.map((option, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Option {index + 1} Title
              </label>
              <input
                type="text"
                value={option.title}
                onChange={(e) => updateOption(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Accept the offer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={option.description}
                onChange={(e) => updateOption(index, 'description', e.target.value)}
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
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {simulation.isRunning ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            {simulation.progress ? `${simulation.progress.message} (${simulation.progress.percentage}%)` : 'Running Simulation...'}
          </div>
        ) : (
          'Run Simulation'
        )}
      </button>
    </form>
  );
}