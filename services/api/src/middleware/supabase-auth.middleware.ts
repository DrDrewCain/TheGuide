import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { createError } from './errorHandler.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
      supabaseAccessToken?: string;
    }
  }
}

export async function authenticateSupabase(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('Authorization header missing', 401));
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return next(createError('Invalid access token', 401));
    }

    // Attach user info to request
    req.user = {
      userId: data.user.id,
      email: data.user.email!,
    };
    req.supabaseAccessToken = token;

    next();
  } catch (error) {
    return next(createError('Authentication failed', 401));
  }
}

// Middleware for optional authentication (doesn't fail if no token)
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data } = await supabase.auth.getUser(token);

      if (data.user) {
        req.user = {
          userId: data.user.id,
          email: data.user.email!,
        };
        req.supabaseAccessToken = token;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}