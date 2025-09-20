import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { apiClient } from '@/lib/api/client'
import type { Database } from '@/lib/supabase/database.types'

type Simulation = Database['public']['Tables']['simulations']['Row']

export function useSimulation(simulationId: string | null) {
  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!simulationId) return

    const supabase = createClient()

    // Initial fetch
    async function fetchSimulation() {
      try {
        const { data, error } = await supabase
          .from('simulations')
          .select('*')
          .eq('id', simulationId!)
          .single()

        if (error) throw error
        setSimulation(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch simulation')
      }
    }

    fetchSimulation()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`simulation:${simulationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'simulations',
          filter: `id=eq.${simulationId}`,
        },
        (payload) => {
          setSimulation(payload.new as Simulation)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [simulationId])

  const runSimulation = async (decisionId: string, optionId: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiClient.runSimulation(decisionId, optionId)
      return result.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start simulation')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    simulation,
    loading,
    error,
    runSimulation,
    isRunning: simulation?.status === 'running',
    isCompleted: simulation?.status === 'completed',
    progress: simulation?.progress || 0,
  }
}