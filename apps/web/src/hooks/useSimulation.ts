/**
 * React hook for running simulations with progress tracking
 */

import type { Decision, DecisionOption, SimulationResult, UserProfile } from '@theguide/models'
import { useCallback, useRef, useState } from 'react'
import {
  type DataQualityReport,
  type QuickEstimate,
  type SensitivityResult,
  type SimulationConfig,
  type SimulationProgress,
  simulationService,
} from '@/services/simulation.service'

export interface UseSimulationOptions {
  autoRun?: boolean
  config?: SimulationConfig
  onComplete?: (result: SimulationResult) => void
  onError?: (error: Error) => void
}

export function useSimulation(options?: UseSimulationOptions) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<SimulationProgress | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [quickEstimate, setQuickEstimate] = useState<QuickEstimate | null>(null)
  const [sensitivity, setSensitivity] = useState<SensitivityResult | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Run full simulation
   */
  const runSimulation = useCallback(
    async (decision: Decision, option: DecisionOption, userProfile: Partial<UserProfile>) => {
      try {
        setIsRunning(true)
        setError(null)
        setProgress({ stage: 'initializing', percentage: 0, message: 'Starting simulation...' })

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController()

        const result = await simulationService.runSimulation(
          decision,
          option,
          userProfile,
          options?.config,
          progress => {
            console.log('🎯 Setting progress in hook:', progress)
            setProgress(progress)
          }
        )

        setResult(result)
        options?.onComplete?.(result)

        // Extract sensitivity if available
        if ((result as any).metadata?.sensitivityAnalysis) {
          setSensitivity((result as any).metadata.sensitivityAnalysis)
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Simulation failed')
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setIsRunning(false)
        abortControllerRef.current = null
      }
    },
    [options]
  )

  /**
   * Run quick estimate for real-time feedback
   */
  const runQuickEstimate = useCallback(
    async (decision: Decision, option: DecisionOption, userProfile: Partial<UserProfile>) => {
      try {
        const estimate = await simulationService.runQuickEstimate(decision, option, userProfile)
        setQuickEstimate(estimate)
        return estimate
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Quick estimate failed')
        setError(error)
        throw error
      }
    },
    []
  )

  /**
   * Run sensitivity analysis only
   */
  const runSensitivityAnalysis = useCallback(
    async (decision: Decision, option: DecisionOption, userProfile: Partial<UserProfile>) => {
      try {
        setIsRunning(true)
        setProgress({
          stage: 'sensitivity',
          percentage: 0,
          message: 'Analyzing parameter sensitivity...',
        })

        const result = await simulationService.analyzeSensitivity(decision, option, userProfile)

        setSensitivity(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Sensitivity analysis failed')
        setError(error)
        throw error
      } finally {
        setIsRunning(false)
      }
    },
    []
  )

  /**
   * Assess data quality for current profile
   */
  const assessDataQuality = useCallback(
    (userProfile: Partial<UserProfile>, decisionType: Decision['type']): DataQualityReport => {
      return simulationService.assessDataQuality(userProfile, decisionType)
    },
    []
  )

  /**
   * Cancel ongoing simulation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      simulationService.cancelSimulation()
      setIsRunning(false)
      setProgress(null)
    }
  }, [])

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setProgress(null)
    setQuickEstimate(null)
    setSensitivity(null)
    setIsRunning(false)
  }, [])

  return {
    // State
    isRunning,
    progress,
    result,
    error,
    quickEstimate,
    sensitivity,

    // Actions
    runSimulation,
    runQuickEstimate,
    runSensitivityAnalysis,
    assessDataQuality,
    cancel,
    reset,

    // Computed
    hasResult: result !== null,
    progressPercentage: progress?.percentage || 0,
    isComplete: progress?.stage === 'complete',
    hasError: error !== null,
  }
}

/**
 * Hook for tracking multiple simulations (e.g., comparing options)
 */
export function useSimulationComparison() {
  const [comparisons, setComparisons] = useState<Map<string, SimulationResult>>(new Map())
  const [isComparing, setIsComparing] = useState(false)

  const compareOptions = useCallback(
    async (
      decision: Decision,
      options: DecisionOption[],
      userProfile: Partial<UserProfile>,
      config?: SimulationConfig
    ) => {
      setIsComparing(true)
      const results = new Map<string, SimulationResult>()

      try {
        // Run simulations in parallel for all options
        const simulations = await Promise.all(
          options.map(async option => {
            const result = await simulationService.runSimulation(
              decision,
              option,
              userProfile,
              config
            )
            return { optionId: option.id, result }
          })
        )

        // Store results
        simulations.forEach(({ optionId, result }) => {
          results.set(optionId, result)
        })

        setComparisons(results)
        return results
      } finally {
        setIsComparing(false)
      }
    },
    []
  )

  const getComparison = useCallback(
    (optionId: string) => {
      return comparisons.get(optionId)
    },
    [comparisons]
  )

  const getBestOption = useCallback(() => {
    let bestOption: { id: string; result: SimulationResult } | null = null
    let highestValue = -Infinity

    comparisons.forEach((result, optionId) => {
      const value = result.aggregateMetrics.expectedValue.overall
      if (value > highestValue) {
        highestValue = value
        bestOption = { id: optionId, result }
      }
    })

    return bestOption
  }, [comparisons])

  const reset = useCallback(() => {
    setComparisons(new Map())
    setIsComparing(false)
  }, [])

  return {
    comparisons,
    isComparing,
    compareOptions,
    getComparison,
    getBestOption,
    reset,
    hasComparisons: comparisons.size > 0,
  }
}
