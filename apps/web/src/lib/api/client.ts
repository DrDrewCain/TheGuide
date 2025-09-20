import { createClient } from '@/lib/supabase/client'

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  }

  private async getAuthToken(): Promise<string | null> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw {
        message: error.message || `HTTP ${response.status}`,
        status: response.status,
        code: error.code,
      } as ApiError
    }

    return response.json()
  }

  // Decision endpoints
  async runSimulation(decisionId: string, optionId: string) {
    return this.request<{
      id: string
      jobId: string
      status: string
      message: string
    }>(`/api/simulations/run`, {
      method: 'POST',
      body: JSON.stringify({ decisionId, optionId }),
    })
  }

  async getSimulationStatus(simulationId: string) {
    return this.request<{
      id: string
      status: 'pending' | 'running' | 'completed' | 'failed'
      progress?: number
      results?: any
      error?: string
    }>(`/api/simulations/${simulationId}`)
  }

  // Analysis endpoints
  async analyzeDecision(decisionId: string, optionId: string) {
    return this.request<{
      analysis: any
      recommendations?: string[]
    }>(`/api/ai/analyze`, {
      method: 'POST',
      body: JSON.stringify({ decisionId, optionId }),
    })
  }
}

// Singleton instance
export const apiClient = new ApiClient()