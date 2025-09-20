import { Router } from 'express';
import { z } from 'zod';
import { DecisionAnalysisService } from '@theguide/ai-services';
import { authenticateSupabase } from '../middleware/supabase-auth.middleware.js';

const router = Router();

// Initialize AI service with available provider (Gemini preferred, OpenAI fallback)
const aiService = new DecisionAnalysisService({
  geminiKey: process.env.GEMINI_API_KEY,
  openaiKey: process.env.OPENAI_API_KEY
});

const analyzeDecisionSchema = z.object({
  description: z.string().min(50).max(2000)
});

router.post('/analyze-decision', authenticateSupabase, async (req, res) => {
  try {
    const { description } = analyzeDecisionSchema.parse(req.body);

    // Use GPT to analyze the description and extract decision components
    const analysisPrompt = `
      Analyze this life decision description and extract:
      1. Decision type (career/housing/education/relocation/family/business/investment)
      2. A clear title for the decision
      3. 2-3 main options the person is considering
      4. Key pros and cons for each option
      5. Important parameters (salary, location, timeframe, etc)

      Description: "${description}"

      Return as JSON with structure:
      {
        "type": "career|housing|education|relocation|family|business|investment",
        "title": "Short descriptive title",
        "description": "Cleaned up description",
        "options": [
          {
            "title": "Option name",
            "description": "Option description",
            "pros": ["pro1", "pro2"],
            "cons": ["con1", "con2"]
          }
        ],
        "parameters": {
          "current_salary": number or null,
          "location": string or null,
          "timeframe": string or null,
          // other relevant parameters
        }
      }
    `;

    const analysis = await aiService.analyzeUserInput(analysisPrompt);

    res.json(analysis);
  } catch (error) {
    console.error('Decision analysis error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Failed to analyze decision',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Schema for simulate-with-ai endpoint
const simulateWithAISchema = z.object({
  decision: z.object({
    type: z.string(),
    title: z.string(),
    description: z.string(),
    options: z.array(z.object({
      title: z.string(),
      description: z.string(),
      pros: z.array(z.string()),
      cons: z.array(z.string())
    })),
    parameters: z.record(z.any())
  }),
  option: z.object({
    title: z.string(),
    description: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string())
  }),
  profile: z.object({
    demographics: z.object({
      age: z.number().min(18).max(100),
      location: z.string(),
      occupation: z.string()
    }).partial(),
    financial: z.object({
      income: z.number().min(0).optional(),
      savings: z.number().min(0).optional(),
      debt: z.number().min(0).optional()
    }).partial(),
    preferences: z.object({
      riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
      priorities: z.array(z.string()).optional()
    }).partial()
  }).partial()
});

// Endpoint to run AI-enhanced simulation
router.post('/simulate-with-ai', authenticateSupabase, async (req, res) => {
  try {
    const validatedData = simulateWithAISchema.parse(req.body);
    const { decision, option, profile } = validatedData;

    // Run AI-enhanced analysis
    const result = await aiService.analyzeDecision(decision, option, profile);

    res.json(result);
  } catch (error) {
    console.error('AI simulation error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Failed to run AI simulation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;