import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

export interface AIProvider {
  analyzeText(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
      jsonMode?: boolean
    }
  ): Promise<string>

  name: string
}

export class OpenAIProvider implements AIProvider {
  private openai: OpenAI
  name = 'OpenAI'

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async analyzeText(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
      jsonMode?: boolean
    }
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 1000,
      response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    })

    return response.choices[0].message.content || ''
  }
}

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI
  private model: any
  name = 'Gemini'

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
  }

  async analyzeText(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
      jsonMode?: boolean
    }
  ): Promise<string> {
    const prompt = `${systemPrompt}\n\n${userPrompt}`

    if (options?.jsonMode) {
      // Add JSON instruction to prompt for Gemini
      const jsonPrompt = `${prompt}\n\nRespond with valid JSON only.`

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: jsonPrompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.3,
          maxOutputTokens: options?.maxTokens ?? 1000,
          responseMimeType: 'application/json',
        },
      })

      return result.response.text()
    }

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 1000,
      },
    })

    return result.response.text()
  }
}

export function createAIProvider(config: { openaiKey?: string; geminiKey?: string }): AIProvider {
  // Prefer Gemini if available, fallback to OpenAI
  if (config.geminiKey) {
    console.log('Using Gemini AI provider')
    return new GeminiProvider(config.geminiKey)
  }

  if (config.openaiKey) {
    console.log('Using OpenAI provider')
    return new OpenAIProvider(config.openaiKey)
  }

  throw new Error(
    'No AI provider API key configured. Please set either GEMINI_API_KEY or OPENAI_API_KEY'
  )
}
