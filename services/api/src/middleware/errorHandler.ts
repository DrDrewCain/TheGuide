import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export function createError(message: string, statusCode: number = 500, details?: any): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
}

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  // Handle Supabase errors
  if (err.message.includes('already registered')) {
    return res.status(409).json({
      error: 'Resource already exists',
    });
  }

  if (err.message.includes('PGRST116')) {
    return res.status(404).json({
      error: 'Resource not found',
    });
  }

  // Handle custom API errors
  const apiError = err as ApiError;
  const statusCode = apiError.statusCode || 500;
  const message = apiError.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(apiError.details && { details: apiError.details }),
  });
}