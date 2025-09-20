import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/supabase.js'
import { addSimulationJob } from '../jobs/queue.js'
import { createError } from '../middleware/errorHandler.js'
import { authenticateSupabase } from '../middleware/supabase-auth.middleware.js'

export const simulationRouter = Router()

// All simulation routes require authentication
simulationRouter.use(authenticateSupabase)

// Run simulation
const runSimulationSchema = z.object({
  decisionId: z.string().uuid(),
  optionId: z.string().uuid(),
})

simulationRouter.post('/run', async (req, res, next) => {
  try {
    const { decisionId, optionId } = runSimulationSchema.parse(req.body)

    if (!req.user?.userId) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    // Verify decision and option exist and belong to user
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .select('id')
      .eq('id', decisionId)
      .eq('user_id', req.user.userId)
      .single()

    if (decisionError || !decision) {
      return next(createError('Decision not found', 404))
    }

    // Verify option belongs to decision
    const { data: option, error: optionError } = await supabase
      .from('decision_options')
      .select('id')
      .eq('id', optionId)
      .eq('decision_id', decisionId)
      .single()

    if (optionError || !option) {
      return next(createError('Option not found', 404))
    }

    // Create simulation record
    const { data: simulation, error: simulationError } = await supabase
      .from('simulations')
      .insert({
        decision_id: decisionId,
        option_id: optionId,
        status: 'pending',
      })
      .select()
      .single()

    if (simulationError) throw simulationError

    // Queue simulation job
    const job = await addSimulationJob({
      simulationId: simulation.id,
      decisionId,
      optionId,
      userId: req.user.userId,
    })

    // Update simulation with job ID
    await supabase.from('simulations').update({ job_id: job.id.toString() }).eq('id', simulation.id)

    res.status(202).json({
      id: simulation.id,
      jobId: job.id,
      status: 'pending',
      message: 'Simulation queued for processing',
    })
  } catch (error) {
    next(error)
  }
})

// Get simulation by ID
simulationRouter.get('/:id', async (req, res, next) => {
  try {
    const { data: simulation, error } = await supabase
      .from('simulations')
      .select(`
        *,
        decisions!inner (
          id,
          title,
          type,
          user_id
        ),
        decision_options!inner (
          id,
          title
        )
      `)
      .eq('id', req.params.id)
      .eq('decisions.user_id', req.user?.userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return next(createError('Simulation not found', 404))
      }
      throw error
    }

    // Format response to match expected structure
    const formattedSimulation = {
      ...simulation,
      decision: {
        id: simulation.decisions.id,
        title: simulation.decisions.title,
        type: simulation.decisions.type,
      },
      option: {
        id: simulation.decision_options.id,
        title: simulation.decision_options.title,
      },
    }

    // Remove the nested objects
    delete formattedSimulation.decisions
    delete formattedSimulation.decision_options

    res.json(formattedSimulation)
  } catch (error) {
    next(error)
  }
})

// Get simulation history
simulationRouter.get('/', async (req, res, next) => {
  try {
    const { decisionId, status, limit = '10', offset = '0' } = req.query

    let query = supabase
      .from('simulations')
      .select(
        `
        *,
        decisions!inner (
          id,
          title,
          type,
          user_id
        ),
        decision_options!inner (
          id,
          title
        )
      `,
        { count: 'exact' }
      )
      .eq('decisions.user_id', req.user?.userId)
      .order('created_at', { ascending: false })
      .range(
        parseInt(offset as string, 10),
        parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1
      )

    if (decisionId) {
      query = query.eq('decision_id', decisionId as string)
    }
    if (status) {
      query = query.eq('status', status as string)
    }

    const { data: simulations, error, count } = await query

    if (error) throw error

    // Format simulations
    const formattedSimulations = simulations.map(sim => ({
      ...sim,
      decision: {
        id: sim.decisions.id,
        title: sim.decisions.title,
        type: sim.decisions.type,
      },
      option: {
        id: sim.decision_options.id,
        title: sim.decision_options.title,
      },
    }))

    // Remove nested objects
    formattedSimulations.forEach(sim => {
      delete sim.decisions
      delete sim.decision_options
    })

    res.json({
      simulations: formattedSimulations,
      total: count || 0,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    })
  } catch (error) {
    next(error)
  }
})

// Export simulation results
simulationRouter.post('/:id/export', async (req, res, next) => {
  try {
    const { data: simulation, error } = await supabase
      .from('simulations')
      .select(`
        *,
        decisions!inner (
          id,
          title,
          user_id
        ),
        decision_options!inner (
          id,
          title
        )
      `)
      .eq('id', req.params.id)
      .eq('status', 'completed')
      .eq('decisions.user_id', req.user?.userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return next(createError('Simulation not found or not completed', 404))
      }
      throw error
    }

    // TODO: Implement actual export logic (PDF, CSV, etc.)
    res.json({
      message: 'Export functionality coming soon',
      simulation: {
        id: simulation.id,
        decisionTitle: simulation.decisions.title,
        optionTitle: simulation.decision_options.title,
        results: simulation.results,
      },
    })
  } catch (error) {
    next(error)
  }
})
