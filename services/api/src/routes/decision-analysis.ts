import { Router } from 'express';
import { z } from 'zod';
import DecisionAnalysisService from '../services/ai/decision-analysis';

const router = Router();

// Initialize AI service (in production, use env variable for API key)
const aiService = new DecisionAnalysisService(process.env.OPENAI_API_KEY || '');

const analyzeDecisionSchema = z.object({
  description: z.string().min(50).max(2000)
});

router.post('/analyze-decision', async (req, res) => {
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

// Endpoint to run AI-enhanced simulation
router.post('/simulate-with-ai', async (req, res) => {
  try {
    const { decision, option, profile } = req.body;

    // Validate inputs
    if (!decision || !option || !profile) {
      return res.status(400).json({
        error: 'Missing required fields: decision, option, profile'
      });
    }

    // Run AI-enhanced analysis
    const result = await aiService.analyzeDecision(decision, option, profile);

    res.json(result);
  } catch (error) {
    console.error('AI simulation error:', error);
    res.status(500).json({
      error: 'Failed to run AI simulation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;