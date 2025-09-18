'use client';

import { useState } from 'react';
import { DecisionType, Decision, DecisionOption } from '@theguide/models';

export default function DashboardPage() {
  const [selectedDecisionType, setSelectedDecisionType] = useState<DecisionType | ''>('');

  const decisionTypes: { value: DecisionType; label: string; description: string }[] = [
    {
      value: 'career_change',
      label: 'Career Change',
      description: 'Switching careers or industries'
    },
    {
      value: 'job_offer',
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
      value: 'home_purchase',
      label: 'Home Purchase',
      description: 'Buying vs renting, timing the market'
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Life Decision Simulator</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">What decision are you facing?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decisionTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedDecisionType(type.value)}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  selectedDecisionType === type.value
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
            <DecisionForm decisionType={selectedDecisionType} />
          </div>
        )}
      </div>
    </main>
  );
}

function DecisionForm({ decisionType }: { decisionType: DecisionType }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<Partial<DecisionOption>[]>([
    { title: '', description: '', pros: [], cons: [] },
    { title: '', description: '', pros: [], cons: [] }
  ]);

  const addOption = () => {
    setOptions([...options, { title: '', description: '', pros: [], cons: [] }]);
  };

  const updateOption = (index: number, field: keyof DecisionOption, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const getDecisionSpecificFields = () => {
    switch (decisionType) {
      case 'job_offer':
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offered Salary
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="150000"
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

  return (
    <form onSubmit={(e) => e.preventDefault()}>
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
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-primary-700 transition"
      >
        Run Simulation
      </button>
    </form>
  );
}