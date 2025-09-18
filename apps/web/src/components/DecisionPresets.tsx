'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase,
  Home,
  GraduationCap,
  MapPin,
  Baby,
  DollarSign,
  Rocket,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface DecisionPreset {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  scenario: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  defaultValues: {
    age?: number;
    income?: number;
    savings?: number;
    location?: string;
    industry?: string;
    role?: string;
    experience?: number;
    dependents?: number;
  };
  tags: string[];
}

const DECISION_PRESETS: DecisionPreset[] = [
  {
    id: 'tech-job-switch',
    type: 'career_change',
    title: 'Tech Career Pivot',
    subtitle: 'Software Engineer → Senior Product Manager',
    scenario: 'You\'re a mid-level software engineer considering a transition to product management at a growing startup.',
    icon: Rocket,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    defaultValues: {
      age: 28,
      income: 120000,
      savings: 45000,
      role: 'Software Engineer',
      experience: 5,
      location: 'San Francisco'
    },
    tags: ['Tech', 'Career Growth', 'Startup']
  },
  {
    id: 'first-home',
    type: 'home_purchase',
    title: 'First Home Purchase',
    subtitle: 'Rent vs Buy in a Hot Market',
    scenario: 'You\'re tired of rising rents and considering buying your first home in a competitive housing market.',
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    defaultValues: {
      age: 32,
      income: 85000,
      savings: 65000,
      location: 'Austin',
      dependents: 0
    },
    tags: ['Real Estate', 'Investment', 'Lifestyle']
  },
  {
    id: 'mba-decision',
    type: 'education',
    title: 'MBA Program',
    subtitle: 'Top-20 Business School',
    scenario: 'You\'ve been accepted to a prestigious MBA program. Is the $200k investment worth it?',
    icon: GraduationCap,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    defaultValues: {
      age: 27,
      income: 95000,
      savings: 40000,
      role: 'Marketing Manager',
      experience: 4
    },
    tags: ['Education', 'Career Investment', 'Debt']
  },
  {
    id: 'city-relocation',
    type: 'relocation',
    title: 'Coast-to-Coast Move',
    subtitle: 'NYC → San Diego Lifestyle Change',
    scenario: 'Considering leaving the NYC grind for better work-life balance in San Diego with a remote job.',
    icon: MapPin,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    defaultValues: {
      age: 30,
      income: 140000,
      savings: 80000,
      location: 'New York',
      role: 'Senior Consultant'
    },
    tags: ['Lifestyle', 'Remote Work', 'Quality of Life']
  },
  {
    id: 'startup-founding',
    type: 'business_startup',
    title: 'Launch Your Startup',
    subtitle: 'Quit Job to Build SaaS',
    scenario: 'You have a validated idea and some savings. Time to take the entrepreneurial leap?',
    icon: Briefcase,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    defaultValues: {
      age: 35,
      income: 150000,
      savings: 120000,
      experience: 10,
      role: 'Engineering Manager'
    },
    tags: ['Entrepreneurship', 'High Risk', 'High Reward']
  },
  {
    id: 'family-planning',
    type: 'family_planning',
    title: 'Starting a Family',
    subtitle: 'First Child Financial Planning',
    scenario: 'Planning for your first child and evaluating the financial impact on your household.',
    icon: Baby,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    defaultValues: {
      age: 33,
      income: 110000,
      savings: 70000,
      dependents: 0,
      location: 'Denver'
    },
    tags: ['Family', 'Life Change', 'Long-term']
  }
];

interface DecisionPresetsProps {
  onSelectPreset: (preset: DecisionPreset) => void;
  onSkip: () => void;
}

export default function DecisionPresets({ onSelectPreset, onSkip }: DecisionPresetsProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Choose Your Scenario
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Select a pre-built scenario to quickly explore common life decisions, or create your own custom scenario
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DECISION_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <Card
              key={preset.id}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
              onClick={() => onSelectPreset(preset)}
            >
              <div className={`absolute inset-0 ${preset.bgColor} opacity-0 group-hover:opacity-10 transition-opacity`} />

              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${preset.bgColor}`}>
                    <Icon className={`h-8 w-8 ${preset.color}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>

                <div>
                  <CardTitle className="text-xl mb-2">{preset.title}</CardTitle>
                  <CardDescription className="font-medium">{preset.subtitle}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {preset.scenario}
                </p>

                <div className="flex flex-wrap gap-2">
                  {preset.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="pt-2 space-y-1 text-xs text-gray-500">
                  {preset.defaultValues.income && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${(preset.defaultValues.income / 1000).toFixed(0)}k income</span>
                    </div>
                  )}
                  {preset.defaultValues.age && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{preset.defaultValues.age} years old</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <button
          onClick={onSkip}
          className="group inline-flex items-center justify-center px-8 py-3 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>Create Custom Scenario</span>
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export { type DecisionPreset };