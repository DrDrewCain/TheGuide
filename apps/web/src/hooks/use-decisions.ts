import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Decision = Database['public']['Tables']['decisions']['Row']
type DecisionOption = Database['public']['Tables']['decision_options']['Row']
type DecisionWithOptions = Decision & {
  decision_options: DecisionOption[]
}

export function useDecisions() {
  const [decisions, setDecisions] = useState<DecisionWithOptions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchDecisions() {
      try {
        const { data, error } = await supabase
          .from('decisions')
          .select(`
            *,
            decision_options(*)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error
        setDecisions(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch decisions')
      } finally {
        setLoading(false)
      }
    }

    fetchDecisions()
  }, [])

  return { decisions, loading, error, refetch: () => window.location.reload() }
}

export function useDecision(id: string) {
  const [decision, setDecision] = useState<DecisionWithOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchDecision() {
      try {
        const { data, error } = await supabase
          .from('decisions')
          .select(`
            *,
            decision_options(*)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        setDecision(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch decision')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDecision()
    }
  }, [id])

  return { decision, loading, error }
}
