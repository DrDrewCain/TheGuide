import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'

// Simple in-memory rate limiter for MVP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per window for guests
};

/**
 * Simple rate limiter for guest API endpoints
 */
async function rateLimit(ip: string): Promise<boolean> {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  // Clean up old entries
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!userLimit || userLimit.resetTime < now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  userLimit.count += 1;
  return true;
}

// Input validation schema
const analyzeSchema = z.object({
  prompt: z.string().min(10).max(1000),
  sessionId: z.string().nullable().optional(),
});

// Pre-built example scenarios
const exampleScenarios = [
  {
    id: 'job-offer',
    title: 'Tech Job Offer in Austin',
    prompt: 'I received a job offer from a tech startup in Austin with a 30% pay increase, but I would need to relocate from Seattle where all my family lives.',
    tags: ['career', 'relocation', 'salary'],
  },
  {
    id: 'buy-vs-rent',
    title: 'Buy vs Rent in Current Market',
    prompt: 'Should I buy a house now with high interest rates at 7%, or continue renting and wait for rates to drop?',
    tags: ['housing', 'financial', 'investment'],
  },
  {
    id: 'career-switch',
    title: 'Career Switch to Tech',
    prompt: 'I\'m a teacher considering a career switch to software engineering. Should I quit to attend a bootcamp or learn part-time?',
    tags: ['career', 'education', 'risk'],
  },
  {
    id: 'side-business',
    title: 'Starting a Side Business',
    prompt: 'I want to start an e-commerce business. Should I quit my stable job or build it as a side project first?',
    tags: ['business', 'entrepreneurship', 'financial'],
  },
];

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request first to get better error messages
    const body = await request.json();
    console.log('API received:', body);

    const validationResult = analyzeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { prompt, sessionId } = validationResult.data;

    // Get IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

    // Check rate limit
    const allowed = await rateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Create or update session
    const newSessionId = sessionId || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // For MVP, return enhanced mock data based on prompt analysis
    // In production, this would call the actual AI service
    const analysis = generateMockAnalysis(prompt);

    return NextResponse.json({
      sessionId: newSessionId,
      analysis,
      remainingRequests: RATE_LIMIT.maxRequests - (rateLimitMap.get(ip)?.count || 1),
      upgradePrompt: 'Sign up to save your analysis and run unlimited simulations!',
    });
  } catch (error) {
    console.error('Guest analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze decision' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return example scenarios for guest users
  return NextResponse.json({
    examples: exampleScenarios,
    features: {
      authenticated: [
        'Unlimited decision analyses',
        'Save and track decisions',
        'Personalized recommendations',
        'Advanced simulations (10,000+ scenarios)',
        'Export reports',
        'Historical analytics',
      ],
      guest: [
        'Try 5 decision analyses',
        'Basic simulations (100 scenarios)',
        'General recommendations',
        'Session-based results',
      ],
    },
  });
}

/**
 * Generate mock analysis based on prompt content
 * In production, this would use actual AI services
 */
function generateMockAnalysis(prompt: string) {
  const promptLower = prompt.toLowerCase();

  // Determine decision type based on keywords
  let decisionType = 'general';
  if (promptLower.includes('job') || promptLower.includes('career')) {
    decisionType = 'career';
  } else if (promptLower.includes('house') || promptLower.includes('rent') || promptLower.includes('buy')) {
    decisionType = 'housing';
  } else if (promptLower.includes('school') || promptLower.includes('education') || promptLower.includes('degree')) {
    decisionType = 'education';
  } else if (promptLower.includes('business') || promptLower.includes('startup')) {
    decisionType = 'business';
  }

  // Extract potential options from prompt
  const options = extractOptions(prompt, decisionType);

  return {
    decisionType,
    title: generateTitle(prompt, decisionType),
    summary: `Based on your situation, we've identified ${options.length} main paths forward. Our AI has run 100 simulations to help you understand the potential outcomes.`,
    options: options.map((option: any, index: number) => ({
      id: `option-${index + 1}`,
      title: option.title,
      description: option.description,
      confidence: 65 + Math.floor(Math.random() * 20),
      pros: option.pros,
      cons: option.cons,
      financialImpact: option.financialImpact,
      timeframe: option.timeframe,
      riskLevel: option.riskLevel,
    })),
    factors: {
      financial: Math.floor(Math.random() * 30) + 60,
      career: Math.floor(Math.random() * 30) + 50,
      lifestyle: Math.floor(Math.random() * 30) + 40,
      risk: Math.floor(Math.random() * 30) + 30,
    },
    recommendation: {
      primary: options[0].title,
      reasoning: `Based on the simulations, ${options[0].title} shows the highest probability of success given your current situation.`,
      keyConsiderations: [
        'Financial stability over the next 5 years',
        'Career growth potential',
        'Work-life balance impact',
        'Risk tolerance assessment',
      ],
    },
    nextSteps: [
      'Review the detailed analysis of each option',
      'Consider your personal risk tolerance',
      'Consult with relevant professionals',
      'Create an action plan for your chosen path',
    ],
  };
}

function extractOptions(prompt: string, decisionType: string) {
  // This is simplified - in production, use NLP to extract actual options
  const templates = {
    career: [
      {
        title: 'Accept the New Opportunity',
        description: 'Take the leap and embrace the change',
        pros: ['Higher salary potential', 'New experiences', 'Career growth'],
        cons: ['Adjustment period', 'Unknown environment', 'Leaving comfort zone'],
        financialImpact: '+25-40%',
        timeframe: 'Immediate',
        riskLevel: 'Medium',
      },
      {
        title: 'Stay in Current Position',
        description: 'Continue building on your current foundation',
        pros: ['Stability', 'Known environment', 'Existing relationships'],
        cons: ['Limited growth', 'Potential stagnation', 'Missed opportunities'],
        financialImpact: '+3-5% annually',
        timeframe: 'Ongoing',
        riskLevel: 'Low',
      },
    ],
    housing: [
      {
        title: 'Buy a Home Now',
        description: 'Enter the housing market despite current conditions',
        pros: ['Building equity', 'Stability', 'Tax benefits'],
        cons: ['High interest rates', 'Maintenance costs', 'Less flexibility'],
        financialImpact: '-30% liquidity',
        timeframe: '30-year commitment',
        riskLevel: 'Medium-High',
      },
      {
        title: 'Continue Renting',
        description: 'Wait for better market conditions',
        pros: ['Flexibility', 'No maintenance', 'Liquidity preserved'],
        cons: ['No equity', 'Rent increases', 'No tax benefits'],
        financialImpact: '-$2000/month',
        timeframe: 'Month-to-month',
        riskLevel: 'Low',
      },
    ],
    education: [
      {
        title: 'Pursue Full-Time Education',
        description: 'Commit fully to your educational goals',
        pros: ['Faster completion', 'Full immersion', 'Networking opportunities'],
        cons: ['Income loss', 'High commitment', 'Opportunity cost'],
        financialImpact: '-$50k investment',
        timeframe: '2-4 years',
        riskLevel: 'High',
      },
      {
        title: 'Part-Time Learning',
        description: 'Balance education with current responsibilities',
        pros: ['Maintain income', 'Lower risk', 'Practical application'],
        cons: ['Slower progress', 'Time management', 'Less networking'],
        financialImpact: '-$20k investment',
        timeframe: '3-6 years',
        riskLevel: 'Low',
      },
    ],
    business: [
      {
        title: 'Launch Full-Time',
        description: 'Dedicate yourself completely to the business',
        pros: ['Full focus', 'Faster growth', 'Clear commitment'],
        cons: ['No safety net', 'High pressure', 'Income loss'],
        financialImpact: '-100% salary',
        timeframe: '2-3 years to profitability',
        riskLevel: 'Very High',
      },
      {
        title: 'Start as Side Project',
        description: 'Build gradually while maintaining stability',
        pros: ['Income security', 'Test viability', 'Lower risk'],
        cons: ['Slow growth', 'Limited time', 'Divided focus'],
        financialImpact: 'Maintained income',
        timeframe: '3-5 years to scale',
        riskLevel: 'Low-Medium',
      },
    ],
    general: [
      {
        title: 'Option A',
        description: 'The more ambitious path',
        pros: ['Higher potential', 'Growth opportunity', 'New experiences'],
        cons: ['Higher risk', 'Uncertainty', 'Requires change'],
        financialImpact: 'Variable',
        timeframe: '1-3 years',
        riskLevel: 'Medium-High',
      },
      {
        title: 'Option B',
        description: 'The conservative approach',
        pros: ['Stability', 'Predictability', 'Lower stress'],
        cons: ['Limited upside', 'Potential regret', 'Slow progress'],
        financialImpact: 'Stable',
        timeframe: 'Ongoing',
        riskLevel: 'Low',
      },
    ],
  };

  return templates[decisionType as keyof typeof templates] || templates.general;
}

function generateTitle(prompt: string, decisionType: string) {
  const titles = {
    career: 'Career Transition Analysis',
    housing: 'Housing Decision Evaluation',
    education: 'Education Investment Assessment',
    business: 'Business Launch Strategy',
    general: 'Decision Analysis',
  };

  return titles[decisionType as keyof typeof titles] || titles.general;
}