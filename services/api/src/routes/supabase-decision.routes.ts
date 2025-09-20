import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/supabase.js'
import { createError } from '../middleware/errorHandler.js'
import { authenticateSupabase } from '../middleware/supabase-auth.middleware.js'

export const decisionRouter = Router()

// All decision routes require authentication
decisionRouter.use(authenticateSupabase)

// Get all decisions for user
decisionRouter.get('/', async (req, res, next) => {
  try {
    const { status, type } = req.query

    let query = supabase
      .from('decisions')
      .select(`
        *,
        decision_options (*)
      `)
      .eq('user_id', req.user?.userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status as string)
    }
    if (type) {
      query = query.eq('type', type as string)
    }

    const { data: decisions, error } = await query

    if (error) throw error

    // Get simulation counts
    const decisionsWithCounts = await Promise.all(
      decisions.map(async decision => {
        const { count } = await supabase
          .from('simulations')
          .select('*', { count: 'exact', head: true })
          .eq('decision_id', decision.id)

        return {
          ...decision,
          _count: { simulations: count || 0 },
        }
      })
    )

    res.json(decisionsWithCounts)
  } catch (error) {
    next(error)
  }
})

// Create decision schema
const createDecisionSchema = z.object({
  type: z.enum([
    'career_change',
    'job_offer',
    'relocation',
    'education',
    'home_purchase',
    'investment',
    'family_planning',
    'retirement',
    'business_startup',
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  decisionDeadline: z.string().datetime().optional(),
  parameters: z.object({}).optional(),
  constraints: z.array(z.object({})).optional(),
  options: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        parameters: z.object({}).optional(),
        pros: z.array(z.string()).optional(),
        cons: z.array(z.string()).optional(),
      })
    )
    .min(2),
})

// Create new decision
decisionRouter.post('/', async (req, res, next) => {
  try {
    const data = createDecisionSchema.parse(req.body)

    // Create decision
    const { data: decision, error: decisionError } = await supabase
      .from('decisions')
      .insert({
        user_id: req.user?.userId,
        type: data.type,
        title: data.title,
        description: data.description,
        decision_deadline: data.decisionDeadline,
        parameters: data.parameters || {},
        constraints: data.constraints || [],
      })
      .select()
      .single()

    if (decisionError) throw decisionError

    // Create options
    const optionsToInsert = data.options.map(option => ({
      decision_id: decision.id,
      title: option.title,
      description: option.description,
      parameters: option.parameters || {},
      pros: option.pros || [],
      cons: option.cons || [],
    }))

    const { data: options, error: optionsError } = await supabase
      .from('decision_options')
      .insert(optionsToInsert)
      .select()

    if (optionsError) throw optionsError

    res.status(201).json({
      ...decision,
      decision_options: options,
    })
  } catch (error) {
    next(error)
  }
})

// Get single decision
decisionRouter.get('/:id', async (req, res, next) => {
  try {
    const { data: decision, error } = await supabase
      .from('decisions')
      .select(`
        *,
        decision_options (
          *,
          simulations (count)
        ),
        simulations (
          id,
          option_id,
          status,
          created_at,
          completed_at,
          aggregate_metrics
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user?.userId)
      .order('created_at', {
        foreignTable: 'simulations',
        ascending: false,
      })
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return next(createError('Decision not found', 404))
      }
      throw error
    }

    res.json(decision)
  } catch (error) {
    next(error)
  }
})

// Update decision
const updateDecisionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z
    .enum(['draft', 'analyzing', 'simulated', 'decided', 'implemented', 'archived'])
    .optional(),
  decisionDeadline: z.string().datetime().optional(),
  implementedAt: z.string().datetime().optional(),
})

decisionRouter.put('/:id', async (req, res, next) => {
  try {
    const data = updateDecisionSchema.parse(req.body)

    const updateData: any = { ...data }
    if (data.decisionDeadline) {
      updateData.decision_deadline = data.decisionDeadline
      delete updateData.decisionDeadline
    }
    if (data.implementedAt) {
      updateData.implemented_at = data.implementedAt
      delete updateData.implementedAt
    }

    const { data: decision, error } = await supabase
      .from('decisions')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user?.userId)
      .select(`
        *,
        decision_options (*)
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return next(createError('Decision not found', 404))
      }
      throw error
    }

    res.json(decision)
  } catch (error) {
    next(error)
  }
})

// Delete decision
decisionRouter.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('decisions')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user?.userId)

    if (error) {
      if (error.code === 'PGRST116') {
        return next(createError('Decision not found', 404))
      }
      throw error
    }

    res.json({ message: 'Decision deleted successfully' })
  } catch (error) {
    next(error)
  }
})
