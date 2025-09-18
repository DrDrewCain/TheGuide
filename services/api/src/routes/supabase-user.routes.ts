import { Router } from 'express';
import { authenticateSupabase } from '../middleware/supabase-auth.middleware.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { createError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const userRouter = Router();

// All user routes require authentication
userRouter.use(authenticateSupabase);

// Get user profile
userRouter.get('/profile', async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user!.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Get user email from auth
    const { data: authUser } = await supabase.auth.getUser(req.supabaseAccessToken!);

    if (!profile) {
      // Profile should be created automatically, but if not, create it
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({ id: req.user!.userId })
        .select()
        .single();

      if (createError) throw createError;

      return res.json({
        ...newProfile,
        user: {
          id: authUser.user!.id,
          email: authUser.user!.email,
          email_verified: authUser.user!.email_confirmed_at != null,
          created_at: authUser.user!.created_at,
        },
      });
    }

    res.json({
      ...profile,
      user: {
        id: authUser.user!.id,
        email: authUser.user!.email,
        email_verified: authUser.user!.email_confirmed_at != null,
        created_at: authUser.user!.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
const updateProfileSchema = z.object({
  age: z.number().min(18).max(120).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  dependents: z.number().min(0).max(20).optional(),
  currentRole: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  yearsExperience: z.number().min(0).max(60).optional(),
  salary: z.number().min(0).max(10000000).optional(),
  financialData: z.object({}).optional(),
  preferences: z.object({}).optional(),
});

userRouter.put('/profile', async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    // Map camelCase to snake_case for database
    const dbData: any = {};
    if (data.age !== undefined) dbData.age = data.age;
    if (data.city !== undefined) dbData.city = data.city;
    if (data.state !== undefined) dbData.state = data.state;
    if (data.country !== undefined) dbData.country = data.country;
    if (data.zipCode !== undefined) dbData.zip_code = data.zipCode;
    if (data.maritalStatus !== undefined) dbData.marital_status = data.maritalStatus;
    if (data.dependents !== undefined) dbData.dependents = data.dependents;
    if (data.currentRole !== undefined) dbData.current_role = data.currentRole;
    if (data.industry !== undefined) dbData.industry = data.industry;
    if (data.company !== undefined) dbData.company = data.company;
    if (data.yearsExperience !== undefined) dbData.years_experience = data.yearsExperience;
    if (data.salary !== undefined) dbData.salary = data.salary;
    if (data.financialData !== undefined) dbData.financial_data = data.financialData;
    if (data.preferences !== undefined) dbData.preferences = data.preferences;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: req.user!.userId,
        ...dbData,
      })
      .select()
      .single();

    if (error) throw error;

    // Get user email from auth
    const { data: authUser } = await supabase.auth.getUser(req.supabaseAccessToken!);

    res.json({
      ...profile,
      user: {
        id: authUser.user!.id,
        email: authUser.user!.email,
        email_verified: authUser.user!.email_confirmed_at != null,
        created_at: authUser.user!.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete user account
userRouter.delete('/account', async (req, res, next) => {
  try {
    // Use admin client to delete user (cascades will handle related data)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.user!.userId);

    if (error) throw error;

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});